// WebShell — options page. Settings live in chrome.storage.local under
// "ws:settings"; open terminals apply theme changes live via storage.onChanged.
"use strict";

const ISSUES_URL = "https://github.com/juanma-dev/webshell-extension/issues/new";

for (const el of document.querySelectorAll("[data-i18n]")) {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n) || el.dataset.i18n;
}

document.getElementById("version").textContent =
  "v" + chrome.runtime.getManifest().version;
document.getElementById("issues").href = ISSUES_URL;
document.getElementById("review").href =
  "https://chromewebstore.google.com/detail/" + chrome.runtime.id;

async function loadTheme() {
  const obj = await chrome.storage.local.get("ws:settings");
  const theme = (obj["ws:settings"] && obj["ws:settings"].theme) || "auto";
  const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (radio) radio.checked = true;
}
loadTheme();

for (const radio of document.querySelectorAll('input[name="theme"]')) {
  radio.addEventListener("change", async () => {
    const obj = await chrome.storage.local.get("ws:settings");
    const settings = Object.assign({}, obj["ws:settings"], { theme: radio.value });
    await chrome.storage.local.set({ "ws:settings": settings });
  });
}

document.getElementById("clear").addEventListener("click", async () => {
  const all = await chrome.storage.local.get(null);
  const doomed = Object.keys(all).filter(
    (k) => k.startsWith("ws:history:") || k.startsWith("ws:watches:")
  );
  if (doomed.length) await chrome.storage.local.remove(doomed);
  document.getElementById("cleared").hidden = false;
});

document.getElementById("shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
