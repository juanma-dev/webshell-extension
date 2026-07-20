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

🆕 NEW IN 0.4 — THE SCRAPING SUITE (PRO)
Your daily data-collection loop, end to end:
  crawl table all | extract | where "price < 100" | sort -price | to-csv
• crawl — every page of a paginated listing in one go; the tab never
  navigates and it uses your logged-in session
• where / sort — query any extracted table like a database
• snap / diff — row-by-row "what changed since yesterday"
  (~ Widget: $49.99 → $39.99)
• macro — record a sequence of commands, replay it anywhere
• cron — run any command on a timer, even with the tab closed
• watch --webhook — POST changes to Slack, Zapier, n8n or your server

🖥 WEBSHELL PRO — REAL SSH (OPTIONAL)
Real SSH from inside your browser. Type ssh user@yourserver.com and get a
full terminal — colors, vim, even your server's Powerlevel10k prompt —
running on any device, Chromebooks included. Your session is end-to-end
encrypted: our relay only ever sees ciphertext, never your passwords or
data. Works with servers on the public internet (public IP or domain).

WebShell Pro is a paid upgrade: $8/month or $129 once (lifetime). The
license activates automatically after checkout — nothing to paste — and
renewals are silent. Cancel anytime, self-serve. 14-day refund policy at
web-shell.app/refunds.html. Payments by Paddle (merchant of record).

Everything else in WebShell stays free, forever.

🔒 PRIVATE BY DESIGN
The free extension runs 100% locally: no account, no servers, no data
ever leaves your machine. If you buy Pro, we only use your email (for
the license) and relay your encrypted ssh traffic — we can't read it.
Full policy: web-shell.app/privacy.html

Press Alt+W on any page and type help to see every command.
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

🆕 NUEVO EN 0.4 — LA SUITE DE SCRAPING (PRO)
Tu ciclo diario de recolección de datos, completo:
  crawl table all | extract | where "precio < 100" | sort -precio | to-csv
• crawl — todas las páginas de un listado paginado de una vez; la pestaña
  nunca navega y usa tu sesión iniciada
• where / sort — consulta cualquier tabla extraída como base de datos
• snap / diff — qué cambió desde ayer, fila por fila
  (~ Widget: $49.99 → $39.99)
• macro — graba una secuencia de comandos y reprodúcela donde sea
• cron — ejecuta cualquier comando con temporizador, aun con la pestaña cerrada
• watch --webhook — envía los cambios a Slack, Zapier, n8n o tu servidor

🖥 WEBSHELL PRO — SSH REAL (OPCIONAL)
SSH real dentro de tu navegador. Escribe ssh usuario@tuservidor.com y
tienes una terminal completa — colores, vim, hasta el prompt Powerlevel10k
de tu servidor — en cualquier equipo, Chromebooks incluidos. Tu sesión va
cifrada de extremo a extremo: nuestro relay solo ve texto cifrado, nunca
tus contraseñas ni tus datos. Funciona con servidores en internet pública
(IP o dominio público).

WebShell Pro es una mejora de pago: $8/mes o $129 una vez (de por vida).
La licencia se activa sola tras el pago — nada que pegar — y las
renovaciones son silenciosas. Cancela cuando quieras, sin trámites.
Garantía de 14 días: web-shell.app/refunds.html. Pagos por Paddle
(merchant of record).

Todo lo demás de WebShell sigue gratis, para siempre.

🔒 PRIVADO POR DISEÑO
La extensión gratuita corre 100% local: sin cuenta, sin servidores, tus
datos nunca salen de tu máquina. Si compras Pro, solo usamos tu email
(para la licencia) y transportamos tu tráfico ssh cifrado — no podemos
leerlo. Política completa: web-shell.app/privacy.html

Presiona Alt+W en cualquier página y escribe help para ver todos los comandos.
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
  `notifications` → "watch command alerts"; `storage` → "user preferences
  and the Pro license".

### Privacy tab (dashboard) — updated for 0.3 / Pro

The old "collects nothing" answer is no longer accurate. Declare:

- **Data collected**: *Personally identifiable information → Email address.*
  Purpose: **app functionality** (license issuance/renewal for the optional
  paid tier). Not sold, not shared beyond the payment processor (Paddle,
  merchant of record), not used for unrelated purposes — tick the three
  certification boxes accordingly.
- **Authentication information**: NOT collected (ssh credentials never reach
  us — end-to-end encrypted in the browser; the relay sees ciphertext only).
- **Web history / user activity / location etc.**: not collected.
- Privacy policy URL for the listing: `https://web-shell.app/privacy.html`
- Remote code: none — all code (including the WASM ssh client) ships inside
  the package. Paddle.js loads on our website, not in the extension.
- Single purpose: "a command-line terminal for interacting with webpages and
  servers" — Pro ssh is part of that purpose.
