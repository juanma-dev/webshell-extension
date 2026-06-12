// WebShell — picker: clic sobre cualquier elemento de la página → selector CSS.
// La terminal se oculta durante la selección y reaparece con el selector listo.
"use strict";

(function (WS) {
  /** Parte de selector para un elemento: tag + hasta 2 clases "estables". */
  function cssPart(el) {
    let part = el.tagName.toLowerCase();
    const classes = Array.from(el.classList)
      // Descarta clases que parecen generadas (hashes, css-in-js, utilitarias raras).
      .filter((c) => /^[A-Za-z][A-Za-z0-9_-]{1,29}$/.test(c) && !/\d{3,}/.test(c))
      .slice(0, 2);
    if (classes.length) part += "." + classes.map((c) => CSS.escape(c)).join(".");
    return part;
  }

  /**
   * Calcula un selector para el elemento. Prefiere id único; si no,
   * sube por los padres hasta que el selector sea único o se acabe la paciencia.
   * Devuelve { selector, count } — count > 1 es útil para extraer listas.
   */
  WS.selectorFor = function (el) {
    if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
      const s = "#" + CSS.escape(el.id);
      if (document.querySelectorAll(s).length === 1) return { selector: s, count: 1 };
    }

    let node = el;
    let selector = cssPart(el);
    const candidates = [];
    for (let depth = 0; depth < 5; depth++) {
      const count = document.querySelectorAll(selector).length;
      candidates.push({ selector, count });
      if (count === 1) return { selector, count };
      node = node.parentElement;
      if (!node || node === document.documentElement || node === document.body) break;
      selector = cssPart(node) + " > " + selector;
    }
    // Sin selector único (el elemento es parte de una lista): los ancestros que
    // no reducen las coincidencias solo añaden fragilidad. Devuelve el más corto
    // que captura el mismo conjunto final.
    const finalCount = candidates[candidates.length - 1].count;
    return candidates.find((c) => c.count === finalCount);
  };

  let active = false;
  let highlight = null;

  function makeHighlight() {
    const div = document.createElement("div");
    div.id = "webshell-picker-highlight";
    div.style.cssText =
      "position:fixed; pointer-events:none; z-index:2147483646;" +
      "background:rgba(80,250,123,0.15); outline:2px solid #50fa7b;" +
      "transition:all 40ms linear;";
    document.documentElement.appendChild(div);
    return div;
  }

  function moveHighlight(el) {
    const r = el.getBoundingClientRect();
    highlight.style.left = r.left + "px";
    highlight.style.top = r.top + "px";
    highlight.style.width = r.width + "px";
    highlight.style.height = r.height + "px";
  }

  function stop() {
    active = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    if (highlight) {
      highlight.remove();
      highlight = null;
    }
  }

  function onMove(e) {
    const el = e.target;
    if (!(el instanceof Element) || el.closest("#webshell-root")) return;
    moveHighlight(el);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stop();
      const term = WS.terminal;
      term.toggle();
      term.print("pick: cancelado");
    }
  }

  function onClick(e) {
    const el = e.target;
    if (!(el instanceof Element) || el.closest("#webshell-root")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    stop();

    const { selector, count } = WS.selectorFor(el);
    const term = WS.terminal;
    term.toggle();
    term.print(`selector: ${selector}`);
    if (count === 1) {
      term.print("coincide con 1 elemento (exacto)");
    } else {
      term.print(`coincide con ${count} elementos — ideal para extraer la lista completa`);
    }
    // Deja un comando listo en el prompt para que solo presione Enter.
    const suggestion = el.tagName === "TABLE" || count > 1 ? "extract" : "text";
    term.input.value = `${suggestion} "${selector}"`;
    term.input.focus();
  }

  /** Activa el modo selección. Lo invoca el comando `pick`. */
  WS.startPicker = function (term) {
    if (active) return;
    active = true;
    term.hide();
    highlight = makeHighlight();
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  };
})(window.WebShell);
