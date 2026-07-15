// popup.js
// Interface do popup. Não guarda estado nenhum sozinho — sempre pergunta
// pro background.js (via mensagens) e reflete a resposta na tela.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-site-form');
  const input = document.getElementById('site-input');
  const list = document.getElementById('site-list');
  const emptyMsg = document.getElementById('site-empty');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  function render(state) {
    // Status no topo
    const isBlocking = state.isRunning && state.mode === 'focus';
    statusDot.classList.toggle('blocking', isBlocking);
    statusText.textContent = isBlocking
      ? 'Bloqueando agora'
      : state.isRunning
        ? 'Em pausa — sites liberados'
        : 'Timer parado';

    // Lista de sites
    list.innerHTML = '';
    emptyMsg.classList.toggle('visible', state.blockList.length === 0);

    state.blockList.forEach((domain) => {
      const li = document.createElement('li');
      li.className = 'site-item';
      li.innerHTML = `<span>${domain}</span><button data-domain="${domain}">remover</button>`;
      list.appendChild(li);
    });
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'get-state' }, render);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const domain = input.value.trim();
    if (!domain) return;

    chrome.runtime.sendMessage({ type: 'add-site', domain }, render);
    input.value = '';
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-domain]');
    if (!button) return;

    chrome.runtime.sendMessage(
      { type: 'remove-site', domain: button.dataset.domain },
      render
    );
  });

  refresh();
});
