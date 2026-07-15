// tasks.js
// Conecta os eventos do usuário (submit do form, cliques nos filtros e na lista)
// às funções do state.js. Não desenha nada na tela diretamente — quem faz
// isso é o render.js, disparado automaticamente pelo notify() do state.

function initTasks() {
  const form = qs('#task-form');
  const input = qs('#task-input');
  const prioritySelect = qs('#task-priority');
  const filtersWrap = qs('.tasks-filters');
  const listEl = qs('#task-list');

  // ---------- Adicionar tarefa ----------
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    addTask(input.value, prioritySelect.value);

    input.value = '';
    input.focus();
  });

  // ---------- Trocar filtro ----------
  filtersWrap.addEventListener('click', (event) => {
    const pill = event.target.closest('.filter-pill');
    if (!pill) return;

    qsa('.filter-pill', filtersWrap).forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    setFilter(pill.dataset.filter);
  });

  // ---------- Marcar como concluída / excluir ----------
  // Um único listener na lista (delegação de eventos), já que os itens
  // são recriados a cada renderTasks() — colocar listener em cada <li>
  // individualmente seria perdido no próximo redesenho.
  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const li = button.closest('.task-item');
    const id = li?.dataset.id;
    if (!id) return;

    if (button.dataset.action === 'toggle') {
      toggleTask(id);
    } else if (button.dataset.action === 'delete') {
      deleteTask(id);
    } else if (button.dataset.action === 'focus') {
      setActiveTask(id);
    }
  });
}