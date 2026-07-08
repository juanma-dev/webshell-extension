# 30-second demo video — shooting script

**Format:** 1280×800 (the store's screenshot/video ratio), no voice needed —
big cursor, calm typing, captions do the talking. Record with OBS or Win+Alt+R
(Game Bar), trim in Clipchamp (built into Windows 11). Hide bookmarks bar
(Ctrl+Shift+B) and use a clean profile without other extensions.

**Golden rule:** one idea per scene, type slowly (the viewer reads at your
typing speed), 2 takes per scene and keep the best.

| Time | Scene | Actions | Caption on screen |
|---|---|---|---|
| 0–4s | Wikipedia, article with a big table (e.g. "List of countries by GDP") | Press Alt+W — terminal slides up | **Any webpage is a filesystem** |
| 4–11s | Same page | Type `extract table | to-csv > gdp.csv` → Enter → the CSV downloads; click it open for 1 second | **Extract anything to CSV — one command** |
| 11–17s | A shopping site (Amazon or MercadoLibre product) | Type `pick` → hover shows the green highlight → click the price → prompt comes back prefilled → Enter | **No selectors to memorize: point & click** |
| 17–23s | Same product | Type `watch .a-price 5` → switch to another window → desktop notification pops | **Get alerts when anything changes** |
| 23–27s | A news site drowning in banners | Type `rm .cookie-banner, .modal` → clutter vanishes | **Clean up any page** |
| 27–30s | End card (static) | Logo + name + store URL | **WebShell — free on the Chrome Web Store** |

**Trick for the notification scene:** start `watch <selector> 5`, then in
DevTools (F12 → Elements) edit the price text by hand — the watch fires within
5 seconds and the Windows notification appears on camera.

**End card:** make a 1280×800 slide (PowerPoint export works) with
icon128.png, "WebShell", and `chromewebstore.google.com/detail/ajgieopkcookmkfbanehjimlbojbijei`.

Reuse the same recording, cut to 15s (scenes 1-2 + end card), as the attachment
for the X thread.
