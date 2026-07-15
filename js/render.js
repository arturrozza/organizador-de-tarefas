// render.js
// Única responsabilidade: pegar o estado atual e desenhar na tela.
// Não decide regras de negócio, não mexe no localStorage — só renderiza.

function renderTasks() {
  const listEl = qs('#task-list');
  const emptyEl = qs('#task-empty');
  const tasksToShow = getFilteredTasks();

  // Limpa a lista atual antes de redesenhar
  listEl.innerHTML = '';

  // Mostra/esconde a mensagem de "lista vazia"
  if (tasksToShow.length === 0) {
    emptyEl.classList.add('visible');
  } else {
    emptyEl.classList.remove('visible');
  }

  tasksToShow.forEach((task) => {
    const li = document.createElement('li');
    const isActive = task.id === state.activeTaskId;

    li.className = 'task-item' + (task.done ? ' done' : '') + (isActive ? ' active' : '');
    li.dataset.priority = task.priority;
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-checkbox" data-action="toggle" aria-label="Marcar como concluída"></button>
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button class="task-focus" data-action="focus" aria-label="Focar nessa tarefa" title="Usar no timer">
        ${isActive ? '◉' : '○'}
      </button>
      <button class="task-delete" data-action="delete" aria-label="Excluir tarefa">✕</button>
    `;

    listEl.appendChild(li);
  });

  renderCounts();
}

/**
 * Atualiza os contadores "X pendentes / Y concluídas" no cabeçalho.
 */
function renderCounts() {
  const { pending, done } = getTaskCounts();
  qs('#tasks-pending-count').textContent = `${pending} pendente${pending === 1 ? '' : 's'}`;
  qs('#tasks-done-count').textContent = `${done} concluída${done === 1 ? '' : 's'}`;
}

/**
 * Evita que o texto da tarefa quebre o HTML se o usuário digitar
 * algo como "<script>" ou "<b>" no título.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}