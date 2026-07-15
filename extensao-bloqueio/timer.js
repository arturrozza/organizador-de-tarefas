// timer.js
// Lógica completa do Pomodoro: presets de duração, contagem regressiva,
// troca automática de modo (foco -> pausa -> foco...) e o efeito visual
// do anel (halo). Mantém seu próprio estado local, separado do state.js
// de tarefas, já que são domínios independentes do app.

const PRESETS = {
  classic: {
    label: 'Clássico',
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
    cyclesUntilLong: 4,
  },
  method5217: {
    label: '52/17',
    focus: 52 * 60,
    short: 17 * 60,
    long: 30 * 60,
    cyclesUntilLong: 4,
  },
  method9020: {
    label: '90/20',
    focus: 90 * 60,
    short: 20 * 60,
    long: 30 * 60,
    cyclesUntilLong: 2,
  },
};

const CIRCLE_CIRCUMFERENCE = 502.65; // 2 * PI * 80 (raio do círculo no SVG)

const timerState = {
  presetKey: 'classic',
  mode: 'focus',       // 'focus' | 'short' | 'long'
  remaining: PRESETS.classic.focus,
  isRunning: false,
  intervalId: null,
  cyclesCompleted: 0,
};

// ---------- Elementos da tela (preenchidos em initTimer) ----------
let els = {};

// ---------- Ponte com a extensão de bloqueio ----------
// A extensão não consegue ler as variáveis do timer.js diretamente
// (roda em um "mundo isolado" do Chrome). A forma de conversar com ela
// é disparando um evento customizado no `window`, que o content script
// da extensão escuta e repassa pro service worker.
function broadcastSession() {
  window.dispatchEvent(new CustomEvent('focusflow:session-update', {
    detail: {
      isRunning: timerState.isRunning,
      mode: timerState.mode,
    },
  }));
}

function initTimer() {
  els = {
    presetSelect: qs('#timer-preset'),
    modePills: qsa('.mode-pill'),
    startBtn: qs('#btn-start'),
    resetBtn: qs('#btn-reset'),
    clockTime: qs('#clock-time'),
    clockLabel: qs('#clock-label'),
    clockProg: qs('#clock-prog'),
    clockRing: qs('.clock-ring'),
    cyclesDots: qs('#cycles-dots'),
    cycleCount: qs('#cycle-count'),
    activeTaskWrap: qs('#active-task'),
    activeTaskName: qs('#active-task-name'),
  };

  // Sempre que o state mudar (tarefas, filtro, tarefa ativa), atualiza
  // o nome exibido no sidebar do timer.
  subscribe(renderActiveTask);

  els.presetSelect.addEventListener('change', (event) => {
    selectPreset(event.target.value);
  });

  els.modePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pauseTimer();
      setMode(pill.dataset.mode);
    });
  });

  els.startBtn.addEventListener('click', toggleTimer);
  els.resetBtn.addEventListener('click', resetTimer);

  renderCycleDots();
  updateDisplay();
  renderActiveTask();
}

/**
 * Atualiza o nome da tarefa em foco exibido no sidebar do timer.
 * É chamado sempre que o state notifica uma mudança (nova tarefa marcada
 * como ativa, tarefa excluída, etc).
 */
function renderActiveTask() {
  const activeTask = getActiveTask();

  if (activeTask) {
    els.activeTaskName.textContent = activeTask.title;
    els.activeTaskWrap.classList.add('has-task');
  } else {
    els.activeTaskName.textContent = 'Nenhuma tarefa selecionada';
    els.activeTaskWrap.classList.remove('has-task');
  }
}

// ---------- Presets ----------

function selectPreset(key) {
  if (!PRESETS[key]) return;

  pauseTimer();
  timerState.presetKey = key;
  timerState.cyclesCompleted = 0;
  setMode('focus');
  renderCycleDots();
}

function currentPreset() {
  return PRESETS[timerState.presetKey];
}

// ---------- Troca de modo ----------

function setMode(mode) {
  timerState.mode = mode;
  timerState.remaining = currentPreset()[mode];

  els.modePills.forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.mode === mode);
  });

  els.clockLabel.textContent = mode === 'focus' ? 'FOCO' : mode === 'short' ? 'PAUSA' : 'PAUSA LONGA';

  updateDisplay();
}

// ---------- Start / pausa / reset ----------

function toggleTimer() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  requestNotificationPermission();

  timerState.isRunning = true;
  els.startBtn.textContent = '⏸ Pausar';

  // O halo só acende durante o foco — pausa/descanso fica com o anel "apagado"
  if (timerState.mode === 'focus') {
    els.clockRing.classList.add('is-running');
  }

  timerState.intervalId = setInterval(tick, 1000);
  broadcastSession();
}

function pauseTimer() {
  timerState.isRunning = false;
  els.startBtn.textContent = '▶ Iniciar';
  els.clockRing.classList.remove('is-running');

  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  broadcastSession();
}

function resetTimer() {
  pauseTimer();
  timerState.remaining = currentPreset()[timerState.mode];
  updateDisplay();
  broadcastSession();
}

// ---------- Contagem regressiva ----------

function tick() {
  timerState.remaining -= 1;

  if (timerState.remaining <= 0) {
    handleModeComplete();
    return;
  }

  updateDisplay();
}

/**
 * Chamado quando o tempo de um modo zera.
 * Notifica o usuário e avança automaticamente pro próximo modo.
 */
function handleModeComplete() {
  const finishedMode = timerState.mode;

  if (finishedMode === 'focus') {
    timerState.cyclesCompleted += 1;
  }

  const nextMode = getNextMode(finishedMode);

  sendNotification(
    finishedMode === 'focus' ? 'Foco concluído!' : 'Pausa concluída!',
    nextMode === 'focus' ? 'Hora de voltar ao foco.' : 'Hora de descansar um pouco.'
  );

  renderCycleDots();
  setMode(nextMode);

  // Continua contando automaticamente no próximo modo, sem precisar
  // clicar em "Iniciar" de novo — é o comportamento pedido: troca automática.
  timerState.intervalId = setInterval(tick, 1000);

  if (nextMode === 'focus') {
    els.clockRing.classList.add('is-running');
  } else {
    els.clockRing.classList.remove('is-running');
  }

  broadcastSession();
}

function getNextMode(finishedMode) {
  if (finishedMode !== 'focus') return 'focus';

  const isLongBreakTime = timerState.cyclesCompleted % currentPreset().cyclesUntilLong === 0;
  return isLongBreakTime ? 'long' : 'short';
}

// ---------- Renderização do relógio ----------

function updateDisplay() {
  els.clockTime.textContent = formatTime(timerState.remaining);

  const total = currentPreset()[timerState.mode];
  const elapsedRatio = 1 - timerState.remaining / total; // 0 no início, 1 quando o tempo acaba
  const offset = CIRCLE_CIRCUMFERENCE * elapsedRatio;
  els.clockProg.style.strokeDashoffset = offset;
}

function renderCycleDots() {
  const total = currentPreset().cyclesUntilLong;
  const filled = timerState.cyclesCompleted % total;

  els.cyclesDots.innerHTML = '';
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i < filled ? ' filled' : '');
    els.cyclesDots.appendChild(dot);
  }

  els.cycleCount.textContent = `${filled} / ${total}`;
}
