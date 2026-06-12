// WebShell — parser: tokeniza respetando comillas, separa pipes y redirección.
//   extract table | to-csv > datos.csv
//   → [{cmd:"extract", args:["table"]}, {cmd:"to-csv", args:[]}] + redirect "datos.csv"
"use strict";

(function (WS) {
  /** Divide una línea en tokens. Las comillas (simples o dobles) agrupan. */
  function tokenize(line) {
    const tokens = [];
    let current = "";
    let quote = null;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === "|" || ch === ">") {
        if (current) {
          tokens.push(current);
          current = "";
        }
        tokens.push(ch);
      } else if (/\s/.test(ch)) {
        if (current) {
          tokens.push(current);
          current = "";
        }
      } else {
        current += ch;
      }
    }
    if (quote) throw new Error("falta cerrar una comilla");
    if (current) tokens.push(current);
    return tokens;
  }

  /**
   * Parsea una línea completa.
   * Devuelve { stages: [{cmd, args}], redirect: string|null }
   */
  WS.parse = function (line) {
    const tokens = tokenize(line);
    if (!tokens.length) return { stages: [], redirect: null };

    const stages = [];
    let current = null;
    let redirect = null;
    let expectRedirect = false;

    for (const tok of tokens) {
      if (expectRedirect) {
        if (redirect) throw new Error("solo se permite una redirección >");
        redirect = tok;
        expectRedirect = false;
      } else if (tok === "|") {
        if (!current) throw new Error("pipe sin comando antes de |");
        stages.push(current);
        current = null;
      } else if (tok === ">") {
        expectRedirect = true;
      } else if (!current) {
        current = { cmd: tok, args: [] };
      } else {
        current.args.push(tok);
      }
    }
    if (expectRedirect) throw new Error("falta el nombre de archivo después de >");
    if (current) stages.push(current);
    if (!stages.length && redirect) throw new Error("redirección sin comando");

    return { stages, redirect };
  };

  /** Ejecuta una línea completa contra el registro de comandos. */
  WS.run = function (line, term) {
    const { stages, redirect } = WS.parse(line);
    if (!stages.length) return;

    let pipe = null;
    for (const { cmd, args } of stages) {
      const command = WS.commands[cmd];
      if (!command) {
        throw new Error(`comando no encontrado: "${cmd}" (escribe "help")`);
      }
      pipe = command.fn(args, pipe, term);
    }

    if (redirect) {
      if (!pipe || !pipe.length) throw new Error("> nada que guardar: el pipe está vacío");
      const content = pipe.map((i) => WS.itemText(i)).join("\n");
      const mime = redirect.endsWith(".csv")
        ? "text/csv;charset=utf-8"
        : redirect.endsWith(".json")
        ? "application/json"
        : "text/plain;charset=utf-8";
      WS.downloadFile(redirect, content, mime);
      term.print(`guardado: ${redirect}`);
    }
  };
})(window.WebShell);
