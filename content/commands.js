// WebShell — command registry.
// Each command: fn(args, input, term) → array (pipeline output).
//   args:  tokenized arguments (without the command name)
//   input: output of the previous command in the pipe, or null if first
//   term:  the terminal (print with term.print / term.printError)
"use strict";

(function (WS) {
  if (WS.commands) return; // injected twice (declared + programmatic)
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
      let rows = els.flatMap((el) => WS.extract(el));
      // Several tables (e.g. crawled pages) repeat the same header row — keep
      // only the first copy so to-csv / where see a single header.
      if (els.length > 1 && rows.length > 1) {
        const header = JSON.stringify(rows[0]);
        rows = rows.filter((r, i) => i === 0 || JSON.stringify(r) !== header);
      }
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

  // ---------- navigation ----------

  /**
   * Pure resolver for `cd` (kept DOM-free so node can test it).
   * Returns one of:
   *   { type: "back" }                          cd -
   *   { type: "url", url }                      unambiguous destination
   *   { type: "ambiguous", domainUrl, pathUrl } single word: may be a CSS
   *     selector on the page, a bare domain, or a relative path — the command
   *     checks the DOM first, then falls back to domainUrl || pathUrl.
   */
  WS.resolveCd = function (arg, currentHref) {
    const cur = new URL(currentHref);
    if (!arg || arg === "/") return { type: "url", url: cur.origin + "/" };
    if (arg === "-") return { type: "back" };
    if (/^https?:\/\//i.test(arg)) return { type: "url", url: arg };
    if (arg.startsWith("/")) return { type: "url", url: cur.origin + arg };

    // Filesystem-style walk: cd .. from /a/b lands on /a (one segment per ..).
    const walk = () => {
      const segs = cur.pathname.split("/").filter(Boolean);
      for (const tok of arg.split("/")) {
        if (tok === "" || tok === ".") continue;
        if (tok === "..") segs.pop();
        else segs.push(tok);
      }
      return cur.origin + "/" + segs.join("/");
    };

    if (/^\.\.?(\/|$)/.test(arg)) return { type: "url", url: walk() };

    const domainish = /^[\w-]+(\.[\w-]+)+(:\d+)?(\/[^\s]*)?$/.test(arg);
    return {
      type: "ambiguous",
      domainUrl: domainish ? "https://" + arg : null,
      pathUrl: walk(),
    };
  };

  commands.cd = {
    desc: "navigate: URL, /path, .., -, or the selector of a link",
    usage: "cd <url|/path|..|-|selector>   ·   cd (alone) = site root",
    fn(args, _input, term) {
      const arg = args[0] || "";
      const r = WS.resolveCd(arg, location.href);
      if (r.type === "back") {
        term.print("cd: going back…");
        history.back();
        return [];
      }
      let dest = r.url;
      if (r.type === "ambiguous") {
        let el = null;
        try {
          el = WS.query(arg).find((e) => e.href || e.closest("a[href]"));
        } catch {
          el = null; // not valid CSS — fall through to the URL interpretations
        }
        if (el) {
          dest = el.href ? el.href : el.closest("a[href]").href;
        } else {
          dest = r.domainUrl || r.pathUrl;
        }
      }
      term.print(`cd: ${dest}`);
      location.assign(dest);
      return [];
    },
  };

  commands.pwd = {
    desc: "print the current URL",
    usage: "pwd",
    fn(_args, _input, term) {
      term.print(location.href);
      return [location.href];
    },
  };

  // ---------- network (HTTP via the service worker) ----------

  commands.ping = {
    desc: "HTTP reachability + latency (not ICMP; real ping arrives with the native host)",
    usage: "ping <host|url> [count=3]",
    async fn(args, _input, term) {
      if (!args[0]) throw new Error("ping: usage: ping <host|url> [count]");
      const url = /^https?:\/\//i.test(args[0]) ? args[0] : "https://" + args[0];
      const count = Math.min(10, Math.max(1, Number(args[1]) || 3));
      term.print(`PING ${url} — HTTP, ${count} request(s)`);
      const times = [];
      for (let i = 1; i <= count; i++) {
        const res = await WS.swRequest({ type: "ping", url });
        if (res && res.ok) {
          times.push(res.ms);
          term.print(`  #${i}  HTTP ${res.status}  ${res.ms} ms`);
        } else {
          term.print(`  #${i}  unreachable — ${(res && res.error) || "no response"}`);
        }
      }
      if (times.length) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        term.print(
          `${times.length}/${count} ok — min ${Math.min(...times)} / avg ${avg} / max ${Math.max(...times)} ms`
        );
      }
      return times.map(String);
    },
  };

  commands.curl = {
    desc: "fetch a URL and pipe its body line by line",
    usage: "curl <url> [-i]   ·   curl api.github.com/zen | download zen.txt",
    async fn(args, _input, term) {
      const includeHeaders = args.includes("-i");
      const target = args.find((a) => a !== "-i");
      if (!target) throw new Error("curl: usage: curl <url> [-i]");
      const url = /^https?:\/\//i.test(target) ? target : "https://" + target;
      const res = await WS.swRequest({ type: "curl", url });
      if (!res || !res.ok) {
        throw new Error(`curl: ${(res && res.error) || "request failed"}`);
      }
      const out = [];
      if (includeHeaders) {
        out.push(`HTTP ${res.status} ${res.statusText || ""}`.trim());
        for (const [k, v] of res.headers || []) out.push(`${k}: ${v}`);
        out.push("");
      }
      for (const line of String(res.body || "").split(/\r?\n/)) out.push(line);
      out.slice(0, 20).forEach((l) => term.print(l));
      if (out.length > 20) term.print(`… and ${out.length - 20} more line(s)`);
      term.print(
        `HTTP ${res.status} — ${out.length} line(s)${res.truncated ? " (truncated at 512 KB)" : ""}`
      );
      return out;
    },
  };

  // ---------- appearance & meta ----------

  commands.theme = {
    desc: "terminal theme: dark, light or auto (follow the system)",
    usage: "theme [dark|light|auto]",
    async fn(args, _input, term) {
      if (!args[0]) {
        const s = await WS.settings.load();
        term.print(`theme: ${s.theme}`);
        return [];
      }
      const t = args[0].toLowerCase();
      if (!["dark", "light", "auto"].includes(t)) {
        throw new Error("theme: use dark, light or auto");
      }
      await WS.settings.save({ theme: t });
      if (WS.applyTheme) WS.applyTheme(t);
      term.print(`theme set: ${t}`);
      return [];
    },
  };

  commands.history = {
    desc: "command history for this site (persisted)",
    usage: "history   ·   history clear   ·   history | grep extract",
    fn(args, _input, term) {
      if (args[0] === "clear") {
        term.history = [];
        term.historyIndex = 0;
        WS.store.remove(WS.hostKey("history"));
        term.print("history cleared for " + location.hostname);
        return [];
      }
      const h = term.history;
      h.forEach((line, i) => term.print(`  ${String(i + 1).padStart(3)}  ${line}`));
      if (!h.length) term.print("history is empty");
      return h.slice();
    },
  };

  commands.feedback = {
    desc: "found a bug or want a feature? opens a prefilled GitHub issue",
    usage: 'feedback "add ssh support"   ·   feedback (blank form)',
    fn(args, _input, term) {
      const base = "https://github.com/juanma-dev/webshell-extension/issues/new";
      let url = base;
      if (args.length) {
        const title = args.join(" ");
        let version = "0.2";
        try {
          version = chrome.runtime.getManifest().version;
        } catch {}
        // The user sees and can edit all of this on GitHub before submitting.
        const body =
          `**What:** ${title}\n\n**Details:**\n\n---\n` +
          `_WebShell v${version} — reported from the terminal on ${location.hostname}_`;
        url = `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      }
      window.open(url, "_blank", "noopener");
      term.print("thank you! review the issue on GitHub and press 'Submit new issue'.");
      term.print("(posting needs a free GitHub account)");
      return [];
    },
  };

  // ---------- monitor ----------

  const watchers = new Map();
  let watchId = 0;

  function saveWatches() {
    const list = Array.from(watchers.values()).map((w) => ({
      selector: w.selector,
      secs: w.secs,
      webhook: w.webhook || null,
    }));
    WS.store.set(WS.hostKey("watches"), list);
  }

  /** Starts a watch loop. Prints into whatever terminal exists when it fires,
      so watches restored on page load work before the terminal is ever opened. */
  function startWatch(selector, secs, webhook) {
    const read = () =>
      WS.query(selector).map((el) => el.textContent.trim()).join("\n");

    let last = read();
    const id = ++watchId;
    const timer = setInterval(() => {
      let now;
      try {
        now = read();
      } catch {
        return; // extension reloaded mid-flight; the new script takes over
      }
      if (now !== last) {
        const msg = `"${selector}" changed:\n${WS.snippet(now, 120)}`;
        const term = WS.terminal;
        if (term && term.built) term.print(`⚡ watch [${id}]: ${msg}`);
        try {
          chrome.runtime.sendMessage({
            type: "notify",
            title: `WebShell — ${location.hostname}`,
            message: msg,
          });
        } catch {}
        // Pro build: also deliver the change to this watch's webhook.
        if (webhook && WS.proWatchWebhook) {
          try {
            WS.proWatchWebhook.fire({ id, selector, webhook }, last, now);
          } catch {}
        }
        last = now;
      }
    }, secs * 1000);

    watchers.set(id, { selector, secs, timer, webhook: webhook || null });
    return id;
  }

  /** Restores this site's persisted watches (runs on every page load). */
  WS.restoreWatches = async function () {
    const list = await WS.store.get(WS.hostKey("watches"), []);
    if (!Array.isArray(list)) return 0;
    for (const w of list) {
      if (w && typeof w.selector === "string") {
        startWatch(
          w.selector,
          Math.max(1, Number(w.secs) || 5),
          typeof w.webhook === "string" ? w.webhook : null
        );
      }
    }
    return list.length;
  };

  commands.watch = {
    desc: "watch a selector and notify when its text changes (persists across reloads)",
    usage: "watch <selector> [seconds=5]   ·   watch ls   ·   watch rm <id|all>",
    async fn(args, _input, term) {
      if (args[0] === "ls") {
        if (!watchers.size) term.print("no active watches");
        for (const [id, w] of watchers)
          term.print(
            `[${id}] ${w.selector} (every ${w.secs}s)${w.webhook ? ` → ${w.webhook}` : ""}`
          );
        return [];
      }
      if (args[0] === "rm") {
        if (args[1] === "all") {
          for (const w of watchers.values()) clearInterval(w.timer);
          watchers.clear();
          saveWatches();
          term.print("all watches stopped");
          return [];
        }
        const id = Number(args[1]);
        const w = watchers.get(id);
        if (!w) throw new Error(`watch rm: no watch [${args[1]}]`);
        clearInterval(w.timer);
        watchers.delete(id);
        saveWatches();
        term.print(`watch [${id}] stopped`);
        return [];
      }
      // --webhook <url> (Pro build) POSTs each change to that URL. The flag's
      // validation/licensing lives in the Pro overlay (WS.proWatchWebhook);
      // this build only knows how to carry the value on the watch.
      let webhook = null;
      const rest = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "--webhook") {
          const url = args[++i];
          if (!url) throw new Error("watch: usage: watch <selector> [seconds] --webhook <url>");
          if (!WS.proWatchWebhook)
            throw new Error("watch: --webhook is available in the WebShell Pro build");
          webhook = await WS.proWatchWebhook.add(url, term);
          if (webhook === null) return []; // not licensed — upsell already printed
        } else {
          rest.push(args[i]);
        }
      }

      if (!rest[0]) throw new Error("watch: usage: watch <selector> [seconds]");

      const selector = rest[0];
      const secs = Math.max(1, Number(rest[1]) || 5);
      WS.query(selector); // validate the selector before persisting it
      const id = startWatch(selector, secs, webhook);
      saveWatches();
      term.print(
        `watch [${id}] active: "${selector}" every ${secs}s${webhook ? " → webhook" : ""} — persists on this site (stop: watch rm ${id})`
      );
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
