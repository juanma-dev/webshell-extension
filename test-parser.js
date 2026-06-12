// Quick parser test outside the browser (node test-parser.js)
global.window = {};
const fs = require("fs");
eval(fs.readFileSync("content/dom-utils.js", "utf8"));
eval(fs.readFileSync("content/parser.js", "utf8"));
const WS = window.WebShell;

console.log(JSON.stringify(WS.parse("extract table.prices | to-csv > data.csv")));
console.log(JSON.stringify(WS.parse('fill input[name=q] "hello world"')));
console.log(JSON.stringify(WS.parse("")));
console.log(JSON.stringify(WS.parse("ls a | grep download | attr href")));

try {
  WS.parse('ls "unclosed');
} catch (e) {
  console.log("expected error:", e.message);
}
try {
  WS.parse("extract table >");
} catch (e) {
  console.log("expected error:", e.message);
}

console.log("CSV:", JSON.stringify(WS.toCSV([["a", "b,c"], ['d"e', "f"]])));
