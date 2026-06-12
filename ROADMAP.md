# WebShell — Roadmap del proyecto

> Terminal Unix donde el sitio web es el sistema de archivos.
> Marca con `[x]` lo que se va completando.

---

## Fase 1 — MVP: la terminal que funciona hoy (semanas 1-2)

**Objetivo:** cargar la extensión en Chrome, abrir la terminal en cualquier página
y extraer datos a CSV. Esto es lo que se publica primero en la Chrome Web Store.

- [x] Estructura del proyecto y `manifest.json` (Manifest V3)
- [x] Iconos de la extensión (16/48/128 px)
- [x] Utilidades DOM: selección por CSS, extracción de tablas/listas, generador CSV
- [x] Parser de comandos: tokenizador con comillas, pipes `|`, redirección `> archivo`
- [x] Comandos básicos: `help`, `ls`, `grep`, `count`, `text`, `attr`, `links`
- [x] Extracción: `extract`, `to-csv`, `to-json`, `download`
- [x] Manipulación DOM: `click`, `hide`, `show`, `rm`, `css`, `fill`
- [x] Monitor: `watch <selector>` con notificación de escritorio al cambiar
- [x] Terminal overlay: toggle con `` Ctrl+` ``, historial con flechas, autoscroll
- [x] Service worker: notificaciones de escritorio
- [x] README con instalación y manual de comandos
- [ ] Probar en 5 sitios reales (Amazon, Wikipedia, MercadoLibre, un periódico, GitHub)
- [ ] Pulir estilos de la terminal (temas claro/oscuro)

## Fase 2 — Publicación y primeros usuarios (semanas 3-4)

- [ ] Autocompletado de selectores CSS con Tab
- [ ] Comando `pick`: clic en un elemento de la página para obtener su selector
- [ ] Persistir historial de comandos por dominio (`chrome.storage`)
- [ ] `watch` persistente: sigue funcionando al recargar la página
- [ ] Página de opciones (atajo de teclado configurable, tema)
- [ ] Cuenta de desarrollador Chrome Web Store ($5 USD, pago único)
- [ ] Capturas, video demo de 30s, descripción de la ficha
- [ ] Publicar versión gratuita en la Chrome Web Store
- [ ] Landing page simple (GitHub Pages sirve para empezar)
- [ ] Anunciar en Reddit (r/webdev, r/chrome_extensions), X, Product Hunt

## Fase 3 — Monetización: Native Messaging con Rust (mes 2)

**Aquí entra Rust.** Host nativo que la extensión instala para tocar el sistema real.

- [ ] Host de Native Messaging en Rust (binario único, protocolo stdin/stdout)
- [ ] Instalador del host (script + registro en Windows / manifest en disco)
- [ ] Comando `sh <script>`: ejecutar comandos del sistema desde la terminal web
- [ ] Pipe hacia el sistema: `extract tabla | sh procesar.sh`
- [ ] Guardar archivos directamente en disco (no solo Descargas)
- [ ] Sistema de licencias Pro (ExtensionPay o LemonSqueezy)
- [ ] Gate de funciones Pro: native messaging, watches ilimitados
- [ ] Precio: Free / Pro $8 USD/mes / Lifetime $129 USD

## Fase 4 — Diferenciadores (mes 3+)

- [ ] Macros: grabar clics/inputs y reproducirlos como script editable
- [ ] Scheduler: `cron "0 9 * * *" 'watch .precio'` (alarms + service worker)
- [ ] Módulo WASM en Rust: parseo/regex de alto volumen para páginas gigantes
- [ ] Capa IA: lenguaje natural → comando (`"saca todos los emails"`)
- [ ] Webhooks: `watch .precio --webhook https://...`

## Fase 5 — Escala (mes 6+)

- [ ] Marketplace de scripts comunitarios (con comisión)
- [ ] Plan Teams: scripts compartidos ($15/usuario/mes)
- [ ] Sincronización de scripts entre dispositivos
- [ ] Versión Firefox/Edge

---

## Decisiones técnicas tomadas

| Decisión | Elección | Por qué |
|---|---|---|
| Lenguaje de la extensión | JavaScript puro, sin bundler | El navegador solo ejecuta JS; sin build = cargar y probar al instante |
| Dónde entra Rust | Host nativo (fase 3) y WASM (fase 4) | Binario único sin dependencias; velocidad para procesamiento pesado |
| Manifest | V3 | V2 está muerto en Chrome Web Store |
| Descarga de archivos | Blob + `<a download>` | No requiere permiso `downloads` |
| Pagos | ExtensionPay / LemonSqueezy | No requieren backend propio |
