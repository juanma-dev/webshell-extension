// WebShell — picker: click any element on the page → CSS selector.
// The terminal hides while picking and reappears with the selector ready.
"use strict";

(function (WS) {
  /** True for class names that look machine-generated (css-in-js hashes like
      r-j5o65s, css-1dbjc4n, styles-module__x__nkA_U): any dash/underscore
      token of 5+ chars mixing letters and digits. */
  function looksGenerated(cls) {
    return cls
      .split(/[-_]+/)
      .some((tok) => tok.length >= 5 && /\d/.test(tok) && /[a-z]/i.test(tok));
  }

  /** Selector part for an element: stable test attribute, or tag + up to 2 stable classes. */
  function cssPart(el) {
    const tag = el.tagName.toLowerCase();
    // Modern sites (X, etc.) ship stable hooks for their own tests — best anchor there is.
    for (const attr of ["data-testid", "data-test", "data-qa"]) {
      const v = el.getAttribute(attr);
      if (v) return `${tag}[${attr}="${v.replace(/"/g, '\\"')}"]`;
    }
    let part = tag;
    const classes = Array.from(el.classList)
      .filter((c) => /^[A-Za-z][A-Za-z0-9_-]{1,29}$/.test(c) && !looksGenerated(c))
      .slice(0, 2);
    if (classes.length) part += "." + classes.map((c) => CSS.escape(c)).join(".");
    return part;
  }

  /**
   * Computes a selector for the element. Prefers a unique id; otherwise
   * climbs the ancestors until the selector is unique or patience runs out.
   * Returns { selector, count } — count > 1 is useful for extracting lists.
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
    // No unique selector (the element is part of a list): ancestors that don't
    // reduce the match count only add fragility. Return the shortest selector
    // that captures the same final set.
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
      term.print("pick: cancelled");
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
      term.print("matches 1 element (exact)");
    } else {
      term.print(`matches ${count} elements — great for extracting the whole list`);
    }
    // Leave a ready-to-run command in the prompt; just press Enter.
    const suggestion = el.tagName === "TABLE" || count > 1 ? "extract" : "text";
    term.input.value = `${suggestion} "${selector}"`;
    term.input.focus();
  }

  /** Enables pick mode. Invoked by the `pick` command. */
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
