(function () {
  // Encapsulated variables
  let utterance = null;
  let isSpeaking = false;
  let currentText = "";
  let currentIndex = 0;
  let selectedVoice = null;
  let lastWordPosition = 0;
  let controlContainer = null;
  let isUserInterruption = false; // Flag for user-initiated interruptions

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
    notification.style.backgroundColor =
      type === "error" ? "#ff5252" : "#4caf50";
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

  // Create voice selection dropdown
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

    const populateVoices = () => {
      const voices = speechSynthesis.getVoices();
      select.innerHTML = "";
      voices.forEach((voice, i) => {
        const option = document.createElement("option");
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute("value", i);
        select.appendChild(option);
      });
      selectedVoice = voices[0];
    };

    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener("voiceschanged", populateVoices, {
        once: true,
      });
    } else {
      populateVoices();
    }

    select.addEventListener("change", (e) => {
      selectedVoice = speechSynthesis.getVoices()[e.target.selectedIndex];
      if (utterance) {
        isUserInterruption = true; // Set the flag
        const currentPosition = getCurrentWordPosition();
        speechSynthesis.cancel();
        speakText(currentText, findTextPosition(currentPosition));
      }
    });

    return select;
  }

  // Create a button with consistent styling
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

  // Get the current word position
  function getCurrentWordPosition() {
    if (!utterance || !currentText) return 0;

    const textUpToCurrent = currentText.substring(0, currentIndex);
    const words = textUpToCurrent.trim().split(/\s+/);
    return words.length - 1;
  }

  // Find the text position based on word index
  function findTextPosition(wordIndex) {
    if (!currentText) return 0;

    const words = currentText.trim().split(/\s+/);
    if (wordIndex >= words.length) return 0;

    let charPosition = 0;
    for (let i = 0; i < wordIndex; i++) {
      charPosition += words[i].length + 1;
    }

    return charPosition;
  }

  // Create the control panel
  function createControlPanel() {
    if (controlContainer) {
      controlContainer.style.display = "flex";
      return controlContainer;
    }

    controlContainer = document.createElement("div");
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
    const voiceRow = document.createElement("div");
    voiceRow.style.display = "flex";
    voiceRow.style.alignItems = "center";
    const voiceLabel = document.createElement("label");
    voiceLabel.innerText = "Voice:";
    voiceLabel.style.fontSize = "14px";
    voiceLabel.style.color = "#333";
    voiceLabel.style.minWidth = "50px";
    voiceRow.appendChild(voiceLabel);
    voiceRow.appendChild(createVoiceSelect());
    controlContainer.appendChild(voiceRow);

    // Speed Control Row
    const speedRow = document.createElement("div");
    speedRow.style.display = "flex";
    speedRow.style.alignItems = "center";
    const speedLabel = document.createElement("label");
    speedLabel.innerText = "Speed:";
    speedLabel.style.fontSize = "14px";
    speedLabel.style.color = "#333";
    speedLabel.style.minWidth = "50px";

    const speedSlider = document.createElement("input");
    speedSlider.type = "range";
    speedSlider.min = "0.5";
    speedSlider.max = "2";
    speedSlider.step = "0.1";
    speedSlider.value = "1";
    speedSlider.style.marginLeft = "10px";
    speedSlider.style.width = "200px";
    speedSlider.style.accentColor = "#2196F3";

    speedSlider.addEventListener("input", () => {
      if (utterance) {
        isUserInterruption = true; // Set the flag
        const currentPosition = getCurrentWordPosition();
        speechSynthesis.cancel();
        utterance.rate = parseFloat(speedSlider.value);
        speakText(currentText, findTextPosition(currentPosition));
      }
    });

    speedRow.appendChild(speedLabel);
    speedRow.appendChild(speedSlider);
    controlContainer.appendChild(speedRow);

    // Volume Control Row
    const volumeRow = document.createElement("div");
    volumeRow.style.display = "flex";
    volumeRow.style.alignItems = "center";
    const volumeLabel = document.createElement("label");
    volumeLabel.innerText = "Volume:";
    volumeLabel.style.fontSize = "14px";
    volumeLabel.style.color = "#333";
    volumeLabel.style.minWidth = "50px";

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "1";
    volumeSlider.step = "0.1";
    volumeSlider.value = "1";
    volumeSlider.style.marginLeft = "10px";
    volumeSlider.style.width = "200px";
    volumeSlider.style.accentColor = "#2196F3";

    volumeSlider.addEventListener("input", () => {
      if (utterance) {
        isUserInterruption = true; // Set the flag
        const currentPosition = getCurrentWordPosition();
        speechSynthesis.cancel();
        utterance.volume = parseFloat(volumeSlider.value);
        speakText(currentText, findTextPosition(currentPosition));
      }
    });

    volumeRow.appendChild(volumeLabel);
    volumeRow.appendChild(volumeSlider);
    controlContainer.appendChild(volumeRow);

    // Buttons Row
    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "10px";
    buttonRow.style.justifyContent = "center";
    buttonRow.style.marginTop = "5px";

    // Pause/Resume Button
    const pauseResumeBtn = createButton("Pause");
    pauseResumeBtn.addEventListener("click", () => {
      if (isSpeaking) {
        speechSynthesis.pause();
        pauseResumeBtn.innerText = "Resume";
      } else {
        speechSynthesis.resume();
        pauseResumeBtn.innerText = "Pause";
      }
      isSpeaking = !isSpeaking;
    });

    // Stop Button
    const stopBtn = createButton("Stop");
    stopBtn.addEventListener("click", () => {
      speechSynthesis.cancel();
      isSpeaking = false;
      controlContainer.style.display = "none";
    });

    buttonRow.appendChild(pauseResumeBtn);
    buttonRow.appendChild(stopBtn);
    controlContainer.appendChild(buttonRow);

    document.body.appendChild(controlContainer);
    return controlContainer;
  }

  // Speak the selected text
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

      utterance = new SpeechSynthesisUtterance(text.substring(startIndex));

      utterance.rate = parseFloat(
        document.querySelector("input[type=range][max='2']").value
      );
      utterance.volume = parseFloat(
        document.querySelector("input[type=range][max='1']").value
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onerror = (event) => {
        if (!isUserInterruption) {
          // Skip if it's a user-initiated interruption
          handleSpeechError(event);
          isSpeaking = false;
          controlContainer.style.display = "none";
        }
        isUserInterruption = false; // Reset the flag
      };

      utterance.onboundary = (event) => {
        currentIndex = startIndex + event.charIndex;
        if (event.name === "word") {
          lastWordPosition = getCurrentWordPosition();
        }
      };

      utterance.onend = () => {
        isSpeaking = false;
        lastWordPosition = 0;
      };

      isSpeaking = true;
      speechSynthesis.speak(utterance);
    } catch (error) {
      showNotification(
        "Failed to initialize text-to-speech: " + error.message,
        "error"
      );
      console.error("Speech synthesis error:", error);
    }
  }

  // Read the selected text
  function readSelectedText() {
    try {
      const selection = window.getSelection();
      const text = selection.toString();

      if (!text || text.trim().length === 0) {
        showNotification("Please select some text to read", "error");
        return;
      }

      currentText = text;
      currentIndex = 0;
      createControlPanel();
      speakText(text);
    } catch (error) {
      showNotification(
        "Error reading selected text: " + error.message,
        "error"
      );
      console.error("Selection error:", error);
    }
  }

  // Listen for messages from the background script or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "readSelectedText") {
      readSelectedText();
    }
  });
})();
