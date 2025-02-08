// Initialize global variables
if (!window.utterance) {
  window.utterance = null;
  window.isSpeaking = false;
  window.currentText = "";
  window.currentIndex = 0;
  window.selectedVoice = null;
  window.lastWordPosition = 0;
}

// Error handling utility
function handleSpeechError(error) {
  let errorMessage = "An error occurred with text-to-speech: ";

  switch (error.error) {
    case "canceled":
      return;
    case "interrupted":
      errorMessage += "Speech was interrupted.";
      break;
    case "audio-busy":
      errorMessage += "Audio system is busy. Please try again.";
      break;
    case "network":
      errorMessage += "Network error occurred. Please check your connection.";
      break;
    case "synthesis-unavailable":
      errorMessage += "Text-to-speech is not available on your system.";
      break;
    default:
      errorMessage += "Unknown error occurred.";
  }
  showNotification(errorMessage, "error");
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.padding = "12px 24px";
  notification.style.borderRadius = "8px";
  notification.style.backgroundColor = type === "error" ? "#ff5252" : "#4caf50";
  notification.style.color = "white";
  notification.style.zIndex = "10001";
  notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  notification.style.transition = "opacity 0.3s ease";
  notification.innerText = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function createVoiceSelect() {
  const select = document.createElement("select");
  select.style.marginLeft = "10px";
  select.style.padding = "8px 12px";
  select.style.borderRadius = "6px";
  select.style.border = "1px solid #e0e0e0";
  select.style.backgroundColor = "white";
  select.style.cursor = "pointer";
  select.style.fontSize = "14px";
  select.style.color = "#333";
  select.style.width = "200px";
  select.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";

  select.addEventListener("mouseover", () => {
    select.style.borderColor = "#2196F3";
  });

  select.addEventListener("mouseout", () => {
    select.style.borderColor = "#e0e0e0";
  });

  let voices = speechSynthesis.getVoices();

  if (voices.length === 0) {
    speechSynthesis.addEventListener("voiceschanged", () => {
      voices = speechSynthesis.getVoices();
      populateVoices(voices, select);
    });
  } else {
    populateVoices(voices, select);
  }

  select.addEventListener("change", (e) => {
    window.selectedVoice = voices[e.target.selectedIndex];
    if (window.utterance) {
      const currentPosition = getCurrentWordPosition();
      speechSynthesis.cancel();
      speakText(window.currentText, findTextPosition(currentPosition));
    }
  });

  return select;
}

function createButton(text) {
  const button = document.createElement("button");
  button.innerText = text;
  button.style.padding = "8px 16px";
  button.style.borderRadius = "6px";
  button.style.border = "1px solid #e0e0e0";
  button.style.backgroundColor = "white";
  button.style.cursor = "pointer";
  button.style.fontSize = "14px";
  button.style.color = "#333";
  button.style.transition = "all 0.2s ease";
  button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#f5f5f5";
    button.style.borderColor = "#2196F3";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "white";
    button.style.borderColor = "#e0e0e0";
  });

  return button;
}

function getCurrentWordPosition() {
  if (!window.utterance || !window.currentText) return 0;

  const textUpToCurrent = window.currentText.substring(0, window.currentIndex);
  const words = textUpToCurrent.trim().split(/\s+/);
  return words.length - 1;
}

function findTextPosition(wordIndex) {
  if (!window.currentText) return 0;

  const words = window.currentText.trim().split(/\s+/);
  if (wordIndex >= words.length) return 0;

  let charPosition = 0;
  for (let i = 0; i < wordIndex; i++) {
    charPosition += words[i].length + 1;
  }

  return charPosition;
}

