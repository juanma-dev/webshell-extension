// WebShell — service worker.
// Notificaciones de `watch`, y apertura de la terminal desde el icono o el atajo (Alt+W).
"use strict";

chrome.runtime.onMessage.addListener((msg, _sender) => {
  if (msg && msg.type === "notify") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: msg.title || "WebShell",
      message: msg.message || "",
      priority: 1,
    });
  }
});

const CONTENT_FILES = [
  "content/dom-utils.js",
  "content/commands.js",
  "content/parser.js",
  "content/terminal.js",
];

/**
 * Abre/cierra la terminal en una pestaña. Si el content script no está
 * (la página se abrió antes de instalar/recargar la extensión), lo inyecta
 * al momento — sin pedirle al usuario que recargue la página.
 */
async function toggleInTab(tab) {
  if (!tab || tab.id == null) return;
  const url = tab.url || "";
  // Páginas internas del navegador y la Web Store no permiten inyección.
  if (!/^(https?|file):/.test(url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-terminal" });
  } catch {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content/terminal.css"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: CONTENT_FILES,
      });
      await chrome.tabs.sendMessage(tab.id, { type: "toggle-terminal" });
    } catch (e) {
      console.warn("WebShell: no se pudo inyectar en la pestaña", tab.id, e);
    }
  }
}

chrome.action.onClicked.addListener(toggleInTab);

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-terminal") toggleInTab(tab);
});
