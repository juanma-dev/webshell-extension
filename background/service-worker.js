// WebShell — service worker.
// Desktop notifications for `watch`, and opening the terminal from the icon or shortcut (Alt+W).
"use strict";

chrome.runtime.onMessage.addListener((msg, _sender) => {
  if (msg && msg.type === "notify") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: msg.title || "WebShell",
      message: msg.message || "",
      priority: 1,
    });
  }
});

const CONTENT_FILES = [
  "content/dom-utils.js",
  "content/commands.js",
  "content/parser.js",
  "content/picker.js",
  "content/terminal.js",
];

/**
 * Toggles the terminal in a tab. If the content script isn't there
 * (the page was opened before installing/reloading the extension),
 * inject it on the spot — no page reload needed.
 */
async function toggleInTab(tab) {
  if (!tab || tab.id == null) return;
  const url = tab.url || "";
  // Browser-internal pages and the Web Store don't allow injection.
  if (!/^(https?|file):/.test(url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-terminal" });
  } catch {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content/terminal.css"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: CONTENT_FILES,
      });
      await chrome.tabs.sendMessage(tab.id, { type: "toggle-terminal" });
    } catch (e) {
      console.warn("WebShell: could not inject into tab", tab.id, e);
    }
  }
}

chrome.action.onClicked.addListener(toggleInTab);

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-terminal") toggleInTab(tab);
});
