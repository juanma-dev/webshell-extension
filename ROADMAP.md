# WebShell — Project Roadmap

> A Unix-style terminal where the website is the filesystem.
> Check items off with `[x]` as they get done.

---

## Phase 1 — MVP: the terminal that works today (weeks 1-2)

**Goal:** load the extension in Chrome, open the terminal on any page
and extract data to CSV. This is what ships first to the Chrome Web Store.

- [x] Project structure and `manifest.json` (Manifest V3)
- [x] Extension icons (16/48/128 px)
- [x] DOM utilities: CSS selection, table/list extraction, CSV generator
- [x] Command parser: quote-aware tokenizer, pipes `|`, redirection `> file`
- [x] Basic commands: `help`, `ls`, `grep`, `count`, `text`, `attr`, `links`
- [x] Extraction: `extract`, `to-csv`, `to-json`, `download`
- [x] DOM manipulation: `click`, `hide`, `show`, `rm`, `css`, `fill`
- [x] Monitor: `watch <selector>` with desktop notification on change
- [x] Terminal overlay: toggle with Alt+W / `` Ctrl+` ``, arrow-key history, autoscroll
- [x] Service worker: desktop notifications, on-the-spot injection
- [x] README with install instructions and command manual
- [x] i18n: English as default locale, Spanish as second (`_locales/`)
- [x] Test on 5 real sites (Wikipedia, Amazon, BBC, GitHub, X)
      Findings fixed: minimal selectors, uniq, pipe filtering, stable test attributes.
      Known limits: virtualized feeds only expose visible items; card text lands in one cell.
- [x] Polish terminal styles (light/dark themes) — shipped with the v0.2 themes (Phase 2)

## Phase 2 — Launch and first users (weeks 3-4)

- [x] `pick` command: click an element on the page to get its selector
- [x] Chrome Web Store developer account ($5 USD, one-time)
- [x] Screenshots and store listing copy (`store/listing.md`)
- [ ] 30s demo video for the listing
- [x] **Published to the Chrome Web Store — live with 31 users (2026-07-07)**
- [ ] Simple landing page (GitHub Pages is fine to start)
- [ ] Announce on Reddit (r/webdev, r/chrome_extensions), X, Product Hunt

### v0.2 — retention & unix-completeness (code complete, pending QA + publish)

Everything below ships without asking for new permissions.

- [x] Persistent command history per domain (`chrome.storage`) + `history` command
- [x] Terminal reopens after navigating (per-tab state via the service worker)
- [x] Resizable terminal: drag the top edge; height is remembered
- [x] Light/dark/auto themes + `theme` command (closes the Phase 1 styling item)
- [x] Options page: theme, clear saved data, shortcut pointer, feedback links
- [x] Persistent `watch`: keeps working across page reloads (`watch rm <id|all>` stops)
- [x] CSS selector autocomplete with Tab (command names + selectors from the page)
- [x] `cd` / `pwd`: navigate like a filesystem (`cd ..`, `cd -`, `cd /`, URL or a link's selector)
- [x] `ping <host>`: HTTP reachability + latency (honest label: not ICMP — that needs Phase 3)
- [x] `curl <url>`: fetch any URL into the pipe (`curl api… | grep … > out.txt`)
- [x] `feedback`: opens the issue tracker from the terminal (repo must be public!)
- [ ] Manual QA pass on real sites, then publish the 0.2 update to the Web Store

## Phase 3 — Monetization: Native Messaging with Rust (month 2)

**This is where Rust comes in.** A native host the extension installs to touch the real system.

- [ ] Native Messaging host in Rust (single binary, stdin/stdout protocol)
- [ ] Host installer (script + Windows registry / manifest on disk)
- [ ] `sh <script>` command: run system commands from the web terminal
- [ ] Network tools via the native host (**Pro flagship**): `ssh`, `telnet`, real ICMP `ping`
      — raw TCP/ICMP sockets don't exist in the extension sandbox; the Rust host unlocks them
- [ ] Pipe to the system: `extract table | sh process.sh`
- [ ] Save files directly to disk (not just Downloads)
- [ ] Pro licensing system (ExtensionPay or LemonSqueezy)
- [ ] Pro feature gate: native messaging, unlimited watches
- [ ] Pricing: Free / Pro $8 USD/mo / Lifetime $129 USD

## Phase 4 — Differentiators (month 3+)

- [ ] Macros: record clicks/inputs and replay them as an editable script
- [ ] Scheduler: `cron "0 9 * * *" 'watch .price'` (alarms + service worker)
- [ ] Rust WASM module: high-volume parsing/regex for huge pages
- [ ] AI layer: natural language → command (`"get all the emails"`)
- [ ] Webhooks: `watch .price --webhook https://...`

## Phase 5 — Scale (month 6+)

- [ ] Community script marketplace (with commission)
- [ ] Teams plan: shared scripts ($15/user/mo)
- [ ] Script sync across devices
- [ ] Firefox/Edge version

---

## Technical decisions

| Decision | Choice | Why |
|---|---|---|
| Extension language | Plain JavaScript, no bundler | The browser only runs JS; no build = load and test instantly |
| Where Rust fits | Native host (phase 3) and WASM (phase 4) | Single dependency-free binary; speed for heavy processing |
| Manifest | V3 | V2 is dead on the Chrome Web Store |
| File downloads | Blob + `<a download>` | No `downloads` permission needed |
| Payments | ExtensionPay / LemonSqueezy | No own backend required |
| i18n | `default_locale: en`, Spanish second | English market is ~10x; store falls back to the default locale |