function createControlPanel() {
  let controlContainer = document.createElement("div");
  controlContainer.style.position = "fixed";
  controlContainer.style.bottom = "20px";
  controlContainer.style.right = "20px";
  controlContainer.style.background = "white";
  controlContainer.style.padding = "20px";
  controlContainer.style.borderRadius = "12px";
  controlContainer.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.1)";
  controlContainer.style.zIndex = "10000";
  controlContainer.style.display = "flex";
  controlContainer.style.flexDirection = "column";
  controlContainer.style.gap = "15px";
  controlContainer.style.minWidth = "300px";

  // Voice Selection Row
  let voiceRow = document.createElement("div");
  voiceRow.style.display = "flex";
  voiceRow.style.alignItems = "center";
  let voiceLabel = document.createElement("label");
  voiceLabel.innerText = "Voice:";
  voiceLabel.style.fontSize = "14px";
  voiceLabel.style.color = "#333";
  voiceLabel.style.minWidth = "50px";
  voiceRow.appendChild(voiceLabel);
  voiceRow.appendChild(createVoiceSelect());
  controlContainer.appendChild(voiceRow);

  // Speed Control Row
  let speedRow = document.createElement("div");
  speedRow.style.display = "flex";
  speedRow.style.alignItems = "center";
  let sliderLabel = document.createElement("label");
  sliderLabel.innerText = "Speed:";
  sliderLabel.style.fontSize = "14px";
  sliderLabel.style.color = "#333";
  sliderLabel.style.minWidth = "50px";

  let slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0.5";
  slider.max = "2";
  slider.step = "0.1";
  slider.value = "1";
  slider.style.marginLeft = "10px";
  slider.style.width = "200px";
  slider.style.accentColor = "#2196F3";

  slider.addEventListener("input", () => {
    if (window.utterance) {
      const currentPosition = getCurrentWordPosition();
      speechSynthesis.cancel();
      window.utterance.rate = parseFloat(slider.value);
      speakText(window.currentText, findTextPosition(currentPosition));
    }
  });

  speedRow.appendChild(sliderLabel);
  speedRow.appendChild(slider);
  controlContainer.appendChild(speedRow);

  // Volume Control Row
  let volumeRow = document.createElement("div");
  volumeRow.style.display = "flex";
  volumeRow.style.alignItems = "center";
  let volumeLabel = document.createElement("label");
  volumeLabel.innerText = "Volume:";
  volumeLabel.style.fontSize = "14px";
  volumeLabel.style.color = "#333";
  volumeLabel.style.minWidth = "50px";

  let volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "1";
  volumeSlider.step = "0.1";
  volumeSlider.value = "1";
  volumeSlider.style.marginLeft = "10px";
  volumeSlider.style.width = "200px";
  volumeSlider.style.accentColor = "#2196F3";

  volumeSlider.addEventListener("input", () => {
    if (window.utterance) {
      const currentPosition = getCurrentWordPosition();
      speechSynthesis.cancel();
      window.utterance.volume = parseFloat(volumeSlider.value);
      speakText(window.currentText, findTextPosition(currentPosition));
    }
  });

  volumeRow.appendChild(volumeLabel);
  volumeRow.appendChild(volumeSlider);
  controlContainer.appendChild(volumeRow);

  // Buttons Row
  let buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.gap = "10px";
  buttonRow.style.justifyContent = "center";
  buttonRow.style.marginTop = "5px";

  // Pause/Resume Button
  let pauseResumeBtn = createButton("Pause");
  pauseResumeBtn.addEventListener("click", () => {
    if (window.isSpeaking) {
      speechSynthesis.pause();
      pauseResumeBtn.innerText = "Resume";
    } else {
      speechSynthesis.resume();
      pauseResumeBtn.innerText = "Pause";
    }
    window.isSpeaking = !window.isSpeaking;
  });

  // Stop Button
  let stopBtn = createButton("Stop");
  stopBtn.addEventListener("click", () => {
    speechSynthesis.cancel();
    window.isSpeaking = false;
    controlContainer.remove();
  });

  buttonRow.appendChild(pauseResumeBtn);
  buttonRow.appendChild(stopBtn);
  controlContainer.appendChild(buttonRow);

  document.body.appendChild(controlContainer);
  return controlContainer;
}

function populateVoices(voices, select) {
  select.innerHTML = "";
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.setAttribute("value", i);
    select.appendChild(option);
  });
  window.selectedVoice = voices[0];
}

function speakText(text, startIndex = 0) {
  if (!text) {
    showNotification("No text selected to read", "error");
    return;
  }

  if (!window.speechSynthesis) {
    showNotification(
      "Text-to-speech is not supported in your browser",
      "error"
    );
    return;
  }

  try {
    speechSynthesis.cancel();

    window.utterance = new SpeechSynthesisUtterance(text.substring(startIndex));

    window.utterance.rate = parseFloat(
      document.querySelector("input[type=range][max='2']").value
    );
    window.utterance.volume = parseFloat(
      document.querySelector("input[type=range][max='1']").value
    );

    if (window.selectedVoice) {
      window.utterance.voice = window.selectedVoice;
    }

    window.utterance.onerror = (event) => {
      handleSpeechError(event);
      window.isSpeaking = false;
      const control = document.querySelector("div[style*='position: fixed']");
      if (control) control.remove();
    };

    window.utterance.onboundary = (event) => {
      window.currentIndex = startIndex + event.charIndex;
      if (event.name === "word") {
        window.lastWordPosition = getCurrentWordPosition();
      }
    };

    window.utterance.onend = () => {
      window.isSpeaking = false;
      window.lastWordPosition = 0;
      const control = document.querySelector("div[style*='position: fixed']");
      if (control) control.remove();
    };

    window.isSpeaking = true;
    speechSynthesis.speak(window.utterance);
  } catch (error) {
    showNotification(
      "Failed to initialize text-to-speech: " + error.message,
      "error"
    );
    console.error("Speech synthesis error:", error);
  }
}

function readSelectedText() {
  try {
    const selection = window.getSelection();
    const text = selection.toString();

    if (!text || text.trim().length === 0) {
      showNotification("Please select some text to read", "error");
      return;
    }

    window.currentText = text;
    window.currentIndex = 0;
    createControlPanel();
    speakText(text);
  } catch (error) {
    showNotification("Error reading selected text: " + error.message, "error");
    console.error("Selection error:", error);
  }
}

readSelectedText();
