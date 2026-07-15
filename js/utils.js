// utils.js
// Funções pequenas e reaproveitáveis, sem dependência de outros módulos.

/**
 * Gera um ID único simples (timestamp + número aleatório).
 * Não precisa ser criptograficamente seguro, só único o suficiente
 * pra diferenciar tarefas na lista.
 */
function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/**
 * Atalho pra document.querySelector
 */
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Atalho pra document.querySelectorAll, já retornando um array
 * (querySelectorAll retorna NodeList, que não tem todos os métodos de array)
 */
function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Converte segundos totais em uma string "MM:SS", sempre com 2 dígitos.
 * Ex: formatTime(65) -> "01:05"
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}