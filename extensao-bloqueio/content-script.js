// content-script.js
// Roda dentro da aba do FocusFlow (apenas nas URLs definidas em manifest.json).
// Escuta o evento que o timer.js dispara e repassa pro service worker da extensão,
// já que eles rodam em "mundos" JS separados e não podem chamar funções um do outro.

console.log('[FocusFlow ext] content script carregado em', window.location.href);

window.addEventListener('focusflow:session-update', (event) => {
  console.log('[FocusFlow ext] evento recebido da página:', event.detail);

  chrome.runtime.sendMessage({
    type: 'session-update',
    isRunning: event.detail.isRunning,
    mode: event.detail.mode,
  });
});