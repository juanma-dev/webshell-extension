// WebShell — terminal overlay: UI, historial y atajo Ctrl+`.
"use strict";

(function (WS) {
  // Evita duplicados si el script se inyecta dos veces (declarado + programático).
  if (WS.terminal) return;

  class Terminal {
    constructor() {
      this.history = [];
      this.historyIndex = -1;
      this.built = false;
    }

    build() {
      // Limpia restos de una carga anterior de la extensión (tras recargarla).
      const old = document.getElementById("webshell-root");
      if (old) old.remove();

      this.root = document.createElement("div");
      this.root.id = "webshell-root";
      this.root.innerHTML = `
        <div id="webshell-bar">
          <span id="webshell-title">webshell — ${location.hostname}</span>
          <button id="webshell-close" title="Cerrar (Esc)">×</button>
        </div>
        <div id="webshell-output"></div>
        <div id="webshell-prompt-line">
          <span id="webshell-prompt">$</span>
          <input id="webshell-input" type="text" spellcheck="false"
                 autocomplete="off" placeholder='escribe "help" para empezar' />
        </div>`;
      document.documentElement.appendChild(this.root);

      this.output = this.root.querySelector("#webshell-output");
      this.input = this.root.querySelector("#webshell-input");

      this.root.querySelector("#webshell-close").addEventListener("click", () => this.hide());
      this.input.addEventListener("keydown", (e) => this.onKey(e));
      // Evita que la página capture lo que escribes en la terminal.
      this.root.addEventListener("keydown", (e) => e.stopPropagation());
      this.root.addEventListener("keyup", (e) => e.stopPropagation());
      this.root.addEventListener("keypress", (e) => e.stopPropagation());

      this.print("WebShell v0.1 — la página es tu sistema de archivos.");
      this.print('Prueba:  ls a   ·   links   ·   extract table | to-csv > datos.csv');
      this.built = true;
    }

    toggle() {
      if (!this.built) this.build();
      if (this.root.classList.contains("webshell-open")) {
        this.hide();
      } else {
        this.root.classList.add("webshell-open");
        this.input.focus();
      }
    }

    hide() {
      this.root.classList.remove("webshell-open");
      this.input.blur();
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
        this.history.push(line);
        this.historyIndex = this.history.length;
        this.printCmd(line);
        try {
          WS.run(line, this);
        } catch (err) {
          this.printError(err.message);
        }
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
      } else if (e.key === "Escape") {
        this.hide();
      }
    }
  }

  const term = new Terminal();
  WS.terminal = term;

  // Ctrl+` (backquote) abre/cierra la terminal en cualquier página.
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

  // El icono de la extensión también la abre (mensaje desde el service worker).
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "toggle-terminal") term.toggle();
  });
})(window.WebShell);
