// WebShell — terminal overlay: UI, persistent history, Tab completion,
// resizable window, themes, and the Ctrl+` shortcut.
"use strict";

(function (WS) {
  // Avoid duplicates if the script gets injected twice (declared + programmatic).
  if (WS.terminal) return;

  const MIN_HEIGHT = 140;

  class Terminal {
    constructor() {
      this.history = [];
      this.historyIndex = 0;
      this.built = false;
      this.settings = { theme: "auto", height: null, historyLimit: 200 };
    }

    build() {
      // Clean up leftovers from a previous extension load (after reloading it).
      const old = document.getElementById("webshell-root");
      if (old) old.remove();

      this.root = document.createElement("div");
      this.root.id = "webshell-root";
      this.root.innerHTML = `
        <div id="webshell-resize" title="Drag to resize"></div>
        <div id="webshell-bar">
          <span id="webshell-title">webshell — ${location.hostname}</span>
          <button id="webshell-close" title="Close (Esc)">×</button>
        </div>
        <div id="webshell-output"></div>
        <div id="webshell-prompt-line">
          <span id="webshell-prompt">$</span>
          <input id="webshell-input" type="text" spellcheck="false"
                 autocomplete="off" placeholder='type "help" to get started' />
        </div>`;
      document.documentElement.appendChild(this.root);

      this.output = this.root.querySelector("#webshell-output");
      this.input = this.root.querySelector("#webshell-input");

      this.root.querySelector("#webshell-close").addEventListener("click", () => this.hide());
      this.input.addEventListener("keydown", (e) => this.onKey(e));
      // Keep the page from capturing what you type in the terminal.
      this.root.addEventListener("keydown", (e) => e.stopPropagation());
      this.root.addEventListener("keyup", (e) => e.stopPropagation());
      this.root.addEventListener("keypress", (e) => e.stopPropagation());

      this.initResize();

      let version = "0.2";
      try {
        version = chrome.runtime.getManifest().version;
      } catch {}
      this.print(`WebShell v${version} — the page is your filesystem.`);
      this.print("Try:  ls a   ·   pick   ·   extract table | to-csv > data.csv   ·   Tab completes");
      this.built = true;
      this.applySettings();
      this.loadHistory();
    }

    async applySettings() {
      this.settings = await WS.settings.load();
      if (this.settings.height) {
        const h = Math.min(
          Math.max(this.settings.height, MIN_HEIGHT),
          Math.round(window.innerHeight * 0.9)
        );
        this.root.style.height = h + "px";
      }
      WS.applyTheme(this.settings.theme);
    }

    async loadHistory() {
      const saved = await WS.store.get(WS.hostKey("history"), []);
      if (Array.isArray(saved) && saved.length) {
        // Anything typed while loading (rare) stays at the tail.
        this.history = saved.concat(this.history);
      }
      this.historyIndex = this.history.length;
    }

    saveHistory() {
      const limit = this.settings.historyLimit || 200;
      WS.store.set(WS.hostKey("history"), this.history.slice(-limit));
    }

    initResize() {
      const handle = this.root.querySelector("#webshell-resize");
      let startY = 0;
      let startH = 0;
      const onMove = (e) => {
        const h = Math.min(
          Math.max(startH + (startY - e.clientY), MIN_HEIGHT),
          Math.round(window.innerHeight * 0.9)
        );
        this.root.style.height = h + "px";
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove, true);
        document.removeEventListener("pointerup", onUp, true);
        this.root.classList.remove("webshell-resizing");
        this.settings.height = this.root.offsetHeight;
        WS.settings.save({ height: this.settings.height });
      };
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startY = e.clientY;
        startH = this.root.offsetHeight;
        this.root.classList.add("webshell-resizing");
        document.addEventListener("pointermove", onMove, true);
        document.addEventListener("pointerup", onUp, true);
      });
    }

    toggle() {
      if (!this.built) this.build();
      if (this.root.classList.contains("webshell-open")) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      if (!this.built) this.build();
      this.root.classList.add("webshell-open");
      this.input.focus();
      this.setTabState(true);
    }

    hide() {
      this.root.classList.remove("webshell-open");
      this.input.blur();
      this.setTabState(false);
    }

    /** Tells the service worker whether this tab's terminal is open, so it
        can be reopened automatically after cd / reload / following a link. */
    setTabState(open) {
      try {
        const p = chrome.runtime.sendMessage({ type: "terminal-state", open });
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {}
    }

    print(text) {
      const line = document.createElement("div");
      line.className = "webshell-line";
      line.textContent = text;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    }

    printCmd(text) {
      const line = document.createElement("div");
      line.className = "webshell-line webshell-cmd";
      line.textContent = "$ " + text;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    }

    printError(text) {
      const line = document.createElement("div");
      line.className = "webshell-line webshell-error";
      line.textContent = "✗ " + text;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    }

    clear() {
      this.output.innerHTML = "";
    }

    onKey(e) {
      if (e.key === "Enter") {
        const line = this.input.value.trim();
        this.input.value = "";
        if (!line) return;
        if (this.history[this.history.length - 1] !== line) {
          this.history.push(line);
          this.saveHistory();
        }
        this.historyIndex = this.history.length;
        this.printCmd(line);
        WS.run(line, this).catch((err) => this.printError(err.message));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.input.value = "";
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        this.complete();
      } else if (e.key === "Escape") {
        this.hide();
      }
    }

    /** Tab completion: command names on the first word of a stage,
        selector candidates from the page (tags, #ids, .classes) after it. */
    complete() {
      const val = this.input.value;
      if (this.input.selectionStart !== val.length) return; // only at the end

      const stageStart = Math.max(val.lastIndexOf("|"), val.lastIndexOf(">"));
      const stage = val.slice(stageStart + 1);
      const endsWithSpace = /\s$/.test(stage) || stage === "";
      const words = stage.split(/\s+/).filter(Boolean);
      let prefix = endsWithSpace ? "" : words[words.length - 1] || "";
      const completingCommand = words.length === 0 || (words.length === 1 && !endsWithSpace);

      // `text "a.Li<Tab>` — complete inside an open quote too.
      let quote = "";
      if (prefix.startsWith('"') || prefix.startsWith("'")) {
        quote = prefix[0];
        prefix = prefix.slice(1);
      }

      const pool = completingCommand ? Object.keys(WS.commands) : WS.selectorCandidates();
      const matches = pool.filter((c) => c.startsWith(prefix) && c !== prefix).sort();
      if (!matches.length) return;

      const typed = quote + prefix;
      const apply = (text, addSpace) => {
        this.input.value =
          val.slice(0, val.length - typed.length) + quote + text + (addSpace ? " " : "");
      };

      if (matches.length === 1) {
        apply(matches[0], completingCommand && !quote);
        return;
      }
      let common = matches[0];
      for (const m of matches) {
        while (!m.startsWith(common)) common = common.slice(0, -1);
      }
      if (common.length > prefix.length) {
        apply(common, false);
      } else {
        this.print(matches.slice(0, 30).join("   ") + (matches.length > 30 ? "   …" : ""));
      }
    }
  }

  // ---- theme ---------------------------------------------------------

  let schemeWatcher = null;

  /** Applies dark/light, or follows the OS scheme when set to auto. */
  WS.applyTheme = function (theme) {
    const root = document.getElementById("webshell-root");
    if (!root) return;
    if (schemeWatcher) {
      schemeWatcher.onchange = null;
      schemeWatcher = null;
    }
    let mode = theme;
    if (theme === "auto") {
      schemeWatcher = window.matchMedia("(prefers-color-scheme: light)");
      mode = schemeWatcher.matches ? "light" : "dark";
      schemeWatcher.onchange = () => WS.applyTheme("auto");
    }
    root.setAttribute("data-ws-theme", mode === "light" ? "light" : "dark");
  };

  const term = new Terminal();
  WS.terminal = term;

  // Live-apply theme changes made from the options page.
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes["ws:settings"] && term.built) {
        const s = changes["ws:settings"].newValue || {};
        term.settings = Object.assign({}, term.settings, s);
        WS.applyTheme(s.theme || "auto");
      }
    });
  } catch {}

  // Ctrl+` (backquote) toggles the terminal on any page.
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Backquote") {
        e.preventDefault();
        term.toggle();
      }
    },
    true
  );

  // The extension icon also opens it (message from the service worker).
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "toggle-terminal") term.toggle();
  });

  // On every page load: restore this site's watches, then reopen the terminal
  // if it was open in this tab before navigating (cd, reload, followed link…).
  (async () => {
    try {
      const restored = WS.restoreWatches ? await WS.restoreWatches() : 0;
      let reopen = false;
      try {
        const state = await WS.swRequest({ type: "get-terminal-state" });
        reopen = !!(state && state.open);
      } catch {
        /* service worker unreachable — leave the terminal closed */
      }
      if (reopen) {
        term.show();
        if (restored) term.print(`⚡ ${restored} watch(es) restored on ${location.hostname}`);
      }
    } catch {}
  })();
})(window.WebShell);
