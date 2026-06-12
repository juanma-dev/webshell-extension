// Test rápido del parser fuera del navegador (node test-parser.js)
global.window = {};
const fs = require("fs");
eval(fs.readFileSync("content/dom-utils.js", "utf8"));
eval(fs.readFileSync("content/parser.js", "utf8"));
const WS = window.WebShell;

console.log(JSON.stringify(WS.parse("extract table.precios | to-csv > datos.csv")));
console.log(JSON.stringify(WS.parse('fill input[name=q] "hola mundo"')));
console.log(JSON.stringify(WS.parse("")));
console.log(JSON.stringify(WS.parse("ls a | grep descargar | attr href")));

try {
  WS.parse('ls "sin cerrar');
} catch (e) {
  console.log("error esperado:", e.message);
}
try {
  WS.parse("extract table >");
} catch (e) {
  console.log("error esperado:", e.message);
}

console.log("CSV:", JSON.stringify(WS.toCSV([["a", "b,c"], ['d"e', "f"]])));
