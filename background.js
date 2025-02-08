chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "readText",
    title: "Read selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "readText") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).then(() => {
      // Send message after the script is injected
      chrome.tabs.sendMessage(tab.id, { action: "readSelectedText" });
    }).catch((error) => {
      console.error("Failed to inject content script:", error);
    });
  }
});