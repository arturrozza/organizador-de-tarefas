// state.js
// Guarda o estado da aplicação (tarefas + filtro ativo) e é o único lugar
// que pode alterá-lo. Ninguém mexe em `state.tasks` diretamente de fora —
// sempre passa pelas funções daqui, que cuidam de salvar e avisar a tela.

const state = {
  tasks: [],         // { id, title, priority, done }
  filter: 'all',      // 'all' | 'pending' | 'done'
  activeTaskId: null, // id da tarefa que está sendo trabalhada no timer agora
};

// Lista de funções que querem ser avisadas quando o estado mudar.
// O render.js se inscreve aqui pra saber quando redesenhar a tela.
const listeners = [];

function subscribe(listenerFn) {
  listeners.push(listenerFn);
}

function notify() {
  listeners.forEach((listenerFn) => listenerFn(state));
}

/**
 * Carrega as tarefas salvas (chamado uma vez, no início da aplicação).
 */
function initState() {
  state.tasks = loadTasks();
  notify();
}

/**
 * Adiciona uma nova tarefa. Prioridade padrão: 'medium'.
 */
function addTask(title, priority = 'medium') {
  const trimmed = title.trim();
  if (!trimmed) return;

  state.tasks.push({
    id: generateId(),
    title: trimmed,
    priority,
    done: false,
  });

  saveTasks(state.tasks);
  notify();
}

/**
 * Alterna o status concluído/pendente de uma tarefa.
 */
function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  task.done = !task.done;
  saveTasks(state.tasks);
  notify();
}

/**
 * Remove uma tarefa pelo ID.
 */
function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);

  // Se a tarefa excluída era a que estava "em foco" no timer, limpa o vínculo
  if (state.activeTaskId === id) {
    state.activeTaskId = null;
  }

  saveTasks(state.tasks);
  notify();
}

/**
 * Marca uma tarefa como "ativa" — é essa que aparece no timer enquanto
 * o usuário trabalha nela. Clicar de novo na mesma tarefa desmarca.
 */
function setActiveTask(id) {
  state.activeTaskId = state.activeTaskId === id ? null : id;
  notify();
}

/**
 * Retorna o objeto da tarefa atualmente ativa (ou null, se nenhuma).
 */
function getActiveTask() {
  return state.tasks.find((t) => t.id === state.activeTaskId) || null;
}

/**
 * Muda o filtro ativo ('all' | 'pending' | 'done').
 */
function setFilter(filter) {
  state.filter = filter;
  notify();
}

/**
 * Retorna as tarefas já filtradas, de acordo com o filtro ativo.
 * É isso que o render.js usa pra desenhar a lista.
 */
function getFilteredTasks() {
  if (state.filter === 'pending') return state.tasks.filter((t) => !t.done);
  if (state.filter === 'done') return state.tasks.filter((t) => t.done);
  return state.tasks;
}

/**
 * Contadores usados no cabeçalho ("3 pendentes", "2 concluídas").
 */
function getTaskCounts() {
  const pending = state.tasks.filter((t) => !t.done).length;
  const done = state.tasks.filter((t) => t.done).length;
  return { pending, done };
}