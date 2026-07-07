# Chrome Web Store listing — WebShell

Working copy for the store listing. The store shows the right language
automatically because the extension declares `_locales` (en default, es).

## Category

Productivity → Tools (alternative: Developer Tools — Productivity has more traffic).

## Short description (max 132 chars)

**EN:**
> A terminal for any webpage: scrape data to CSV, clean up pages, and get alerts when content changes. Point, click, extract.

**ES:**
> Una terminal para cualquier página: extrae datos a CSV, limpia páginas y recibe alertas cuando algo cambia. Apunta, clic, extrae.

## Detailed description

**EN:**

```
WebShell turns any webpage into a Unix-style terminal. Press Alt+W and the
page becomes your filesystem: list, filter, extract and watch — with
commands and pipes, no code required.

⚡ EXTRACT ANYTHING TO CSV
Type pick, click what you want, press Enter. Tables, product lists,
links, images — downloaded as CSV or JSON in seconds.
  extract table | to-csv > data.csv

🔍 FIND LIKE IN BASH
  ls .product-card          list elements
  grep "free shipping"      filter by text (regex)
  links | uniq              every URL on the page, deduped

🔔 WATCH FOR CHANGES
  watch .price 30
Get a desktop notification when a price drops, stock returns or any
content changes — even while you work in another window.

🧹 CLEAN UP ANY PAGE
  rm .cookie-banner, .modal, .ad
Remove banners, overlays and clutter from your view with one command.

🆕 NEW IN 0.2
Navigate with cd and pwd, query APIs with curl, check latency with ping,
Tab autocomplete, per-site command history, persistent watches, resizable
terminal, light/dark themes and an options page. No new permissions.

🔒 PRIVATE BY DESIGN
Everything runs locally in your browser. No account, no servers, no
data ever leaves your machine.

Press Alt+W on any page and type help to see all 28 commands.
```

**ES:**

```
WebShell convierte cualquier página web en una terminal estilo Unix.
Presiona Alt+W y la página se vuelve tu sistema de archivos: lista,
filtra, extrae y vigila — con comandos y pipes, sin programar.

⚡ EXTRAE LO QUE SEA A CSV
Escribe pick, haz clic en lo que quieras, presiona Enter. Tablas,
listas de productos, enlaces, imágenes — en CSV o JSON en segundos.
  extract table | to-csv > datos.csv

🔍 BUSCA COMO EN BASH
  ls .product-card          lista elementos
  grep "envío gratis"       filtra por texto (regex)
  links | uniq              todas las URLs de la página, sin duplicados

🔔 VIGILA CAMBIOS
  watch .precio 30
Recibe una notificación de escritorio cuando baje un precio, vuelva el
stock o cambie cualquier contenido — aunque estés en otra ventana.

🧹 LIMPIA CUALQUIER PÁGINA
  rm .cookie-banner, .modal, .ad
Quita banners, overlays y estorbos de tu vista con un comando.

🆕 NUEVO EN 0.2
Navega con cd y pwd, consulta APIs con curl, mide latencia con ping,
autocompletado con Tab, historial por sitio, watches persistentes,
terminal redimensionable, temas claro/oscuro y página de opciones.
Sin permisos nuevos.

🔒 PRIVADO POR DISEÑO
Todo corre localmente en tu navegador. Sin cuenta, sin servidores,
tus datos nunca salen de tu máquina.

Presiona Alt+W en cualquier página y escribe help para ver los 28 comandos.
```

> The store has no changelog field: the "NEW IN 0.2" section above is part of
> the detailed description itself. Paste each block as-is — the description
> field is plain text (no markdown, no backticks).

## Assets checklist

- [ ] 5 screenshots, 1280×800 (the store's main format):
  1. Terminal open on Wikipedia with `extract table | to-csv` and the CSV visible
  2. `pick` highlighting a product card on a shopping site
  3. `watch .price` + the Windows desktop notification
  4. `rm .cookie-banner` before/after on a news site
  5. `help` showing the command list
- [ ] Small promo tile, 440×280 (icon + "A terminal for any webpage")
- [ ] Optional: 30s screencast (screen recording of pick → extract → CSV opens)

## Publishing notes

- Developer account: https://chrome.google.com/webstore/devconsole ($5 one-time)
- Build the zip: `powershell -File scripts/package.ps1`
- Justify permissions in the listing (review asks): `scripting` + `<all_urls>`
  → "injects the terminal UI into the page the user invokes it on";
  `notifications` → "watch command alerts"; `storage` → "user preferences".
- Privacy: declare that no user data is collected or transmitted.
