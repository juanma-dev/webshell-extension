// WebShell — shared DOM utilities.
// Loaded first; creates the content script's global namespace.
"use strict";

window.WebShell = window.WebShell || {};

(function (WS) {
  /** Queries elements by CSS selector. Throws a readable error if invalid. */
  WS.query = function (selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      throw new Error(`invalid selector: "${selector}"`);
    }
  };

  /** Short description of an element: tag, id, classes and trimmed text. */
  WS.describe = function (el) {
    const id = el.id ? `#${el.id}` : "";
    const cls = el.classList.length
      ? "." + Array.from(el.classList).slice(0, 3).join(".")
      : "";
    const text = WS.snippet(el.textContent, 60);
    return `<${el.tagName.toLowerCase()}${id}${cls}> ${text}`;
  };

  /** Trims text, collapsing whitespace. */
  WS.snippet = function (text, max) {
    const clean = (text || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
  };

  /**
   * Extracts structured data from an element, by type.
   * - <table>  → array of rows (arrays of cells)
   * - <ul>/<ol> → one row per <li>
   * - <a>      → [text, href]
   * - <img>    → [alt, src]
   * - other    → one row with its text
   */
  WS.extract = function (el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "a") {
      return [[WS.snippet(el.textContent, 500), el.href || ""]];
    }
    if (tag === "img") {
      return [[el.alt || "", el.src || ""]];
    }
    if (tag === "table") {
      return Array.from(el.querySelectorAll("tr"))
        .map((tr) =>
          Array.from(tr.querySelectorAll("th,td")).map((c) =>
            WS.snippet(c.textContent, 500)
          )
        )
        .filter((row) => row.length > 0);
    }
    if (tag === "ul" || tag === "ol") {
      return Array.from(el.querySelectorAll(":scope > li")).map((li) => [
        WS.snippet(li.textContent, 500),
      ]);
    }
    return [[WS.snippet(el.textContent, 500)]];
  };

  /** Converts rows (array of arrays) to CSV with RFC 4180 escaping. */
  WS.toCSV = function (rows) {
    const escape = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map((row) => row.map(escape).join(",")).join("\r\n");
  };

  /** Downloads text as a file via Blob + <a download> (no extra permissions). */
  WS.downloadFile = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  /** Normalizes command output to rows for CSV/JSON. */
  WS.toRows = function (items) {
    return items.map((item) => {
      if (Array.isArray(item)) return item;
      if (item instanceof Element) return [WS.snippet(item.textContent, 500)];
      return [String(item)];
    });
  };

  /** Plain text of a pipeline item (element, row or string). */
  WS.itemText = function (item) {
    if (item instanceof Element) return WS.snippet(item.textContent, 500);
    if (Array.isArray(item)) return item.join(" | ");
    return String(item);
  };
})(window.WebShell);
