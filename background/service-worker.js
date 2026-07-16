// WebShell — service worker.
// Desktop notifications for `watch`, HTTP for ping/curl (content scripts are
// CORS-bound; the worker isn't, thanks to host_permissions), per-tab terminal
// state, and opening the terminal from the icon or shortcut (Alt+W).
"use strict";

const BODY_CAP = 512 * 1024; // 512 KB of body is plenty for a terminal

async function httpPing(url) {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    let resp;
    try {
      resp = await fetch(url, { method: "HEAD", cache: "no-store", signal: ctrl.signal });
    } catch {
      // Some servers refuse HEAD at the network level; measure with GET then.
      resp = await fetch(url, { method: "GET", cache: "no-store", signal: ctrl.signal });
    }
    return { ok: true, ms: Date.now() - t0, status: resp.status };
  } catch (e) {
    const error =
      e && e.name === "AbortError" ? "timeout (8s)" : String((e && e.message) || e);
    return { ok: false, ms: Date.now() - t0, error };
  } finally {
    clearTimeout(timer);
  }
}

async function httpGet(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const resp = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    let body = "";
    let truncated = false;
    const reader = resp.body && resp.body.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      while (body.length <= BODY_CAP) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
      }
      if (body.length > BODY_CAP) {
        body = body.slice(0, BODY_CAP);
        truncated = true;
        reader.cancel().catch(() => {});
      }
    }
    return {
      ok: true,
      status: resp.status,
      statusText: resp.statusText,
      headers: Array.from(resp.headers.entries()),
      body,
      truncated,
    };
  } catch (e) {
    const error =
      e && e.name === "AbortError" ? "timeout (20s)" : String((e && e.message) || e);
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

// Terminal open/closed per tab, so navigation can restore it.
// chrome.storage.session survives the worker going idle; tabs clean up on close.
const stateKey = (tabId) => "ws:open:" + tabId;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === "notify") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: msg.title || "WebShell",
      message: msg.message || "",
      priority: 1,
    });
    return;
  }

  if (msg.type === "terminal-state" && sender.tab && sender.tab.id != null) {
    chrome.storage.session.set({ [stateKey(sender.tab.id)]: !!msg.open });
    return;
  }

  if (msg.type === "get-terminal-state" && sender.tab && sender.tab.id != null) {
    const key = stateKey(sender.tab.id);
    chrome.storage.session
      .get(key)
      .then((obj) => sendResponse({ open: !!obj[key] }))
      .catch(() => sendResponse({ open: false }));
    return true; // async response
  }

  if (msg.type === "ping") {
    httpPing(msg.url).then(sendResponse);
    return true;
  }

  if (msg.type === "curl") {
    httpGet(msg.url).then(sendResponse);
    return true;
  }

  // Open the extension's options page (content scripts can't call this API
  // directly). Used by the "Options" affordances in the terminal.
  if (msg.type === "open-options") {
    chrome.runtime.openOptionsPage();
    return;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(stateKey(tabId)).catch(() => {});
});

const CONTENT_FILES = [
  "content/dom-utils.js",
  "content/storage.js",
  "content/commands.js",
  "content/parser.js",
  "content/picker.js",
  "content/terminal.js",
];

/**
 * Toggles the terminal in a tab. If the content script isn't there
 * (the page was opened before installing/reloading the extension),
 * inject it on the spot — no page reload needed.
 */
async function toggleInTab(tab) {
  if (!tab || tab.id == null) return;
  const url = tab.url || "";
  // Browser-internal pages and the Web Store don't allow injection.
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
      console.warn("WebShell: could not inject into tab", tab.id, e);
    }
  }
}

chrome.action.onClicked.addListener(toggleInTab);

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-terminal") toggleInTab(tab);
});
