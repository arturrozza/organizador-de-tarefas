// notifications.js
// Única responsabilidade: lidar com a Notification API do navegador.
// Não sabe nada sobre timer ou tarefas — só recebe um título e um corpo de texto.

/**
 * Pede permissão de notificação ao navegador.
 * Precisa ser chamado a partir de uma ação do usuário (ex: clique no "Iniciar"),
 * já que navegadores bloqueiam esse pedido se disparado sozinho ao carregar a página.
 */
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Dispara uma notificação do navegador, se permitida.
 * Se o usuário nunca permitiu (ou negou), falha silenciosamente —
 * o timer continua funcionando normalmente sem o aviso do sistema.
 */
function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(title, { body });
}