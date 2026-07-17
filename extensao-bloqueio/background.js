// background.js (service worker)
// Cérebro da extensão. Guarda:
// - a lista de sites que o usuário cadastrou pra bloquear
// - se o timer do FocusFlow está rodando, e em qual modo
//
// Sempre que uma dessas duas coisas muda, decide se deve ativar
// ou desativar as regras de bloqueio de rede.

const STORAGE_KEY = 'focusflow_ext_state';

// Estado em memória do service worker (também persistido em chrome.storage.local
// pra sobreviver caso o service worker "durma" e acorde de novo).
let extState = {
  blockList: [],     // ex: ["youtube.com", "instagram.com"]
  isRunning: false,
  mode: 'focus',
};

// ---------- Inicialização ----------

chrome.runtime.onInstalled.addListener(() => {
  loadState();
});

loadState();

async function loadState() {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  if (saved[STORAGE_KEY]) {
    extState = { ...extState, ...saved[STORAGE_KEY] };
  }
  updateBlockingRules();
}

async function persistState() {
  await chrome.storage.local.set({ [STORAGE_KEY]: extState });
}

// ---------- Mensagens (do content script e do popup) ----------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'session-update') {
    // Veio do content script, refletindo o estado do timer na página do FocusFlow
    extState.isRunning = message.isRunning;
    extState.mode = message.mode;
    persistState();
    updateBlockingRules();
    sendResponse({ ok: true });
  }

  if (message.type === 'get-state') {
    // O popup pede o estado atual pra desenhar a tela
    sendResponse(extState);
  }

  if (message.type === 'add-site') {
    const domain = normalizeDomain(message.domain);
    if (domain && !extState.blockList.includes(domain)) {
      extState.blockList.push(domain);
      persistState();
      updateBlockingRules();
    }
    sendResponse(extState);
  }

  if (message.type === 'remove-site') {
    extState.blockList = extState.blockList.filter((d) => d !== message.domain);
    persistState();
    updateBlockingRules();
    sendResponse(extState);
  }

  // Necessário retornar true quando a resposta é assíncrona (usamos await acima)
  return true;
});

// ---------- Regras de bloqueio ----------

/**
 * Ativa o bloqueio apenas quando: o timer está rodando E o modo é 'focus'.
 * Em pausas (curta ou longa), os sites voltam a ficar liberados.
 */
async function updateBlockingRules() {
  const shouldBlock = extState.isRunning && extState.mode === 'focus';

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((rule) => rule.id);

  if (!shouldBlock || extState.blockList.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existingIds });
    return;
  }

  const newRules = extState.blockList.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(domain)}` },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame'],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: newRules,
  });
}

/**
 * Limpa o domínio digitado pelo usuário — aceita colar de várias formas
 * (com protocolo, com www., com caminho, query string, etc.) e sempre
 * retorna algo como "youtube.com", que é o formato que o urlFilter espera.
 */
function normalizeDomain(raw) {
  if (!raw) return null;

  let value = raw.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^[a-z]+:\/\//, '');  // remove "https://", "http://", etc.
  value = value.replace(/^www\./, '');         // remove "www."
  value = value.split('/')[0];                 // remove qualquer caminho depois do domínio
  value = value.split('?')[0];                 // remove query string
  value = value.split('#')[0];                 // remove fragmento (#âncora)
  value = value.replace(/\.+$/, '');           // remove ponto sobrando no final

  return value || null;
}