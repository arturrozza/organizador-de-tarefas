// storage.js
// Única responsabilidade: conversar com o localStorage.
// Não sabe nada sobre estado da aplicação nem sobre a tela.

const STORAGE_KEY = 'focusflow.tasks';

/**
 * Lê as tarefas salvas no localStorage.
 * Retorna um array vazio se não houver nada salvo ainda,
 * ou se o conteúdo salvo estiver corrompido (JSON inválido).
 */
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Falha ao ler tarefas salvas, iniciando lista vazia:', err);
    return [];
  }
}

/**
 * Salva o array de tarefas inteiro no localStorage.
 * Sempre sobrescreve — quem decide o que salvar é o state.js.
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Falha ao salvar tarefas:', err);
  }
}