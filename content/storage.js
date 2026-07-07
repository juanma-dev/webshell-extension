// WebShell — chrome.storage helpers and service-worker messaging.
// Loaded right after dom-utils.js. Everything degrades gracefully when the
// extension context is gone (page kept open across an extension reload).
"use strict";

window.WebShell = window.WebShell || {};

(function (WS) {
  if (WS.store) return;

  const DEFAULTS = { theme: "auto", height: null, historyLimit: 200 };

  function area() {
    try {
      return chrome && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
    } catch {
      return null;
    }
  }

  WS.store = {
    /** Reads one key; resolves the fallback if storage is unavailable. */
    async get(key, fallback = null) {
      const a = area();
      if (!a) return fallback;
      try {
        const obj = await a.get(key);
        return obj && obj[key] !== undefined ? obj[key] : fallback;
      } catch {
        return fallback;
      }
    },
    async set(key, value) {
      const a = area();
      if (!a) return;
      try {
        await a.set({ [key]: value });
      } catch {
        /* quota or invalidated context — not worth breaking a command over */
      }
    },
    async remove(key) {
      const a = area();
      if (!a) return;
      try {
        await a.remove(key);
      } catch {}
    },
  };

  /** Key namespaced per site, e.g. ws:history:github.com */
  WS.hostKey = (name) => `ws:${name}:${location.hostname}`;

  WS.settings = {
    async load() {
      const saved = await WS.store.get("ws:settings", {});
      return Object.assign({}, DEFAULTS, saved);
    },
    async save(patch) {
      const saved = await WS.store.get("ws:settings", {});
      await WS.store.set("ws:settings", Object.assign({}, saved, patch));
    },
  };

  /** Request/response with the service worker (ping, curl, tab state). */
  WS.swRequest = function (msg) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          const err = chrome.runtime.lastError;
          if (err) reject(new Error(err.message));
          else resolve(res);
        });
      } catch {
        reject(new Error("extension was reloaded — refresh the page and retry"));
      }
    });
  };
})(window.WebShell);
