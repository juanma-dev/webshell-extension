// WebShell — utilidades DOM compartidas.
// Se carga primero; crea el namespace global del content script.
"use strict";

window.WebShell = window.WebShell || {};

(function (WS) {
  /** Busca elementos por selector CSS. Lanza error legible si el selector es inválido. */
  WS.query = function (selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      throw new Error(`selector inválido: "${selector}"`);
    }
  };

  /** Descripción corta de un elemento: etiqueta, id, clases y texto recortado. */
  WS.describe = function (el) {
    const id = el.id ? `#${el.id}` : "";
    const cls = el.classList.length
      ? "." + Array.from(el.classList).slice(0, 3).join(".")
      : "";
    const text = WS.snippet(el.textContent, 60);
    return `<${el.tagName.toLowerCase()}${id}${cls}> ${text}`;
  };

  /** Recorta texto colapsando espacios en blanco. */
  WS.snippet = function (text, max) {
    const clean = (text || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
  };

  /**
   * Extrae datos estructurados de un elemento, según su tipo.
   * - <table>  → array de filas (array de celdas)
   * - <ul>/<ol> → una fila por <li>
   * - <a>      → [texto, href]
   * - <img>    → [alt, src]
   * - otro     → una fila con su texto
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

  /** Convierte filas (array de arrays) a CSV con escapado RFC 4180. */
  WS.toCSV = function (rows) {
    const escape = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map((row) => row.map(escape).join(",")).join("\r\n");
  };

  /** Descarga un texto como archivo usando Blob + <a download> (sin permisos extra). */
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

  /** Normaliza la salida de un comando a filas para CSV/JSON. */
  WS.toRows = function (items) {
    return items.map((item) => {
      if (Array.isArray(item)) return item;
      if (item instanceof Element) return [WS.snippet(item.textContent, 500)];
      return [String(item)];
    });
  };

  /** Texto plano de un item de pipeline (elemento, fila o string). */
  WS.itemText = function (item) {
    if (item instanceof Element) return WS.snippet(item.textContent, 500);
    if (Array.isArray(item)) return item.join(" | ");
    return String(item);
  };
})(window.WebShell);
