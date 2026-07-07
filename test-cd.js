// Quick cd-resolver test outside the browser (node test-cd.js)
global.window = {};
const fs = require("fs");
eval(fs.readFileSync("content/dom-utils.js", "utf8"));
eval(fs.readFileSync("content/commands.js", "utf8"));
const WS = window.WebShell;

const cur = "https://site.com/docs/api/intro";
let failures = 0;

function check(name, got, want) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) {
    console.log(`ok    ${name} -> ${g}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}\n  got:  ${g}\n  want: ${w}`);
  }
}

check('cd (alone)', WS.resolveCd("", cur), { type: "url", url: "https://site.com/" });
check('cd /', WS.resolveCd("/", cur), { type: "url", url: "https://site.com/" });
check('cd -', WS.resolveCd("-", cur), { type: "back" });
check(
  "cd https://example.org/x",
  WS.resolveCd("https://example.org/x", cur),
  { type: "url", url: "https://example.org/x" }
);
check("cd /pricing", WS.resolveCd("/pricing", cur), {
  type: "url",
  url: "https://site.com/pricing",
});
check("cd ..", WS.resolveCd("..", cur), { type: "url", url: "https://site.com/docs/api" });
check("cd ../..", WS.resolveCd("../..", cur), { type: "url", url: "https://site.com/docs" });
check(
  "cd ../guide",
  WS.resolveCd("../guide", cur),
  { type: "url", url: "https://site.com/docs/api/guide" }
);
check(
  "cd ../../../.. (clamps at root)",
  WS.resolveCd("../../../..", cur),
  { type: "url", url: "https://site.com/" }
);

const domain = WS.resolveCd("example.com", cur);
check(
  "cd example.com (ambiguous, domainish)",
  [domain.type, domain.domainUrl],
  ["ambiguous", "https://example.com"]
);

const path = WS.resolveCd("docs", cur);
check(
  "cd docs (ambiguous, path fallback)",
  [path.type, path.domainUrl, path.pathUrl],
  ["ambiguous", null, "https://site.com/docs/api/intro/docs"]
);

const selector = WS.resolveCd("a.next-page", cur);
check(
  "cd a.next-page (ambiguous — the command checks the DOM first)",
  selector.type,
  "ambiguous"
);

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall cd tests passed");
