// WebShell — registro de comandos.
// Cada comando: fn(args, input, term) → array (salida del pipeline).
//   args:  argumentos ya tokenizados (sin el nombre del comando)
//   input: salida del comando anterior en el pipe, o null si es el primero
//   term:  la terminal (para imprimir con term.print / term.printHTML)
"use strict";

(function (WS) {
  const commands = {};
  WS.commands = commands;

  /** Si hay input en el pipe lo usa; si no, consulta el selector. */
  function elementsFrom(args, input, name) {
    if (input && input.length && input[0] instanceof Element) return input;
    if (!args[0]) throw new Error(`${name}: falta el selector. Uso: ${name} <selector>`);
    return WS.query(args[0]);
  }

  // ---------- información ----------

  commands.help = {
    desc: "muestra esta ayuda",
    usage: "help [comando]",
    fn(args, _input, term) {
      if (args[0]) {
        const c = commands[args[0]];
        if (!c) throw new Error(`no existe el comando "${args[0]}"`);
        term.print(`${args[0]} — ${c.desc}\n  uso: ${c.usage}`);
        return [];
      }
      const names = Object.keys(commands).sort();
      const width = Math.max(...names.map((n) => n.length));
      for (const n of names) {
        term.print(`  ${n.padEnd(width)}  ${commands[n].desc}`);
      }
      term.print('\nCombina con pipes:  extract table | to-csv > datos.csv');
      return [];
    },
  };

  commands.ls = {
    desc: "lista los elementos que coinciden con un selector CSS",
    usage: "ls <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "ls");
      els.forEach((el, i) => term.print(`[${i}] ${WS.describe(el)}`));
      term.print(`${els.length} elemento(s)`);
      return els;
    },
  };

  commands.count = {
    desc: "cuenta los items del pipe o de un selector",
    usage: "count [selector]",
    fn(args, input, term) {
      const n = input ? input.length : WS.query(args[0] || "*").length;
      term.print(String(n));
      return [n];
    },
  };

  commands.grep = {
    desc: "filtra items cuyo texto coincide con un patrón (regex, sin distinguir mayúsculas)",
    usage: "grep <patrón> [selector]   |   ... | grep <patrón>",
    fn(args, input, term) {
      if (!args[0]) throw new Error("grep: falta el patrón. Uso: grep <patrón> [selector]");
      const re = new RegExp(args[0], "i");
      const items = input || (args[1] ? WS.query(args[1]) : WS.query("body *"));
      const out = items.filter((item) => re.test(WS.itemText(item)));
      out.forEach((item) => term.print(WS.itemText(item)));
      term.print(`${out.length} coincidencia(s)`);
      return out;
    },
  };

  // ---------- extracción ----------

  commands.text = {
    desc: "extrae el texto de los elementos",
    usage: "text <selector>   |   ls <sel> | text",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "text");
      const out = els.map((el) => WS.snippet(el.textContent, 500));
      out.forEach((t) => term.print(t));
      return out;
    },
  };

  commands.attr = {
    desc: "extrae un atributo de los elementos del pipe",
    usage: "ls img | attr src",
    fn(args, input, term) {
      if (!args[0]) throw new Error("attr: falta el nombre del atributo");
      if (!input) throw new Error("attr: necesita un pipe. Ej: ls a | attr href");
      const els = input.filter((el) => el instanceof Element);
      if (!els.length) {
        throw new Error(
          "attr: el pipe no contiene elementos. Usa ls (no extract) antes de attr. Ej: ls a | attr href"
        );
      }
      // getAttribute devuelve el valor crudo del HTML (a menudo relativo, ej. "/wiki/X").
      // Para atributos de tipo URL lo resolvemos a absoluto, como hace el navegador.
      const urlAttrs = new Set(["href", "src", "action", "poster"]);
      const out = els
        .map((el) => el.getAttribute(args[0]) || "")
        .filter(Boolean)
        .map((v) => {
          if (!urlAttrs.has(args[0])) return v;
          try {
            return new URL(v, document.baseURI).href;
          } catch {
            return v;
          }
        });
      out.forEach((v) => term.print(v));
      return out;
    },
  };

  commands.links = {
    desc: "lista las URLs de los enlaces de la página (o de un selector)",
    usage: "links [selector]",
    fn(args, _input, term) {
      const scope = args[0] ? WS.query(args[0]) : [document.body];
      const seen = new Set();
      for (const root of scope) {
        for (const a of root.querySelectorAll("a[href]")) {
          if (a.href && !a.href.startsWith("javascript:")) seen.add(a.href);
        }
      }
      const out = Array.from(seen);
      out.forEach((u) => term.print(u));
      term.print(`${out.length} enlace(s)`);
      return out;
    },
  };

  commands.extract = {
    desc: "extrae datos estructurados (tablas → filas, listas → items)",
    usage: "extract <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "extract");
      if (!els.length) {
        throw new Error(
          `extract: 0 elementos coinciden con "${args[0]}". ` +
            `Muchos sitios dibujan tablas con <div>; inspecciona con: ls ${args[0] || "table"}`
        );
      }
      const rows = els.flatMap((el) => WS.extract(el));
      rows.slice(0, 20).forEach((r) => term.print(r.join(" | ")));
      if (rows.length > 20) term.print(`… y ${rows.length - 20} fila(s) más`);
      term.print(`${rows.length} fila(s) extraída(s)`);
      return rows;
    },
  };

  commands["to-csv"] = {
    desc: "convierte la salida del pipe a CSV",
    usage: "extract table | to-csv > datos.csv",
    fn(_args, input, term) {
      if (!input) throw new Error("to-csv: necesita un pipe. Ej: extract table | to-csv");
      if (!input.length) throw new Error("to-csv: el pipe está vacío, nada que convertir");
      const csv = WS.toCSV(WS.toRows(input));
      term.print(`CSV listo (${input.length} filas). Usa "> archivo.csv" para descargarlo.`);
      return [csv];
    },
  };

  commands["to-json"] = {
    desc: "convierte la salida del pipe a JSON",
    usage: "links | to-json > enlaces.json",
    fn(_args, input, term) {
      if (!input) throw new Error("to-json: necesita un pipe");
      if (!input.length) throw new Error("to-json: el pipe está vacío, nada que convertir");
      const data = input.map((i) =>
        i instanceof Element ? WS.snippet(i.textContent, 500) : i
      );
      term.print(`JSON listo (${input.length} items)`);
      return [JSON.stringify(data, null, 2)];
    },
  };

  commands.download = {
    desc: "descarga la salida del pipe como archivo",
    usage: "... | download <nombre.ext>",
    fn(args, input, term) {
      if (!input || !input.length) throw new Error("download: el pipe está vacío");
      const name = args[0] || "webshell.txt";
      const content = input.map((i) => WS.itemText(i)).join("\n");
      WS.downloadFile(name, content);
      term.print(`descargado: ${name}`);
      return input;
    },
  };

  // ---------- manipulación del DOM ----------

  commands.click = {
    desc: "hace clic en los elementos",
    usage: "click <selector>   |   ls button | click",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "click");
      els.forEach((el) => el.click());
      term.print(`clic en ${els.length} elemento(s)`);
      return els;
    },
  };

  commands.fill = {
    desc: "escribe un valor en inputs/textareas",
    usage: 'fill <selector> "texto"',
    fn(args, _input, term) {
      if (args.length < 2) throw new Error('fill: uso: fill <selector> "texto"');
      const els = WS.query(args[0]);
      for (const el of els) {
        el.value = args[1];
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      term.print(`rellenado(s) ${els.length} campo(s)`);
      return els;
    },
  };

  commands.hide = {
    desc: "oculta elementos (display: none)",
    usage: "hide <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "hide");
      els.forEach((el) => (el.style.display = "none"));
      term.print(`oculto(s) ${els.length} elemento(s)`);
      return els;
    },
  };

  commands.show = {
    desc: "vuelve a mostrar elementos ocultos con hide",
    usage: "show <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "show");
      els.forEach((el) => (el.style.display = ""));
      term.print(`visible(s) ${els.length} elemento(s)`);
      return els;
    },
  };

  commands.rm = {
    desc: "elimina elementos del DOM (solo en tu vista; recarga para restaurar)",
    usage: "rm <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "rm");
      els.forEach((el) => el.remove());
      term.print(`eliminado(s) ${els.length} elemento(s)`);
      return [];
    },
  };

  commands.css = {
    desc: "aplica estilos inline a elementos",
    usage: 'css <selector> "color: red; font-size: 2em"',
    fn(args, _input, term) {
      if (args.length < 2) throw new Error('css: uso: css <selector> "prop: valor; ..."');
      const els = WS.query(args[0]);
      els.forEach((el) => (el.style.cssText += ";" + args[1]));
      term.print(`estilo aplicado a ${els.length} elemento(s)`);
      return els;
    },
  };

  // ---------- monitor ----------

  const watchers = new Map();
  let watchId = 0;

  commands.watch = {
    desc: "vigila un selector y notifica cuando su texto cambia",
    usage: "watch <selector> [segundos=5]   ·   watch ls   ·   watch rm <id>",
    fn(args, _input, term) {
      if (args[0] === "ls") {
        if (!watchers.size) term.print("no hay watches activos");
        for (const [id, w] of watchers) term.print(`[${id}] ${w.selector} (cada ${w.secs}s)`);
        return [];
      }
      if (args[0] === "rm") {
        const id = Number(args[1]);
        const w = watchers.get(id);
        if (!w) throw new Error(`watch rm: no existe el watch [${args[1]}]`);
        clearInterval(w.timer);
        watchers.delete(id);
        term.print(`watch [${id}] detenido`);
        return [];
      }
      if (!args[0]) throw new Error("watch: uso: watch <selector> [segundos]");

      const selector = args[0];
      const secs = Math.max(1, Number(args[1]) || 5);
      const read = () =>
        WS.query(selector).map((el) => el.textContent.trim()).join("\n");

      let last = read();
      const id = ++watchId;
      const timer = setInterval(() => {
        const now = read();
        if (now !== last) {
          const msg = `"${selector}" cambió:\n${WS.snippet(now, 120)}`;
          term.print(`⚡ watch [${id}]: ${msg}`);
          chrome.runtime.sendMessage({
            type: "notify",
            title: `WebShell — ${location.hostname}`,
            message: msg,
          });
          last = now;
        }
      }, secs * 1000);

      watchers.set(id, { selector, secs, timer });
      term.print(`watch [${id}] activo: "${selector}" cada ${secs}s (detener: watch rm ${id})`);
      return [];
    },
  };

  commands.clear = {
    desc: "limpia la pantalla de la terminal",
    usage: "clear",
    fn(_args, _input, term) {
      term.clear();
      return [];
    },
  };
})(window.WebShell);
