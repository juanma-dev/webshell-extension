# WebShell

> Una terminal estilo Unix dentro de cualquier página web.
> El DOM es tu sistema de archivos: lista, filtra, extrae a CSV, modifica y vigila con comandos.

## Instalación (modo desarrollador)

1. Abre Chrome y ve a `chrome://extensions`
2. Activa **Modo de desarrollador** (esquina superior derecha)
3. Clic en **Cargar extensión sin empaquetar** y elige esta carpeta
4. Abre cualquier página web y presiona **Alt+W** o haz clic en el icono de la extensión
   (también funciona **`` Ctrl+` ``** en teclados con esa tecla)

El atajo se puede cambiar en `chrome://extensions/shortcuts`.

> Si modificas el código: recarga la extensión en `chrome://extensions` (flecha circular).
> No hace falta recargar las páginas — el icono inyecta la terminal automáticamente.

## Comandos

| Comando | Qué hace | Ejemplo |
|---|---|---|
| `help` | lista todos los comandos | `help grep` |
| `ls <sel>` | lista elementos por selector CSS | `ls .product-card` |
| `grep <patrón> [sel]` | filtra por texto (regex) | `ls h2 \| grep oferta` |
| `count` | cuenta items | `ls img \| count` |
| `text <sel>` | extrae el texto | `text h1` |
| `attr <nombre>` | extrae un atributo | `ls img \| attr src` |
| `links [sel]` | todas las URLs de la página | `links nav` |
| `extract <sel>` | tablas → filas, listas → items, `a` → texto+URL, `img` → alt+src | `extract a \| to-csv > enlaces.csv` |
| `to-csv` | convierte el pipe a CSV | `extract table \| to-csv > datos.csv` |
| `to-json` | convierte el pipe a JSON | `links \| to-json > urls.json` |
| `download <archivo>` | descarga el pipe como archivo | `text p \| download notas.txt` |
| `click <sel>` | hace clic en elementos | `click .load-more` |
| `fill <sel> "texto"` | rellena inputs | `fill input[name=q] "rust wasm"` |
| `hide` / `show` / `rm` | oculta / muestra / elimina | `rm .ad-banner` |
| `css <sel> "estilos"` | aplica CSS inline | `css body "filter: invert(1)"` |
| `pick` | clic en la página → te da el selector CSS | `pick` (Esc cancela) |
| `watch <sel> [segs]` | notifica si el texto cambia | `watch .price 30` |
| `clear` | limpia la terminal | |

### Pipes y redirección

Los comandos se encadenan con `|` como en bash, y `> archivo` descarga el resultado:

```
extract table.precios | to-csv > precios.csv
ls a | grep "descargar" | attr href | download enlaces.txt
ls h2 | grep -ofertas | count
```

### Recetas útiles

```
links | grep linkedin > perfiles.txt        # extraer enlaces filtrados
watch .stock-status 60                      # avisa si vuelve a haber stock
rm .modal, .overlay, .cookie-banner         # limpiar una página molesta
extract ul.results | to-csv > resultados.csv
```

## Estructura del proyecto

```
manifest.json                  Manifest V3
content/
  dom-utils.js                 selección, extracción, CSV, descargas
  commands.js                  registro de comandos del shell
  parser.js                    tokenizador, pipes, redirección
  terminal.js                  UI de la terminal, historial, atajo Ctrl+`
  terminal.css                 estilos del overlay
background/
  service-worker.js            notificaciones de escritorio (watch)
icons/                         iconos 16/48/128
```

## Roadmap

Ver [ROADMAP.md](ROADMAP.md) — fases, monetización y dónde entra Rust
(host de Native Messaging y módulos WASM).
