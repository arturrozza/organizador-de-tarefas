// app.js
// Ponto de entrada da aplicação. Roda quando o DOM termina de carregar
// e é responsável por: inscrever o render como "ouvinte" do state,
// carregar os dados salvos, e ligar os eventos da tela de tarefas.
//
// O timer (Pomodoro) e as notificações ainda não foram implementados
// nesta etapa — a inicialização deles entra aqui quando estiverem prontos.

document.addEventListener('DOMContentLoaded', () => {
  // Sempre que o state mudar (adicionar, marcar, excluir, filtrar),
  // o render.js redesenha a lista automaticamente.
  subscribe(renderTasks);

  initState();   // carrega tarefas salvas do localStorage e dispara o primeiro render
  initTasks();   // liga os eventos de formulário, filtros e lista
  initTimer();   // liga o seletor de preset, os modos e o botão iniciar/pausar
});