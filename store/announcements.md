# Announcement drafts — post when 0.2 is approved

Links to use everywhere:
- Store: https://chromewebstore.google.com/detail/ajgieopkcookmkfbanehjimlbojbijei
- Repo: https://github.com/juanma-dev/webshell-extension
- Landing: https://juanma-dev.github.io/webshell-extension/

**Suggested calendar** (don't fire everything the same day — each community
notices cross-posted spam):

| Day | Where |
|---|---|
| Day 1 (Tue–Thu, morning US time) | Show HN |
| Day 2 | r/chrome_extensions |
| Day 4 | r/webdev (lessons-learned angle) |
| Same week | X thread (EN + ES) |
| When the 30s video exists | Product Hunt |

Answer every comment the first 3–4 hours after posting — that's what keeps a
post alive on HN and Reddit.

---

## Show HN

**Title:**

> Show HN: WebShell – A Unix-style terminal inside any webpage

**Body:**

> Hi HN! I built a Chrome extension that treats the webpage you're on as a
> filesystem: press Alt+W and you get a terminal where you can pipe commands
> against the DOM.
>
>     extract table | to-csv > prices.csv
>     ls a | grep download | attr href | download links.txt
>     watch .price 30        # desktop notification when it changes
>     curl api.github.com/zen | download zen.txt
>
> A `pick` command lets you click any element and get a stable CSS selector
> back (it skips machine-generated class names and prefers data-testid-style
> hooks). There's Tab completion for selectors scanned from the live page.
>
> Technical notes: Manifest V3, plain JavaScript, no build step, no
> analytics — everything runs locally. curl/ping go through the service
> worker because content scripts are CORS-bound and the worker isn't.
> The browser sandbox has no raw sockets, so ssh/telnet/real ICMP ping are
> impossible in the extension itself — that's the next phase, via a native
> messaging host in Rust (which will be the paid tier; the extension stays
> free).
>
> Source is public (PolyForm Shield license): [repo link]
> Store: [store link]
>
> Would love feedback — especially which sites break it. There's a
> `feedback` command in the terminal that opens a prefilled GitHub issue.

---

## r/chrome_extensions

**Title:**

> I made WebShell — a Unix-style terminal for any webpage (extract to CSV, watch for changes, curl from the page)

**Body:**

> Press Alt+W on any page and you get a terminal where the DOM is the
> filesystem. 28 commands with pipes and redirection:
>
> - `pick` → click an element, get a stable CSS selector
> - `extract table | to-csv > data.csv` → scrape without writing code
> - `watch .price 30` → desktop notification on changes (survives reloads)
> - `cd` / `pwd` → navigate the site like a directory tree
> - `curl` / `ping` → query APIs from the page, no CORS pain
>
> Just shipped 0.2: Tab autocomplete, per-site command history, resizable
> terminal, light/dark themes, options page. No new permissions.
>
> Free, no account, no analytics, source on GitHub: [repo link]
> Store: [store link]
>
> Happy to answer anything about the MV3 gotchas I hit building it.

---

## r/webdev (lessons-learned angle — read the sub rules before posting)

**Title:**

> I built a terminal that treats any webpage as a filesystem — 5 things the modern DOM taught me

**Body:**

> I've been building WebShell, a Chrome extension that gives you a Unix-style
> terminal on any page (`extract table | to-csv > data.csv`). Testing it on
> Wikipedia, Amazon, BBC, GitHub and X taught me more about the real-world
> DOM than years of normal frontend work:
>
> 1. **Class names are dead as selectors.** On X/GitHub, classes are hashed
>    per deploy (`css-1dbjc4n`). The stable hooks are `data-testid`-style
>    attributes that sites ship for their own tests — my `pick` command
>    prefers those and rejects anything that looks machine-generated.
> 2. **Virtualized feeds lie to you.** On X, `ls article` only sees what's
>    rendered in the viewport. The DOM you can query is a window, not the
>    document.
> 3. **Content scripts are CORS-bound, service workers aren't.** Since
>    Chrome ~85 a content script fetch behaves like the page's own. My
>    `curl` command proxies through the MV3 service worker, which can fetch
>    cross-origin thanks to host_permissions.
> 4. **The extension sandbox has no sockets.** ssh/telnet/ICMP ping are
>    flat-out impossible in an extension — chrome.sockets died with Chrome
>    Apps. Native messaging is the only door to the system.
> 5. **MV3 service workers die constantly.** Any state that matters lives in
>    chrome.storage.session, never in a variable.
>
> The extension is free and the source is public if you want to poke at it:
> [repo link] · [store link]

---

## X / Twitter thread

**EN:**

> 1/ I built WebShell: a Unix-style terminal inside any webpage.
> Press Alt+W → the page becomes your filesystem.
> extract table | to-csv > data.csv
> Free on the Chrome Web Store: [store link]
> [attach: 30s video or GIF]

> 2/ No selectors memorized: type `pick`, click the thing, get a stable CSS
> selector back. Then pipe it: extract, grep, uniq, to-json, download.

> 3/ `watch .price 30` → desktop notification when a price drops or stock
> returns. Watches survive reloads. And `curl` works from any page — the
> service worker does the fetch, so no CORS pain.

> 4/ It's free, no account, no analytics, source on GitHub: [repo link]
> Next: ssh + real ping via a native Rust host (browsers have no sockets —
> that's where Pro begins). Feedback → type `feedback` in the terminal.

**ES:**

> 1/ Construí WebShell: una terminal estilo Unix dentro de cualquier página.
> Alt+W → la página se vuelve tu sistema de archivos.
> extract table | to-csv > datos.csv
> Gratis en la Chrome Web Store: [store link]

> 2/ Sin memorizar selectores: escribe `pick`, haz clic en lo que quieras y
> te devuelve un selector CSS estable. Luego encadena: extract, grep, uniq,
> to-json, download.

> 3/ `watch .precio 30` → notificación de escritorio cuando baja un precio o
> vuelve el stock. Los watches sobreviven recargas. Y `curl` funciona desde
> cualquier página, sin dolores de CORS.

> 4/ Gratis, sin cuenta, sin analytics, código en GitHub: [repo link]
> Próximo paso: ssh y ping real vía un host nativo en Rust. Feedback →
> escribe `feedback` en la terminal.

---

## Product Hunt (launch after the 30s video exists)

- **Name:** WebShell
- **Tagline:** A Unix-style terminal inside any webpage
- **Description:** Press Alt+W and the page becomes your filesystem: extract
  tables to CSV, point-and-click CSS selectors, watch for changes with
  desktop alerts, curl APIs from any tab. Free, private, source-available.
- **First maker comment:**

> Hi hunters! I built WebShell because every "export this table" task ended
> in a throwaway Python script. Now it's one command: extract table | to-csv.
> It's free, runs 100% locally (no account, no analytics) and the source is
> public. The next chapter is a native Rust host for ssh and real ping —
> browsers can't open sockets, so that's where the Pro tier will live.
> Ask me anything, and if you try it: `feedback "your idea"` opens a
> prefilled GitHub issue right from the terminal.
