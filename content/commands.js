// WebShell — command registry.
// Each command: fn(args, input, term) → array (pipeline output).
//   args:  tokenized arguments (without the command name)
//   input: output of the previous command in the pipe, or null if first
//   term:  the terminal (print with term.print / term.printError)
"use strict";

(function (WS) {
  const commands = {};
  WS.commands = commands;

  /**
   * Uses piped elements when present; otherwise queries the selector.
   * With both, the selector filters the piped elements (ls a | extract "a.Link--primary").
   */
  function elementsFrom(args, input, name) {
    if (input && input.length && input[0] instanceof Element) {
      if (!args[0]) return input;
      try {
        return input.filter((el) => el.matches(args[0]));
      } catch (e) {
        throw new Error(`${name}: invalid selector: "${args[0]}"`);
      }
    }
    if (!args[0]) throw new Error(`${name}: missing selector. Usage: ${name} <selector>`);
    return WS.query(args[0]);
  }

  // ---------- info ----------

  commands.help = {
    desc: "show this help",
    usage: "help [command]",
    fn(args, _input, term) {
      if (args[0]) {
        const c = commands[args[0]];
        if (!c) throw new Error(`no such command "${args[0]}"`);
        term.print(`${args[0]} — ${c.desc}\n  usage: ${c.usage}`);
        return [];
      }
      const names = Object.keys(commands).sort();
      const width = Math.max(...names.map((n) => n.length));
      for (const n of names) {
        term.print(`  ${n.padEnd(width)}  ${commands[n].desc}`);
      }
      term.print("\nCombine with pipes:  extract table | to-csv > data.csv");
      return [];
    },
  };

  commands.ls = {
    desc: "list elements matching a CSS selector",
    usage: "ls <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "ls");
      els.forEach((el, i) => term.print(`[${i}] ${WS.describe(el)}`));
      term.print(`${els.length} element(s)`);
      return els;
    },
  };

  commands.count = {
    desc: "count piped items or selector matches",
    usage: "count [selector]",
    fn(args, input, term) {
      const n = input ? input.length : WS.query(args[0] || "*").length;
      term.print(String(n));
      return [n];
    },
  };

  commands.grep = {
    desc: "filter items whose text matches a pattern (case-insensitive regex)",
    usage: "grep <pattern> [selector]   |   ... | grep <pattern>",
    fn(args, input, term) {
      if (!args[0]) throw new Error("grep: missing pattern. Usage: grep <pattern> [selector]");
      const re = new RegExp(args[0], "i");
      const items = input || (args[1] ? WS.query(args[1]) : WS.query("body *"));
      const out = items.filter((item) => re.test(WS.itemText(item)));
      out.forEach((item) => term.print(WS.itemText(item)));
      term.print(`${out.length} match(es)`);
      return out;
    },
  };

  // ---------- extraction ----------

  commands.text = {
    desc: "extract the text of elements",
    usage: "text <selector>   |   ls <sel> | text",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "text");
      const out = els.map((el) => WS.snippet(el.textContent, 500));
      out.forEach((t) => term.print(t));
      return out;
    },
  };

  commands.attr = {
    desc: "extract an attribute from piped elements",
    usage: "ls img | attr src",
    fn(args, input, term) {
      if (!args[0]) throw new Error("attr: missing attribute name");
      if (!input) throw new Error("attr: needs a pipe. E.g.: ls a | attr href");
      const els = input.filter((el) => el instanceof Element);
      if (!els.length) {
        throw new Error(
          "attr: the pipe has no elements. Use ls (not extract) before attr. E.g.: ls a | attr href"
        );
      }
      // getAttribute returns the raw HTML value (often relative, e.g. "/wiki/X").
      // For URL attributes we resolve to absolute, just like the browser does.
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
    desc: "list the URLs of the page's links (or within a selector)",
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
      term.print(`${out.length} link(s)`);
      return out;
    },
  };

  commands.extract = {
    desc: "extract structured data (tables → rows, lists → items, a → text+URL, img → alt+src)",
    usage: "extract <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "extract");
      if (!els.length) {
        throw new Error(
          `extract: 0 elements match "${args[0]}". ` +
            `Many sites draw tables with <div>; inspect with: ls ${args[0] || "table"}`
        );
      }
      const rows = els.flatMap((el) => WS.extract(el));
      rows.slice(0, 20).forEach((r) => term.print(r.join(" | ")));
      if (rows.length > 20) term.print(`… and ${rows.length - 20} more row(s)`);
      term.print(`${rows.length} row(s) extracted`);
      return rows;
    },
  };

  commands["to-csv"] = {
    desc: "convert the piped output to CSV",
    usage: "extract table | to-csv > data.csv",
    fn(_args, input, term) {
      if (!input) throw new Error("to-csv: needs a pipe. E.g.: extract table | to-csv");
      if (!input.length) throw new Error("to-csv: the pipe is empty, nothing to convert");
      const csv = WS.toCSV(WS.toRows(input));
      term.print(`CSV ready (${input.length} rows). Use "> file.csv" to download it.`);
      return [csv];
    },
  };

  commands["to-json"] = {
    desc: "convert the piped output to JSON",
    usage: "links | to-json > links.json",
    fn(_args, input, term) {
      if (!input) throw new Error("to-json: needs a pipe");
      if (!input.length) throw new Error("to-json: the pipe is empty, nothing to convert");
      const data = input.map((i) =>
        i instanceof Element ? WS.snippet(i.textContent, 500) : i
      );
      term.print(`JSON ready (${input.length} items)`);
      return [JSON.stringify(data, null, 2)];
    },
  };

  commands.download = {
    desc: "download the piped output as a file",
    usage: "... | download <name.ext>",
    fn(args, input, term) {
      if (!input || !input.length) throw new Error("download: the pipe is empty");
      const name = args[0] || "webshell.txt";
      const content = input.map((i) => WS.itemText(i)).join("\n");
      WS.downloadFile(name, content);
      term.print(`downloaded: ${name}`);
      return input;
    },
  };

  commands.uniq = {
    desc: "remove duplicate items from the pipe (by text)",
    usage: "extract a | uniq | to-csv > data.csv",
    fn(_args, input, term) {
      if (!input) throw new Error("uniq: needs a pipe");
      const seen = new Set();
      const out = input.filter((item) => {
        const key = WS.itemText(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      term.print(`${out.length} unique item(s) (${input.length - out.length} duplicates removed)`);
      return out;
    },
  };

  // ---------- DOM manipulation ----------

  commands.click = {
    desc: "click elements",
    usage: "click <selector>   |   ls button | click",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "click");
      els.forEach((el) => el.click());
      term.print(`clicked ${els.length} element(s)`);
      return els;
    },
  };

  commands.fill = {
    desc: "type a value into inputs/textareas",
    usage: 'fill <selector> "text"',
    fn(args, _input, term) {
      if (args.length < 2) throw new Error('fill: usage: fill <selector> "text"');
      const els = WS.query(args[0]);
      for (const el of els) {
        el.value = args[1];
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      term.print(`filled ${els.length} field(s)`);
      return els;
    },
  };

  commands.hide = {
    desc: "hide elements (display: none)",
    usage: "hide <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "hide");
      els.forEach((el) => (el.style.display = "none"));
      term.print(`hid ${els.length} element(s)`);
      return els;
    },
  };

  commands.show = {
    desc: "show elements hidden with hide",
    usage: "show <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "show");
      els.forEach((el) => (el.style.display = ""));
      term.print(`showed ${els.length} element(s)`);
      return els;
    },
  };

  commands.rm = {
    desc: "remove elements from the DOM (your view only; reload to restore)",
    usage: "rm <selector>",
    fn(args, input, term) {
      const els = elementsFrom(args, input, "rm");
      els.forEach((el) => el.remove());
      term.print(`removed ${els.length} element(s)`);
      return [];
    },
  };

  commands.css = {
    desc: "apply inline styles to elements",
    usage: 'css <selector> "color: red; font-size: 2em"',
    fn(args, _input, term) {
      if (args.length < 2) throw new Error('css: usage: css <selector> "prop: value; ..."');
      const els = WS.query(args[0]);
      els.forEach((el) => (el.style.cssText += ";" + args[1]));
      term.print(`styled ${els.length} element(s)`);
      return els;
    },
  };

  // ---------- monitor ----------

  const watchers = new Map();
  let watchId = 0;

  commands.watch = {
    desc: "watch a selector and notify when its text changes",
    usage: "watch <selector> [seconds=5]   ·   watch ls   ·   watch rm <id>",
    fn(args, _input, term) {
      if (args[0] === "ls") {
        if (!watchers.size) term.print("no active watches");
        for (const [id, w] of watchers) term.print(`[${id}] ${w.selector} (every ${w.secs}s)`);
        return [];
      }
      if (args[0] === "rm") {
        const id = Number(args[1]);
        const w = watchers.get(id);
        if (!w) throw new Error(`watch rm: no watch [${args[1]}]`);
        clearInterval(w.timer);
        watchers.delete(id);
        term.print(`watch [${id}] stopped`);
        return [];
      }
      if (!args[0]) throw new Error("watch: usage: watch <selector> [seconds]");

      const selector = args[0];
      const secs = Math.max(1, Number(args[1]) || 5);
      const read = () =>
        WS.query(selector).map((el) => el.textContent.trim()).join("\n");

      let last = read();
      const id = ++watchId;
      const timer = setInterval(() => {
        const now = read();
        if (now !== last) {
          const msg = `"${selector}" changed:\n${WS.snippet(now, 120)}`;
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
      term.print(`watch [${id}] active: "${selector}" every ${secs}s (stop: watch rm ${id})`);
      return [];
    },
  };

  commands.pick = {
    desc: "click an element on the page to get its CSS selector",
    usage: "pick   (Esc to cancel)",
    fn(_args, _input, term) {
      term.print("pick: click an element on the page (Esc cancels)…");
      WS.startPicker(term);
      return [];
    },
  };

  commands.clear = {
    desc: "clear the terminal screen",
    usage: "clear",
    fn(_args, _input, term) {
      term.clear();
      return [];
    },
  };
})(window.WebShell);
