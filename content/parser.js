// WebShell — parser: tokenizes (quote-aware), splits pipes and redirection.
//   extract table | to-csv > data.csv
//   → [{cmd:"extract", args:["table"]}, {cmd:"to-csv", args:[]}] + redirect "data.csv"
"use strict";

(function (WS) {
  /** Splits a line into tokens. Quotes (single or double) group. */
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
    if (quote) throw new Error("unclosed quote");
    if (current) tokens.push(current);
    return tokens;
  }

  /**
   * Parses a full line.
   * Returns { stages: [{cmd, args}], redirect: string|null }
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
        if (redirect) throw new Error("only one > redirection allowed");
        redirect = tok;
        expectRedirect = false;
      } else if (tok === "|") {
        if (!current) throw new Error("pipe with no command before |");
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
    if (expectRedirect) throw new Error("missing filename after >");
    if (current) stages.push(current);
    if (!stages.length && redirect) throw new Error("redirection with no command");

    return { stages, redirect };
  };

  /** Runs a full line against the command registry. */
  WS.run = function (line, term) {
    const { stages, redirect } = WS.parse(line);
    if (!stages.length) return;

    let pipe = null;
    for (const { cmd, args } of stages) {
      const command = WS.commands[cmd];
      if (!command) {
        throw new Error(`command not found: "${cmd}" (type "help")`);
      }
      pipe = command.fn(args, pipe, term);
    }

    if (redirect) {
      if (!pipe || !pipe.length) throw new Error("> nothing to save: the pipe is empty");
      const content = pipe.map((i) => WS.itemText(i)).join("\n");
      const mime = redirect.endsWith(".csv")
        ? "text/csv;charset=utf-8"
        : redirect.endsWith(".json")
        ? "application/json"
        : "text/plain;charset=utf-8";
      WS.downloadFile(redirect, content, mime);
      term.print(`saved: ${redirect}`);
    }
  };
})(window.WebShell);
