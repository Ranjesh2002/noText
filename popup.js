document.getElementById("speedControl").addEventListener("input", (event) => {
  const speed = parseFloat(event.target.value);
  chrome.storage.sync.set({ speechRate: speed });
});

document.getElementById("readTextButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "readSelectedText" });
  });
});

// Sync speed control with content script
chrome.storage.sync.get("speechRate", (data) => {
  const speed = data.speechRate || 1;
  document.getElementById("speedControl").value = speed;
});
