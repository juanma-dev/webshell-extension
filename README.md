# WebShell

> A Unix-style terminal inside any webpage.
> The DOM is your filesystem: list, filter, extract to CSV, modify and watch — with shell commands.

## Install (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right corner)
3. Click **Load unpacked** and pick this folder
4. Open any webpage and press **Alt+W** or click the extension icon
   (**`` Ctrl+` ``** also works on keyboards that have that key)

The shortcut can be changed at `chrome://extensions/shortcuts`.

> If you edit the code: reload the extension at `chrome://extensions` (circular arrow).
> No need to reload pages — the icon injects the terminal automatically.

## Commands

| Command | What it does | Example |
|---|---|---|
| `help` | list all commands | `help grep` |
| `ls <sel>` | list elements by CSS selector | `ls .product-card` |
| `grep <pattern> [sel]` | filter by text (regex) | `ls h2 \| grep sale` |
| `count` | count items | `ls img \| count` |
| `text <sel>` | extract text | `text h1` |
| `attr <name>` | extract an attribute | `ls img \| attr src` |
| `links [sel]` | all URLs on the page | `links nav` |
| `extract <sel>` | tables → rows, lists → items, `a` → text+URL, `img` → alt+src | `extract a \| to-csv > links.csv` |
| `uniq` | remove duplicates from the pipe | `extract a \| uniq` |
| `to-csv` | convert the pipe to CSV | `extract table \| to-csv > data.csv` |
| `to-json` | convert the pipe to JSON | `links \| to-json > urls.json` |
| `download <file>` | download the pipe as a file | `text p \| download notes.txt` |
| `click <sel>` | click elements | `click .load-more` |
| `fill <sel> "text"` | fill inputs | `fill input[name=q] "rust wasm"` |
| `hide` / `show` / `rm` | hide / show / remove | `rm .ad-banner` |
| `css <sel> "styles"` | apply inline CSS | `css body "filter: invert(1)"` |
| `pick` | click the page → get the CSS selector | `pick` (Esc cancels) |
| `watch <sel> [secs]` | notify when text changes (persists across reloads) | `watch .price 30` |
| `cd <target>` | navigate: URL, `/path`, `..`, `-`, or a link's selector | `cd ..` · `cd a.next-page` |
| `pwd` | print the current URL | `pwd` |
| `curl <url> [-i]` | fetch a URL into the pipe (`-i` includes headers) | `curl api.github.com/zen` |
| `ping <host> [n]` | HTTP reachability + latency (not ICMP) | `ping example.com` |
| `history` | this site's command history (persisted) | `history \| grep extract` |
| `theme <mode>` | terminal theme: dark, light or auto | `theme light` |
| `feedback` | report a bug / request a feature | `feedback` |
| `clear` | clear the terminal | |

### Pipes and redirection

Commands chain with `|` like in bash, and `> file` downloads the result:

```
extract table.prices | to-csv > prices.csv
ls a | grep "download" | attr href | download links.txt
ls h2 | grep deals | count
```

### Handy recipes

```
links | grep linkedin > profiles.txt        # extract filtered links
watch .stock-status 60                      # alert when back in stock
rm .modal, .overlay, .cookie-banner         # clean up an annoying page
extract ul.results | to-csv > results.csv
curl api.github.com/zen                     # query any API from the page
cd a.next-page                              # follow the "next" link
```

### Terminal niceties

- **Tab** completes command names and CSS selectors from the page (`ls .pro<Tab>`)
- **↑/↓** browse the command history — saved per site, across sessions (`history`)
- **Drag the top edge** of the terminal to resize it; the height is remembered
- **Themes**: `theme dark|light|auto` — or set it in the extension's Options page
- If the terminal was open, it **reopens after navigating** (`cd`, reload, links)
- `watch` **keeps running across reloads**; stop with `watch rm <id|all>`

## Project structure

```
manifest.json                  Manifest V3
_locales/                      i18n (en default, es)
content/
  dom-utils.js                 selection, extraction, CSV, downloads
  storage.js                   chrome.storage helpers + service-worker messaging
  commands.js                  shell command registry
  parser.js                    tokenizer, pipes, redirection
  picker.js                    click → CSS selector
  terminal.js                  terminal UI, history, Tab completion, themes
  terminal.css                 overlay styles (dark/light themes)
background/
  service-worker.js            notifications, HTTP for ping/curl, injection
options/                       options page (theme, saved data, shortcuts)
icons/                         16/48/128 icons
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) — phases, monetization, and where Rust comes in
(Native Messaging host and WASM modules).

## License

Source-available under the [PolyForm Shield License 1.0.0](LICENSE.md): read it,
learn from it, open issues and PRs — but you may not ship a product that
competes with WebShell (republishing it as another extension counts, even for
free). The upcoming Pro features (native host, licensing) live in a separate
private repository.

Required Notice: Copyright Juan Manuel Castellanos Hernandez
(https://github.com/juanma-dev/webshell-extension)
