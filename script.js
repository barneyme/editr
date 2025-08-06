document.addEventListener("DOMContentLoaded", function () {
  const elements = {
    textbox1: document.getElementById("textbox-1"),
    textbox2: document.getElementById("textbox-2"),
    filenameBox1: document.getElementById("filename-1"),
    filenameBox2: document.getElementById("filename-2"),
    recentFilesDatalist1: document.getElementById("recent-files-datalist-1"),
    recentFilesDatalist2: document.getElementById("recent-files-datalist-2"),
    recentFilesBtn: document.getElementById("recent-files-btn"),
    recentFilesDropdown: document.getElementById("recent-files-dropdown"),
    linePosition: document.getElementById("line-position"),
    charPosition: document.getElementById("char-position"),
    wordCount: document.getElementById("word-count"),
    openLinkBtn: document.getElementById("open-link-btn"),
    overlay: document.getElementById("popup-overlay"),
    openInput1: document.getElementById("open-input-1"),
    openInput2: document.getElementById("open-input-2"),
    findText: document.getElementById("find-text"),
    replaceText: document.getElementById("replace-text"),
    findCount: document.getElementById("find-count"),
    undoButton: document.getElementById("undo"),
    nav: document.querySelector("nav"),
    findBtn: document.getElementById("find-btn"),
    replaceBtn: document.getElementById("replace-btn"),
    replaceAllBtn: document.getElementById("replace-all-btn"),
    openBtn: document.getElementById("open"),
    saveBtn: document.getElementById("save"),
    emailBtn: document.getElementById("email-btn"),
    openNewTabBtn: document.getElementById("openNewTab"),
    findReplaceBtn: document.getElementById("find-replace-button"),
    closeButtons: document.querySelectorAll(".close-btn"),
    installButton: document.getElementById("install-app"),
    highlightLayer1: document.getElementById("highlight-layer-1"),
    highlightLayer2: document.getElementById("highlight-layer-2"),
    activeLine1: document.getElementById("active-line-1"),
    activeLine2: document.getElementById("active-line-2"),
    caseSensitiveCheckbox: document.getElementById("case-sensitive-checkbox"),
    regexCheckbox: document.getElementById("regex-checkbox"),
    splitViewBtn: document.getElementById("split-view-btn"),
    editorContainer: document.getElementById("editor-container"),
    editrBtn: document.getElementById("editr-btn"),
    passwordInput: document.getElementById("password-input"),
    passwordSubmitBtn: document.getElementById("password-submit-btn"),
    defaultWordWrapCheck: document.getElementById("default-word-wrap"),
    defaultAutoIndentCheck: document.getElementById("default-auto-indent"),
    defaultTurboBoostCheck: document.getElementById("default-turbo-boost"),
    enableSpellCheckerCheck: document.getElementById("enable-spell-checker"),
    autoCloseBracketsCheck: document.getElementById("auto-close-brackets"),
    focusModeCheck: document.getElementById("focus-mode-check"),
    showEmailBtnCheck: document.getElementById("show-email-btn-check"),
    showSplitBtnCheck: document.getElementById("show-split-btn-check"),
    enableCsvModeCheck: document.getElementById("enable-csv-mode"),
    defaultThemeSelect: document.getElementById("default-theme"),
    dateFormatSelect: document.getElementById("date-format-select"),
    exportSettingsBtn: document.getElementById("export-settings-btn"),
    importSettingsBtn: document.getElementById("import-settings-btn"),
    importSettingsInput: document.getElementById("import-settings-input"),
    helpNewBtn: document.getElementById("help-new-btn"),
    helpOpenBtn: document.getElementById("help-open-btn"),
    helpSaveBtn: document.getElementById("help-save-btn"),
    helpEmailBtn: document.getElementById("help-email-btn"),
    helpSplitBtn: document.getElementById("help-split-btn"),
    helpFindBtn: document.getElementById("help-find-btn"),
    helpLinkBtn: document.getElementById("help-link-btn"),
    helpSettingsBtn: document.getElementById("help-settings-btn"),
    helpLockBtn: document.getElementById("help-lock-btn"),
    helpUndoBtn: document.getElementById("help-undo-btn"),
    helpPwaBtn: document.getElementById("help-pwa-btn"),
    helpPreviewBtn: document.getElementById("help-preview-btn"),
    helpCsvBtn: document.getElementById("help-csv-btn"),
    helpBlackjackBtn: document.getElementById("help-blackjack-btn"),
    previewBtn: document.getElementById("preview-btn"),
    exportHtmlBtn: document.getElementById("export-html-btn"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    previewPane2: document.getElementById("preview-pane-2"),
    csvModeBtn: document.getElementById("csv-mode-btn"),
    csvGridContainer: document.getElementById("csv-grid-container"),
    editorPane1: document.getElementById("editor-pane-1"),
    // Blackjack game elements
    blackjackOutput: document.getElementById("blackjack-output"),
  };
  const popups = {
    findReplace: document.getElementById("find-replace-popup"),
    settings: document.getElementById("settings-popup"),
    password: document.getElementById("password-popup"),
    blackjack: document.getElementById("blackjack-popup"),
  };

  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
  }

  async function encrypt(data, password) {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(data),
    );
    const bufferToBase64 = (buffer) =>
      btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return {
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(ciphertext),
    };
  }

  async function decrypt(encryptedData, password) {
    const base64ToBuffer = (base64) =>
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    try {
      const salt = base64ToBuffer(encryptedData.salt);
      const iv = base64ToBuffer(encryptedData.iv);
      const ciphertext = base64ToBuffer(encryptedData.ciphertext);
      const key = await deriveKey(password, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext,
      );
      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch (e) {
      console.error("Decryption failed", e);
      return null;
    }
  }

  async function getNoteId(password) {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  let deferredPrompt;
  let activeTextbox = elements.textbox1;
  let currentLinkUrl = null;
  const MAX_RECENT_FILES = 5;
  let protectedNotes = {};
  let activeProtectedNotePassword = null;
  let fileHandles = {
    "textbox-1": null,
    "textbox-2": null,
  };
  let isCsvMode = false;
  let csvData = [];

  // File buffer system
  let fileBuffers = {};
  let currentBufferId = 1;
  const MAX_BUFFERS = 9;

  // Initialize buffers
  function initializeBuffers() {
    for (let i = 1; i <= MAX_BUFFERS; i++) {
      fileBuffers[i] = {
        content: "",
        filename: `editr${i}.txt`,
        cursorPosition: 0,
        fileHandle: null,
        history: [],
        historyIndex: -1,
        historyCursorPositions: [],
      };
    }

    // Set buffer 1 with any existing content
    if (elements.textbox1.value) {
      fileBuffers[1].content = elements.textbox1.value;
      fileBuffers[1].filename = elements.filenameBox1.value || "editr1.txt";
    }
  }

  // Switch to a specific buffer
  function switchToBuffer(bufferId) {
    if (
      bufferId < 1 ||
      bufferId > MAX_BUFFERS ||
      bufferId === currentBufferId
    ) {
      return;
    }

    // Save current buffer state
    saveCurrentBufferState();

    // Switch to new buffer
    currentBufferId = bufferId;
    loadBufferState();

    // Update UI to show current buffer
    updateBufferIndicator();
    updateAllUI();
    elements.textbox1.focus();
  }

  // Save current buffer state
  function saveCurrentBufferState() {
    const buffer = fileBuffers[currentBufferId];
    buffer.content = elements.textbox1.value;
    buffer.filename =
      elements.filenameBox1.value || `editr${currentBufferId}.txt`;
    buffer.cursorPosition = elements.textbox1.selectionStart;
    buffer.fileHandle = fileHandles["textbox-1"];
    buffer.history = [...history];
    buffer.historyIndex = currentHistoryIndex;
    buffer.historyCursorPositions = [...historyCursorPositions];
  }

  // Load buffer state
  function loadBufferState() {
    const buffer = fileBuffers[currentBufferId];

    elements.textbox1.value = buffer.content;
    elements.filenameBox1.value = buffer.filename;
    fileHandles["textbox-1"] = buffer.fileHandle;

    // Restore history
    history = [...buffer.history];
    currentHistoryIndex = buffer.historyIndex;
    historyCursorPositions = [...buffer.historyCursorPositions];

    // If buffer is empty, initialize with empty history
    if (history.length === 0) {
      addToHistory(buffer.content, 0);
    }

    // Restore cursor position
    setTimeout(() => {
      elements.textbox1.setSelectionRange(
        buffer.cursorPosition,
        buffer.cursorPosition,
      );
      updateAllUI();
    }, 0);

    // Store locally
    storeLocally(elements.textbox1);
  }

  // Update buffer indicator in the UI
  function updateBufferIndicator() {
    // Update the filename to show buffer number
    const buffer = fileBuffers[currentBufferId];
    let displayName = buffer.filename;

    // Add buffer indicator to title with bracket format
    document.title = `editr [${currentBufferId}]: ${displayName}`;

    // Update filename placeholder to show buffer
    elements.filenameBox1.placeholder = `editr${currentBufferId}.txt`;

    // Update buffer number in indicator
    const bufferNumber = document.getElementById("buffer-number");
    if (bufferNumber) {
      bufferNumber.textContent = currentBufferId;
    }
  }

  // Create buffer indicator UI element
  function createBufferIndicator() {
    const bufferIndicator = document.createElement("button");
    bufferIndicator.id = "buffer-indicator";
    bufferIndicator.innerHTML = `<span id="buffer-number">${currentBufferId}</span>`;
    bufferIndicator.title = "Buffer";
    bufferIndicator.style.cssText = `
      margin-left: 0.5em;
      cursor: default;
      pointer-events: none;
      padding: 0.5em 0.75em;
      border-radius: 4px;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
    `;

    // Find the filename container and insert the buffer indicator right after it
    const filenameContainer = document.getElementById("filename-container");
    if (filenameContainer && filenameContainer.parentNode) {
      filenameContainer.parentNode.insertBefore(
        bufferIndicator,
        filenameContainer.nextSibling,
      );
    }
    return bufferIndicator;
  }

  // Handle buffer switching keyboard shortcuts
  function handleBufferKeyboard(event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      const key = event.key;
      const num = parseInt(key);

      if (num >= 1 && num <= 9) {
        event.preventDefault();
        switchToBuffer(num);
        return true;
      }
    }
    return false;
  }

  // Enhanced file operations for buffers
  function openFileToBuffer(targetBuffer = null) {
    const bufferId = targetBuffer || currentBufferId;

    if ("showOpenFilePicker" in window) {
      window
        .showOpenFilePicker()
        .then(([handle]) => {
          fileHandles["textbox-1"] = handle; // Store handle immediately
          return handle.getFile();
        })
        .then((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            // Switch to target buffer first
            if (bufferId !== currentBufferId) {
              switchToBuffer(bufferId);
            }

            // Load file content
            const content = e.target.result;
            elements.textbox1.value = content;
            elements.filenameBox1.value = file.name;
            // The handle is already in fileHandles['textbox-1']

            // Update buffer
            const buffer = fileBuffers[currentBufferId];
            buffer.content = content;
            buffer.filename = file.name;
            buffer.fileHandle = fileHandles["textbox-1"];
            buffer.history = [];
            buffer.historyIndex = -1;
            buffer.historyCursorPositions = [];

            addToHistory(content, 0);
            addRecentFile(file.name, content);
            storeLocally(elements.textbox1);
            updateAllUI();
            updateBufferIndicator();

            // Handle contextual UI changes for special file types
            handleSpecialFileTypes(file.name, elements.textbox1);
          };
          reader.readAsText(file);
        })
        .catch((err) => {
          console.log("Open file dialog was cancelled or failed.", err);
        });
    } else {
      // Fallback for browsers without File System Access API
      elements.openInput1.click();
    }
  }

  // Save current buffer
  function saveCurrentBuffer() {
    saveCurrentBufferState();
    saveFile();
  }

  // Create new buffer
  function createNewBuffer() {
    // Find next available buffer or use current + 1
    let targetBuffer = currentBufferId + 1;
    if (targetBuffer > MAX_BUFFERS) {
      targetBuffer = 1;
    }

    // Find first empty buffer
    for (let i = 1; i <= MAX_BUFFERS; i++) {
      if (fileBuffers[i].content === "" && !fileBuffers[i].fileHandle) {
        targetBuffer = i;
        break;
      }
    }

    switchToBuffer(targetBuffer);

    // Clear the buffer
    elements.textbox1.value = "";
    elements.filenameBox1.value = `editr${targetBuffer}.txt`;
    fileHandles["textbox-1"] = null;

    const buffer = fileBuffers[targetBuffer];
    buffer.content = "";
    buffer.filename = `editr${targetBuffer}.txt`;
    buffer.fileHandle = null;
    buffer.history = [];
    buffer.historyIndex = -1;
    buffer.historyCursorPositions = [];

    addToHistory("", 0);
    storeLocally(elements.textbox1);
    updateAllUI();
    elements.textbox1.focus();
  }

  let settings = {};
  const defaultSettings = {
    wordWrap: false,
    theme: "dark",
    autoIndent: false,
    turboBoost: false,
    spellCheck: false,
    autoCloseBrackets: false,
    focusMode: false,
    showEmailButton: false,
    showSplitButton: false,
    enableCsvMode: false,
    dateFormat: "DD-MMM-YYYY",
    expansions: {},
  };

  function saveSettings() {
    localStorage.setItem("editr-settings", JSON.stringify(settings));
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem("editr-settings");
    settings = savedSettings
      ? { ...defaultSettings, ...JSON.parse(savedSettings) }
      : { ...defaultSettings };
  }

  function applySettings(isInitialLoad = false) {
    const isWordWrapEnabled = settings.wordWrap;
    elements.textbox1.classList.toggle("word-wrap-enabled", isWordWrapEnabled);
    elements.textbox2.classList.toggle("word-wrap-enabled", isWordWrapEnabled);

    elements.textbox1.spellcheck = settings.spellCheck;
    elements.textbox2.spellcheck = settings.spellCheck;

    document.body.className = document.body.className
      .replace(/\b(dark|snow)-mode\b/g, "")
      .trim();
    if (settings.theme === "dark") {
      document.body.classList.add("dark-mode");
    } else if (settings.theme === "snow") {
      document.body.classList.add("snow-mode");
    }

    elements.emailBtn.style.display = settings.showEmailButton
      ? "inline-flex"
      : "none";
    elements.splitViewBtn.style.display = settings.showSplitButton
      ? "inline-flex"
      : "none";
    elements.csvModeBtn.style.display = settings.enableCsvMode
      ? "inline-flex"
      : "none";

    elements.defaultWordWrapCheck.checked = settings.wordWrap;
    elements.defaultAutoIndentCheck.checked = settings.autoIndent;
    elements.defaultTurboBoostCheck.checked = settings.turboBoost;
    elements.enableSpellCheckerCheck.checked = settings.spellCheck;
    elements.autoCloseBracketsCheck.checked = settings.autoCloseBrackets;
    elements.focusModeCheck.checked = settings.focusMode;
    elements.showEmailBtnCheck.checked = settings.showEmailButton;
    elements.showSplitBtnCheck.checked = settings.showSplitButton;
    elements.enableCsvModeCheck.checked = settings.enableCsvMode;
    elements.defaultThemeSelect.value = settings.theme;
    elements.dateFormatSelect.value = settings.dateFormat;
    initializeExpansionSettings();
  }

  function saveProtectedNotes() {
    localStorage.setItem(
      "editr-protected-notes",
      JSON.stringify(protectedNotes),
    );
  }

  function loadProtectedNotes() {
    const savedNotes = localStorage.getItem("editr-protected-notes");
    protectedNotes = savedNotes ? JSON.parse(savedNotes) : {};
  }

  async function lockAndSaveProtectedNote() {
    if (isCsvMode) {
      alert(
        "Cannot lock a note while in CSV mode. Please exit CSV mode first.",
      );
      return;
    }
    if (!activeProtectedNotePassword) return;

    const content = elements.textbox1.value;
    const password = activeProtectedNotePassword;
    activeProtectedNotePassword = null;

    if (content.trim() === "") {
      elements.textbox1.value = "";
      elements.textbox1.placeholder =
        "Welcome to editr. Start typing to begin or click the 'b' button for help and settings.";
      updateAllUI();
      storeLocally(elements.textbox1);
      alert(
        "Protected note session ended. No content was saved as the note was empty.",
      );
      return;
    }

    try {
      const encryptedData = await encrypt(content, password);
      const noteId = await getNoteId(password);
      protectedNotes[noteId] = encryptedData;
      saveProtectedNotes();

      elements.textbox1.value = "";
      elements.textbox1.placeholder =
        "Welcome to editr. Start typing to begin or click the 'b' button for help and settings.";
      updateAllUI();
      storeLocally(elements.textbox1);
      alert("Note locked and saved.");
    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Error: Could not lock and save the note.");
      activeProtectedNotePassword = password;
    }
  }

  async function handlePasswordSubmit() {
    const password = elements.passwordInput.value;
    elements.passwordInput.value = "";
    if (!password) {
      togglePopup(null, false);
      return;
    }

    togglePopup(null, false);
    toggleCsvMode(false); // Exit CSV mode when dealing with protected notes

    const noteId = await getNoteId(password);

    if (protectedNotes.hasOwnProperty(noteId)) {
      const encryptedData = protectedNotes[noteId];
      const decryptedContent = await decrypt(encryptedData, password);

      if (decryptedContent !== null) {
        addToHistory(elements.textbox1.value, elements.textbox1.selectionStart);
        elements.textbox1.value = decryptedContent;
        elements.textbox1.placeholder =
          "Note unlocked. Press Ctrl + = to lock and save.";
        activeProtectedNotePassword = password;
        updateAllUI();
        storeLocally(elements.textbox1);
        elements.textbox1.focus();
      } else {
        alert("Incorrect password.");
        elements.textbox1.focus();
      }
    } else {
      addToHistory(elements.textbox1.value, elements.textbox1.selectionStart);
      elements.textbox1.value = "";
      elements.textbox1.placeholder =
        "New protected note. Type content and press Ctrl + = to lock and save.";
      activeProtectedNotePassword = password;
      updateAllUI();
      storeLocally(elements.textbox1);
      elements.textbox1.focus();
    }
  }

  function enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  function exitFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  function onFullScreenChange() {
    const isFullScreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (settings.focusMode !== isFullScreen) {
      settings.focusMode = isFullScreen;
      elements.focusModeCheck.checked = isFullScreen;
      saveSettings();
    }
  }

  function isPWAInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true
    );
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful");
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error);
        });
    });

    if (!isPWAInstalled()) {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isMobileDevice() || /Android/i.test(navigator.userAgent)) {
          elements.installButton.style.display = "inline-flex";
        }
      });

      elements.installButton.addEventListener("click", (e) => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          deferredPrompt = null;
        });
      });

      window.addEventListener("appinstalled", (evt) => {
        elements.installButton.style.display = "none";
      });
    }
  }

  if (!window.name) {
    window.name = `editr-tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  const tabId = window.name;

  let saveTimer;
  let currentMatches = [];
  let currentMatchIndex = -1;
  const MAX_HISTORY = 100;
  let history = [];
  let currentHistoryIndex = -1;
  let isUndoing = false;
  let lastChangeTime = 0;
  const CHANGE_DELAY = 1000;
  let cachedCharWidth = 0;

  let historyCursorPositions = [];

  function adjustTextareaHeight() {
    elements.editorContainer.style.top = `${elements.nav.offsetHeight}px`;
  }

  function storeLocally(textbox) {
    if (!textbox) return;
    const key = `editr_${tabId}_${textbox.id}`;
    localStorage.setItem(key, textbox.value);
  }

  function updateLinkButtonState() {
    if (!activeTextbox) return;
    const text = activeTextbox.value;
    const cursorPos = activeTextbox.selectionStart;

    const lineStartIndex = text.lastIndexOf("\n", cursorPos - 1) + 1;
    let lineEndIndex = text.indexOf("\n", cursorPos);
    if (lineEndIndex === -1) {
      lineEndIndex = text.length;
    }

    const currentLineText = text.substring(lineStartIndex, lineEndIndex);
    const urlRegex = /https?:\/\/[^\s]+/g;
    let match;
    let foundLink = null;

    while ((match = urlRegex.exec(currentLineText)) !== null) {
      const urlStartIndexInLine = match.index;
      const urlEndIndexInLine = urlStartIndexInLine + match[0].length;
      const cursorIndexInLine = cursorPos - lineStartIndex;

      if (
        cursorIndexInLine >= urlStartIndexInLine &&
        cursorIndexInLine <= urlEndIndexInLine
      ) {
        foundLink = match[0];
        break;
      }
    }
    currentLinkUrl = foundLink;
    elements.openLinkBtn.style.display = foundLink ? "inline-flex" : "none";
  }

  function updateAllUI() {
    if (isCsvMode) {
      updateWordCount();
      return;
    }
    updateCursorPosition();
    updateActiveLineHighlight();
    updateWordCount();
    updateLinkButtonState();
    updateUndoRedoButtons();
  }

  function updateCursorPosition() {
    if (!activeTextbox) return;
    const text = activeTextbox.value;
    const cursorPos = activeTextbox.selectionStart;
    const lines = text.substring(0, cursorPos).split("\n");
    elements.linePosition.textContent = lines.length;
    elements.charPosition.textContent = lines[lines.length - 1].length + 1;
  }

  function updateActiveLineHighlight() {
    if (!activeTextbox) return;
    const activeLineEl =
      activeTextbox === elements.textbox1
        ? elements.activeLine1
        : elements.activeLine2;
    if (!activeLineEl) return;

    const text = activeTextbox.value;
    const cursorPos = activeTextbox.selectionStart;
    const lines = text.substring(0, cursorPos).split("\n");
    const lineIndex = lines.length - 1;

    const lineHeight = parseFloat(getComputedStyle(activeTextbox).lineHeight);

    activeLineEl.style.top = `${lineIndex * lineHeight}px`;
    activeLineEl.style.height = `${lineHeight}px`;
    activeLineEl.style.display = "block";
  }

  function updateWordCount() {
    const text1 = elements.textbox1.value.trim();
    const text2 = elements.textbox2.value.trim();

    const words1 = text1
      ? text1.split(/\s+/).filter((word) => word.length > 0)
      : [];
    let totalWords = words1.length;

    if (elements.editorContainer.classList.contains("split-view-active")) {
      const words2 = text2
        ? text2.split(/\s+/).filter((word) => word.length > 0)
        : [];
      totalWords += words2.length;
    }

    elements.wordCount.textContent = totalWords.toString();
  }

  function getRecentFiles() {
    const files = localStorage.getItem("editr-recent-files");
    return files ? JSON.parse(files) : [];
  }

  function removeRecentFile(filenameToRemove) {
    let recentFiles = getRecentFiles();
    recentFiles = recentFiles.filter(
      (file) => file.filename !== filenameToRemove,
    );
    localStorage.setItem("editr-recent-files", JSON.stringify(recentFiles));
    updateRecentFilesUI();
  }

  function updateRecentFilesUI() {
    const files = getRecentFiles();
    const {
      recentFilesDatalist1,
      recentFilesDatalist2,
      recentFilesDropdown,
      recentFilesBtn,
    } = elements;

    recentFilesDatalist1.innerHTML = "";
    recentFilesDatalist2.innerHTML = "";
    recentFilesDropdown.innerHTML = "";

    recentFilesBtn.disabled = files.length === 0;

    const fragment = document.createDocumentFragment();
    files.forEach((file) => {
      const option = document.createElement("option");
      option.value = file.filename;
      fragment.appendChild(option);

      const dropdownItem = document.createElement("div");
      dropdownItem.className = "recent-file-item";
      dropdownItem.dataset.filename = file.filename;
      dropdownItem.innerHTML = `<span class="recent-filename">${file.filename}</span><span class="delete-recent-btn" title="Remove from list" data-filename="${file.filename}"> [X]</span>`;
      recentFilesDropdown.appendChild(dropdownItem);
    });

    recentFilesDatalist1.appendChild(fragment.cloneNode(true));
    recentFilesDatalist2.appendChild(fragment);
  }

  function addRecentFile(filename, content) {
    if (!filename || content === null || content === undefined) return;
    let recentFiles = getRecentFiles();
    recentFiles = recentFiles.filter((file) => file.filename !== filename);
    recentFiles.unshift({ filename, content, timestamp: Date.now() });
    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles.pop();
    }
    localStorage.setItem("editr-recent-files", JSON.stringify(recentFiles));
    updateRecentFilesUI();
  }

  function handleSpecialFileTypes(filename, targetTextbox) {
    const lowerCaseFilename = filename.toLowerCase();

    // Markdown file handling: enable split view to show Preview button
    if (lowerCaseFilename.endsWith(".md")) {
      if (!elements.editorContainer.classList.contains("split-view-active")) {
        toggleSplitView(true);
      }
    }

    // CSV file handling
    if (lowerCaseFilename.endsWith(".csv")) {
      // Contextually show the button regardless of settings
      elements.csvModeBtn.style.display = "inline-flex";
      // If the global setting is enabled, also toggle the grid mode on
      if (settings.enableCsvMode && targetTextbox === elements.textbox1) {
        toggleCsvMode(true);
      }
    } else {
      // For all non-CSV files, turn off CSV mode if it's on
      if (isCsvMode) {
        toggleCsvMode(false);
      }
      // And reset the button visibility based on the global setting
      elements.csvModeBtn.style.display = settings.enableCsvMode
        ? "inline-flex"
        : "none";
    }
  }

  function openDroppedFile(file, targetTextbox, targetFilenameBox) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      targetTextbox.value = content;
      targetFilenameBox.value = file.name;
      addRecentFile(file.name, content);
      storeLocally(targetTextbox);

      if (targetTextbox === elements.textbox1) {
        history = [];
        historyCursorPositions = [];
        currentHistoryIndex = -1;
        addToHistory(content, 0);

        // Update current buffer
        const buffer = fileBuffers[currentBufferId];
        buffer.content = content;
        buffer.filename = file.name;
        buffer.history = [...history];
        buffer.historyIndex = currentHistoryIndex;
        buffer.historyCursorPositions = [...historyCursorPositions];
        updateBufferIndicator();
      }
      activeTextbox = targetTextbox;
      updateAllUI();

      handleSpecialFileTypes(file.name, targetTextbox);
      if (
        file.name.toLowerCase().endsWith(".csv") &&
        targetTextbox !== elements.textbox1
      ) {
        alert(
          "CSV Grid view is only available in the left pane. Open the file there to use the grid editor.",
        );
      }
    };
    reader.onerror = (e) => {
      console.warn("Could not read the file.", file.name, e);
    };
    reader.readAsText(file);
  }

  async function openFile() {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker();
        const file = await handle.getFile();
        const targetTextbox =
          activeTextbox === elements.textbox2 && !isCsvMode
            ? elements.textbox2
            : elements.textbox1;
        const targetFilenameBox =
          targetTextbox === elements.textbox2
            ? elements.filenameBox2
            : elements.filenameBox1;

        fileHandles[targetTextbox.id] = handle;
        openDroppedFile(file, targetTextbox, targetFilenameBox);
      } catch (err) {
        console.log("Open file dialog was cancelled or failed.", err);
      }
    } else {
      const openInput =
        activeTextbox === elements.textbox2 && !isCsvMode
          ? elements.openInput2
          : elements.openInput1;
      openInput.click();
    }
  }

  function handleFileOpen(event, targetTextbox, targetFilenameBox) {
    const file = event.target.files[0];
    if (file) {
      fileHandles[targetTextbox.id] = null;
      openDroppedFile(file, targetTextbox, targetFilenameBox);
    }
  }

  async function saveFile() {
    if (isCsvMode) {
      updateTextboxFromGrid();
    }

    const currentActiveTextbox = isCsvMode ? elements.textbox1 : activeTextbox;
    if (
      currentActiveTextbox === elements.textbox1 &&
      activeProtectedNotePassword
    ) {
      const userConfirmed = confirm(
        "Warning: This is a password-protected note. Saving it to your device will remove the password protection and save the content as plain text. Are you sure you want to continue?",
      );
      if (!userConfirmed) {
        return;
      }
    }

    const handle = fileHandles[currentActiveTextbox.id];
    const content = currentActiveTextbox.value;

    if (handle && "createWritable" in handle) {
      try {
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        addRecentFile(handle.name, content);
        console.log("File saved successfully to existing handle.");
        return;
      } catch (err) {
        console.error(
          'Could not save to existing handle. Fallback to "Save As".',
          err,
        );
        fileHandles[currentActiveTextbox.id] = null;
      }
    }

    if ("showSaveFilePicker" in window) {
      try {
        const filenameBox =
          currentActiveTextbox === elements.textbox1
            ? elements.filenameBox1
            : elements.filenameBox2;
        const saveAsHandle = await window.showSaveFilePicker({
          suggestedName: filenameBox.value || "editr.txt",
          types: [
            {
              description: "Text Files",
              accept: {
                "text/plain": [
                  ".txt",
                  ".text",
                  ".js",
                  ".css",
                  ".html",
                  ".md",
                  ".json",
                  ".csv",
                ],
              },
            },
          ],
        });
        fileHandles[currentActiveTextbox.id] = saveAsHandle;
        filenameBox.value = saveAsHandle.name;

        const writable = await saveAsHandle.createWritable();
        await writable.write(content);
        await writable.close();
        addRecentFile(saveAsHandle.name, content);

        // Update buffer with new file handle and name
        if (currentActiveTextbox === elements.textbox1) {
          const buffer = fileBuffers[currentBufferId];
          buffer.fileHandle = saveAsHandle;
          buffer.filename = saveAsHandle.name;
          updateBufferIndicator();
        }
        return;
      } catch (err) {
        console.log("Save As dialog was cancelled or failed.", err);
        return;
      }
    }

    const filenameBox =
      currentActiveTextbox === elements.textbox2
        ? elements.filenameBox2
        : elements.filenameBox1;
    const filename = filenameBox.value || "editr.txt";
    addRecentFile(filename, content);

    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openNewTab() {
    window.open(window.location.href, "_blank");
  }

  function handleBlackjackKeyPress(event) {
    if (popups.blackjack.style.display !== "block") return;

    const key = event.key.toLowerCase();
    switch (key) {
      case "d":
        blackjack.renderText("> deal");
        blackjack.deal();
        break;
      case "h":
        blackjack.renderText("> hit");
        blackjack.hit();
        break;
      case "s":
        blackjack.renderText("> stand");
        blackjack.stand();
        break;
    }
  }

  function togglePopup(popupId, show) {
    Object.values(popups).forEach((popup) => (popup.style.display = "none"));
    elements.overlay.style.display = "none";
    document.removeEventListener("keydown", handleBlackjackKeyPress);

    if (show && popupId && popups[popupId]) {
      popups[popupId].style.display = "block";
      elements.overlay.style.display = "block";
      if (popupId === "findReplace" && elements.findText) {
        elements.findText.focus();
        elements.findText.select();
        findAllMatches();
      } else if (popupId === "settings") {
        applySettings();
      } else if (popupId === "password") {
        elements.passwordInput.focus();
      } else if (popupId === "blackjack") {
        document.addEventListener("keydown", handleBlackjackKeyPress);
        blackjack.startGame();
      }
    } else {
      currentMatchIndex = -1;
      currentMatches = [];
      if (!isCsvMode) updateHighlights();
    }
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      togglePopup(null, false);
    }
  });

  function addToHistory(state, cursorPosition) {
    if (
      activeTextbox !== elements.textbox1 ||
      history[currentHistoryIndex] === state
    ) {
      return;
    }

    if (currentHistoryIndex < history.length - 1) {
      history.splice(currentHistoryIndex + 1);
      historyCursorPositions.splice(currentHistoryIndex + 1);
    }
    history.push(state);
    historyCursorPositions.push(cursorPosition);
    if (history.length > MAX_HISTORY) {
      history.shift();
      historyCursorPositions.shift();
    }
    currentHistoryIndex = history.length - 1;
    updateUndoRedoButtons();
  }

  function undo() {
    if (activeTextbox !== elements.textbox1 || currentHistoryIndex <= 0) return;
    currentHistoryIndex--;
    restoreState();
  }

  function redo() {
    if (
      activeTextbox !== elements.textbox1 ||
      currentHistoryIndex >= history.length - 1
    )
      return;
    currentHistoryIndex++;
    restoreState();
  }

  function restoreState() {
    isUndoing = true;
    elements.textbox1.value = history[currentHistoryIndex];
    const cursorPos = historyCursorPositions[currentHistoryIndex];

    // Update current buffer content
    fileBuffers[currentBufferId].content = elements.textbox1.value;

    if (isCsvMode) {
      updateGridFromTextbox();
    }

    elements.textbox1.focus();
    elements.textbox1.setSelectionRange(cursorPos, cursorPos);

    activeTextbox = elements.textbox1;
    updateAllUI();
    storeLocally(elements.textbox1);
    updateHighlights();
    isUndoing = false;
  }

  function updateUndoRedoButtons() {
    const isPrimaryActive = activeTextbox === elements.textbox1;
    elements.undoButton.disabled =
      !isPrimaryActive || currentHistoryIndex <= 0 || isCsvMode;
  }

  function escapeRegExp(string) {
    return string.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\      const dropdownItem =",
    );
  }

  function findAllMatches() {
    if (!activeTextbox) return;
    const searchTerm = elements.findText.value;
    const text = activeTextbox.value;
    if (!searchTerm) {
      currentMatches = [];
    } else {
      const isCaseSensitive = elements.caseSensitiveCheckbox.checked;
      const isRegex = elements.regexCheckbox.checked;
      const flags = isCaseSensitive ? "g" : "gi";
      const pattern = isRegex ? searchTerm : escapeRegExp(searchTerm);

      try {
        const regex = new RegExp(pattern, flags);
        currentMatches = [...text.matchAll(regex)].map((match) => ({
          start: match.index,
          end: match.index + match[0].length,
        }));
      } catch (e) {
        currentMatches = [];
        console.error("Invalid Regex:", e);
      }
    }
    currentMatchIndex = -1;
    updateFindCount();
    updateHighlights();
  }

  function getCharWidth(textbox) {
    if (cachedCharWidth > 0) return cachedCharWidth;
    const span = document.createElement("span");
    span.style.font = getComputedStyle(textbox).font;
    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre";
    document.body.appendChild(span);
    span.textContent = "M";
    cachedCharWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return cachedCharWidth;
  }

  function updateHighlights() {
    if (isCsvMode || !activeTextbox) return;
    const highlightLayer =
      activeTextbox === elements.textbox1
        ? elements.highlightLayer1
        : elements.highlightLayer2;
    highlightLayer.innerHTML = "";

    if (
      currentMatches.length === 0 ||
      currentMatchIndex < 0 ||
      currentMatchIndex >= currentMatches.length
    ) {
      return;
    }

    const match = currentMatches[currentMatchIndex];
    const text = activeTextbox.value;
    const frag = document.createDocumentFragment();
    const lineHeight = parseFloat(getComputedStyle(activeTextbox).lineHeight);
    const charWidth = getCharWidth(activeTextbox);

    const textBefore = text.substring(0, match.start);
    const lines = textBefore.split("\n");
    const lineIndex = lines.length - 1;
    const charPos = lines[lineIndex].length;

    const highlight = document.createElement("div");
    highlight.className = "highlight";
    highlight.style.cssText = `top: ${lineIndex * lineHeight}px; left: ${charPos * charWidth}px; width: ${(match.end - match.start) * charWidth}px; height: ${lineHeight}px;`;

    frag.appendChild(highlight);
    highlightLayer.appendChild(frag);
  }

  function updateFindCount() {
    if (elements.findText.value === "") {
      elements.findCount.textContent = "";
    } else {
      elements.findCount.textContent = `${currentMatches.length} match${currentMatches.length === 1 ? "" : "es"}`;
    }
  }

  function findNext() {
    if (!activeTextbox) return;
    if (currentMatches.length === 0 && elements.findText.value) {
      findAllMatches();
    }
    if (currentMatches.length === 0) return;

    const currentPosition = activeTextbox.selectionStart;

    let nextMatchIndex;

    if (
      currentMatchIndex !== -1 &&
      currentMatches[currentMatchIndex] &&
      currentMatches[currentMatchIndex].start === currentPosition
    ) {
      nextMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
    } else {
      nextMatchIndex = currentMatches.findIndex(
        (match) => match.start >= currentPosition,
      );
      if (nextMatchIndex === -1) {
        nextMatchIndex = 0;
      }
    }

    if (nextMatchIndex !== -1) {
      currentMatchIndex = nextMatchIndex;
      const match = currentMatches[currentMatchIndex];
      activeTextbox.setSelectionRange(match.start, match.end);

      const highlightLayer =
        activeTextbox === elements.textbox1
          ? elements.highlightLayer1
          : elements.highlightLayer2;
      if (highlightLayer.children[currentMatchIndex]) {
        const matchTop = highlightLayer.children[currentMatchIndex].offsetTop;
        activeTextbox.scrollTop = matchTop - activeTextbox.clientHeight / 2;
      }
      updateHighlights();
    }
  }

  function replaceCurrentMatch() {
    if (!activeTextbox) return;
    const replacement = elements.replaceText.value;
    const { selectionStart, selectionEnd } = activeTextbox;
    if (selectionStart === selectionEnd) {
      findNext();
      return;
    }
    const currentText = activeTextbox.value;
    addToHistory(currentText, selectionStart);
    activeTextbox.value =
      currentText.slice(0, selectionStart) +
      replacement +
      currentText.slice(selectionEnd);

    const newCursorPos = selectionStart + replacement.length;
    activeTextbox.setSelectionRange(newCursorPos, newCursorPos);

    // Update current buffer content
    if (activeTextbox === elements.textbox1) {
      fileBuffers[currentBufferId].content = activeTextbox.value;
    }

    storeLocally(activeTextbox);
    updateAllUI();
    findAllMatches();
  }

  function replaceAll() {
    if (!activeTextbox) return;
    const replacement = elements.replaceText.value;
    const searchTerm = elements.findText.value;
    if (!searchTerm) return;
    addToHistory(activeTextbox.value, activeTextbox.selectionStart);
    const isCaseSensitive = elements.caseSensitiveCheckbox.checked;
    const isRegex = elements.regexCheckbox.checked;
    const flags = isCaseSensitive ? "g" : "gi";
    const pattern = isRegex ? searchTerm : escapeRegExp(searchTerm);
    try {
      const regex = new RegExp(pattern, flags);
      activeTextbox.value = activeTextbox.value.replace(regex, replacement);

      // Update current buffer content
      if (activeTextbox === elements.textbox1) {
        fileBuffers[currentBufferId].content = activeTextbox.value;
      }

      storeLocally(activeTextbox);
      updateAllUI();
      findAllMatches();
    } catch (e) {
      console.error("Invalid Regex for replace all:", e);
    }
  }

  function cycleTheme() {
    const themes = ["light", "dark", "snow"];
    const currentThemeIndex = themes.indexOf(settings.theme);
    settings.theme = themes[(currentThemeIndex + 1) % themes.length];
    saveSettings();
    applySettings();
  }

  function toggleSplitView(forceOn = false) {
    if (isCsvMode) return;
    const container = elements.editorContainer;
    let isActive;
    if (forceOn) {
      isActive = true;
      container.classList.add("split-view-active");
    } else {
      isActive = container.classList.toggle("split-view-active");
    }

    elements.filenameBox2.style.display = isActive ? "inline-block" : "none";
    elements.previewBtn.style.display = isActive ? "inline-flex" : "none";

    if (!isActive) {
      if (container.classList.contains("preview-active")) {
        togglePreviewMode();
      }
    }
    (isActive ? elements.textbox2 : elements.textbox1).focus();
    updateWordCount();
    return isActive;
  }

  function togglePreviewMode() {
    if (isCsvMode) return;
    const container = elements.editorContainer;
    const isPreviewing = container.classList.toggle("preview-active");

    elements.textbox2.style.display = isPreviewing ? "none" : "block";
    elements.activeLine2.style.display = isPreviewing ? "none" : "block";
    elements.highlightLayer2.style.display = isPreviewing ? "none" : "block";

    const isSplitViewActive = container.classList.contains("split-view-active");
    elements.filenameBox2.style.display =
      isPreviewing || !isSplitViewActive ? "none" : "inline-block";

    elements.previewPane2.style.display = isPreviewing ? "block" : "none";
    elements.exportHtmlBtn.style.display = isPreviewing
      ? "inline-flex"
      : "none";
    elements.exportPdfBtn.style.display = isPreviewing ? "inline-flex" : "none";

    if (isPreviewing) {
      elements.previewBtn.style.display = "none";
      elements.splitViewBtn.style.display = "inline-flex";
      updatePreview();
      elements.textbox1.addEventListener("input", updatePreview);
    } else {
      if (elements.editorContainer.classList.contains("split-view-active")) {
        elements.previewBtn.style.display = "inline-flex";
      }
      applySettings();
      elements.textbox1.removeEventListener("input", updatePreview);
    }
  }

  function updatePreview() {
    const markdownText = elements.textbox1.value;
    elements.previewPane2.innerHTML = marked.parse(markdownText);
  }

  function handleExportHTML() {
    const content = elements.previewPane2.innerHTML;
    const filename =
      (elements.filenameBox1.value || "editr").replace(/\.[^/.]+$/, "") +
      ".html";
    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${filename}</title>
            <style>
                body { font-family: sans-serif; line-height: 1.6; padding: 2em; max-width: 800px; margin: 0 auto; }
                h1, h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                code { background-color: #f7f7f7; padding: 0.2em 0.4em; border-radius: 3px; }
                pre code { display: block; padding: 0.5em; border-radius: 4px; overflow-x: auto; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
      `;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleExportPDF() {
    const { jsPDF } = window.jspdf;
    const content = elements.previewPane2;
    const filename =
      (elements.filenameBox1.value || "editr").replace(/\.[^/.]+$/, "") +
      ".pdf";

    html2canvas(content).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasHeight / canvasWidth;
      const newHeight = pdfWidth * ratio;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, newHeight);
      pdf.save(filename);
    });
  }

  function initializeExpansionSettings() {
    const container = document.getElementById("text-expansion-content");
    if (!container) return;
    container.innerHTML = "";
    if (!settings.expansions) settings.expansions = {};

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(97 + i);
      const shortcutKey = `.${char}`;
      const row = document.createElement("div");
      row.className = "expansion-row";
      row.innerHTML = `
        <label for="expansion-input-${char}">${shortcutKey}</label>
        <input type="text" id="expansion-input-${char}" placeholder="Expanded text for ${shortcutKey}">
      `;
      const input = row.querySelector("input");

      if (char === "d") {
        input.value = "(Date)";
        input.readOnly = true;
        input.title = "This is a built-in shortcut for the current date.";
      } else {
        input.value = settings.expansions[char] || "";
        input.addEventListener("input", () => {
          settings.expansions[char] = input.value;
          saveSettings();
        });
      }
      fragment.appendChild(row);
    }
    container.appendChild(fragment);
  }

  function handleExpansion(event) {
    if (!settings.expansions) return;
    const textbox = event.target;
    const text = textbox.value;
    const cursorPos = textbox.selectionStart;
    const triggerMatch = text.substring(0, cursorPos).match(/\.([a-z])\s$/);

    if (triggerMatch) {
      const key = triggerMatch[1];
      let expansionText;

      if (key === "d") {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, "0");
        const monthNum = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const yearShort = String(year).slice(-2);
        const monthNames = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];
        const monthName = monthNames[date.getMonth()];

        switch (settings.dateFormat) {
          case "MM/DD/YY":
            expansionText = `${monthNum}/${day}/${yearShort}`;
            break;
          case "YYYY-MMM-DD":
            expansionText = `${year}-${monthName}-${day}`;
            break;
          case "YYMMYY":
            expansionText = `${yearShort}${monthNum}${yearShort}`;
            break;
          case "DD-MMM-YYYY":
          default:
            expansionText = `${day}-${monthName}-${year}`;
            break;
        }
      } else {
        expansionText = settings.expansions[key];
      }

      if (expansionText) {
        event.preventDefault();
        const triggerLength = 3;
        const textBefore = text.substring(0, cursorPos - triggerLength);
        const textAfter = text.substring(cursorPos);
        addToHistory(textbox.value, cursorPos);
        textbox.value = textBefore + expansionText + textAfter;
        const newCursorPos = textBefore.length + expansionText.length;
        textbox.setSelectionRange(newCursorPos, newCursorPos);

        // Update current buffer content
        if (textbox === elements.textbox1) {
          fileBuffers[currentBufferId].content = textbox.value;
        }

        updateAllUI();
        storeLocally(textbox);
      }
    }
  }

  function handleExportSettings() {
    const settingsString = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsString], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "editr-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleImportSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        settings = { ...defaultSettings, ...importedSettings };
        saveSettings();
        applySettings();
        alert("Settings imported successfully!");
      } catch (error) {
        alert(
          "Error: Could not parse settings file. Please make sure it's a valid JSON file.",
        );
        console.error("Settings import error:", error);
      }
    };
    reader.onerror = () => {
      alert("Error reading the file.");
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function openRecentFile(filename) {
    const recentFiles = getRecentFiles();
    const selectedFile = recentFiles.find((file) => file.filename === filename);

    if (selectedFile) {
      const targetTextbox =
        isCsvMode || activeTextbox === elements.textbox1
          ? elements.textbox1
          : activeTextbox;
      const targetFilenameBox =
        targetTextbox === elements.textbox1
          ? elements.filenameBox1
          : elements.filenameBox2;

      // If opening to textbox1, handle buffer system
      if (targetTextbox === elements.textbox1) {
        // Save current buffer state before switching
        saveCurrentBufferState();

        // Load the file content
        targetTextbox.value = selectedFile.content;
        targetFilenameBox.value = selectedFile.filename;
        fileHandles[targetTextbox.id] = null;

        // Update current buffer with the loaded file
        const buffer = fileBuffers[currentBufferId];
        buffer.content = selectedFile.content;
        buffer.filename = selectedFile.filename;
        buffer.fileHandle = null;
        buffer.history = [];
        buffer.historyIndex = -1;
        buffer.historyCursorPositions = [];

        // Reset history for the new file
        history = [];
        currentHistoryIndex = -1;
        historyCursorPositions = [];
        addToHistory(selectedFile.content, 0);

        // Update buffer history
        buffer.history = [...history];
        buffer.historyIndex = currentHistoryIndex;
        buffer.historyCursorPositions = [...historyCursorPositions];

        updateBufferIndicator();
      } else {
        // For textbox2, just load normally (no buffer system)
        targetTextbox.value = selectedFile.content;
        targetFilenameBox.value = selectedFile.filename;
        fileHandles[targetTextbox.id] = null;
      }

      storeLocally(targetTextbox);
      updateAllUI();
      if (!isCsvMode) targetTextbox.focus();

      handleSpecialFileTypes(selectedFile.filename, targetTextbox);
    }
  }

  function handleFilenameChange(event) {
    openRecentFile(event.target.value);
  }

  function openHighlightedLink() {
    const textbox = activeTextbox;
    if (!textbox) return;

    const selectedText = textbox.value
      .substring(textbox.selectionStart, textbox.selectionEnd)
      .trim();
    let urlToOpen = selectedText || currentLinkUrl;

    if (!urlToOpen) return;

    let url = urlToOpen;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      new URL(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("The text is not a valid URL:", url, e);
    }
  }

  function shareViaEmail() {
    const currentActiveTextbox = isCsvMode ? elements.textbox1 : activeTextbox;
    if (!currentActiveTextbox) return;
    if (isCsvMode) updateTextboxFromGrid();

    const content = currentActiveTextbox.value;
    if (!content) {
      alert("There is no content to email.");
      return;
    }
    const filenameBox =
      currentActiveTextbox === elements.textbox1
        ? elements.filenameBox1
        : elements.filenameBox2;
    const subject = encodeURIComponent(filenameBox.value || "Note from editr");
    const body = encodeURIComponent(content);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleKeyDown(event) {
    // First check for buffer switching
    if (handleBufferKeyboard(event)) {
      return;
    }

    const targetTextbox = event.target.closest(".textbox");
    if (!targetTextbox && !isCsvMode) return;

    const pairs = {
      "(": ")",
      "[": "]",
      "{": "}",
      "'": "'",
      '"': '"',
      "<": ">",
    };
    const openChars = Object.keys(pairs);
    if (
      targetTextbox &&
      settings.autoCloseBrackets &&
      openChars.includes(event.key)
    ) {
      event.preventDefault();
      const openChar = event.key;
      const closeChar = pairs[openChar];
      const s = targetTextbox.selectionStart;
      const e = targetTextbox.selectionEnd;
      const text = targetTextbox.value;
      addToHistory(text, s);
      if (s !== e) {
        const selectedText = text.substring(s, e);
        targetTextbox.value = `${text.substring(0, s)}${openChar}${selectedText}${closeChar}${text.substring(e)}`;
        targetTextbox.selectionStart = s + 1;
        targetTextbox.selectionEnd = e + 1;
      } else {
        targetTextbox.value = `${text.substring(0, s)}${openChar}${closeChar}${text.substring(e)}`;
        targetTextbox.selectionStart = targetTextbox.selectionEnd = s + 1;
      }

      // Update current buffer content
      if (targetTextbox === elements.textbox1) {
        fileBuffers[currentBufferId].content = targetTextbox.value;
      }

      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        storeLocally(targetTextbox);
      }, 500);
      updateAllUI();
      return;
    }

    if (targetTextbox && event.key === "Enter") {
      if (settings.autoIndent) {
        event.preventDefault();
        const s = targetTextbox.selectionStart;
        const e = targetTextbox.selectionEnd;
        const text = targetTextbox.value;
        const lineStart = text.lastIndexOf("\n", s - 1) + 1;
        const currentLine = text.substring(lineStart, s);
        const indentation = currentLine.match(/^\s*/)[0];

        addToHistory(text, s);

        const newText = `${text.substring(0, s)}\n${indentation}${text.substring(e)}`;
        const newCursorPos = s + 1 + indentation.length;

        targetTextbox.value = newText;
        targetTextbox.selectionStart = targetTextbox.selectionEnd =
          newCursorPos;

        // Update current buffer content
        if (targetTextbox === elements.textbox1) {
          fileBuffers[currentBufferId].content = targetTextbox.value;
        }

        updateAllUI();
      }
      return;
    }

    if (targetTextbox && event.key === "Tab") {
      event.preventDefault();
      const tabSpaces = "    ";
      const s = targetTextbox.selectionStart;
      const e = targetTextbox.selectionEnd;
      addToHistory(targetTextbox.value, s);
      targetTextbox.value = `${targetTextbox.value.substring(0, s)}${tabSpaces}${targetTextbox.value.substring(e)}`;
      targetTextbox.selectionStart = targetTextbox.selectionEnd =
        s + tabSpaces.length;

      // Update current buffer content
      if (targetTextbox === elements.textbox1) {
        fileBuffers[currentBufferId].content = targetTextbox.value;
      }

      updateAllUI();
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if ("osfkzynhmie/='.".includes(key) || key === "g") {
        event.preventDefault();
      }
      switch (key) {
        case "o":
          openFileToBuffer();
          break;
        case "s":
          saveCurrentBuffer();
          break;
        case "e":
          shareViaEmail();
          break;
        case "f":
          if (!isCsvMode) togglePopup("findReplace", true);
          break;
        case "k":
          if (!isCsvMode) openHighlightedLink();
          break;
        case "z":
          if (!isCsvMode) undo();
          break;
        case "y":
          if (!isCsvMode) redo();
          break;
        case "n":
          createNewBuffer();
          break;
        case "m":
          if (
            !elements.editorContainer.classList.contains("split-view-active")
          ) {
            toggleSplitView(true);
          }
          togglePreviewMode();
          break;
        case "i":
          toggleSplitView();
          break;
        case "/":
          togglePopup("settings", true);
          break;
        case "=":
          if (activeProtectedNotePassword) {
            lockAndSaveProtectedNote();
          } else {
            togglePopup("password", true);
          }
          break;
        case ".":
          if (settings.enableCsvMode) {
            toggleCsvMode();
          }
          break;
        case "'":
          if (elements.editorContainer.classList.contains("preview-active")) {
            handleExportPDF();
          }
          break;
        case ";":
          if (elements.editorContainer.classList.contains("preview-active")) {
            handleExportHTML();
          }
          break;
        case "g":
          togglePopup("blackjack", true);
          break;
      }
    }

    if (
      targetTextbox &&
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    ) {
      setTimeout(updateAllUI, 0);
    }
  }

  function handleMouseUp() {
    setTimeout(updateAllUI, 0);
  }

  function handleInput(event) {
    const targetTextbox = event.target;
    handleExpansion(event);
    updateAllUI();

    // Update current buffer content
    if (targetTextbox === elements.textbox1) {
      fileBuffers[currentBufferId].content = targetTextbox.value;
    }

    if (popups.findReplace.style.display === "block") {
      findAllMatches();
    }

    if (!isUndoing) {
      const now = Date.now();
      if (now - lastChangeTime > CHANGE_DELAY || history.length === 0) {
        addToHistory(targetTextbox.value, targetTextbox.selectionStart);
        lastChangeTime = now;
      }
    }

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      storeLocally(targetTextbox);
    }, 500);
  }

  // CSV Mode Functions
  function parseCsv(csvString) {
    const rows = csvString
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n");
    return rows
      .filter((row) => row.trim() !== "")
      .map((row) => {
        const result = [];
        let currentField = "";
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
              currentField += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            result.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }
        result.push(currentField);
        return result;
      });
  }

  function updateTextboxFromGrid() {
    if (!isCsvMode) return;
    const quoteField = (field) => {
      const f = field === null || field === undefined ? "" : String(field);
      if (f.includes(",") || f.includes('"') || f.includes("\n")) {
        return `"${f.replace(/"/g, '""')}"`;
      }
      return f;
    };
    const csvString = csvData
      .map((row) => row.map(quoteField).join(","))
      .join("\n");
    elements.textbox1.value = csvString;
    fileBuffers[currentBufferId].content = csvString;
    storeLocally(elements.textbox1);
    updateWordCount();
  }

  function updateGridFromTextbox() {
    if (!isCsvMode) return;
    csvData = parseCsv(elements.textbox1.value);
    renderCsvGrid();
  }

  function addRow() {
    const numCols = csvData.length > 0 ? csvData[0].length : 1;
    csvData.push(new Array(numCols).fill(""));
    renderCsvGrid();
    updateTextboxFromGrid();
  }

  function addColumn() {
    const newColName = prompt(
      "Enter new column header name:",
      `Column ${csvData.length > 0 ? csvData[0].length + 1 : 1}`,
    );
    if (newColName === null) return;

    if (csvData.length === 0) {
      csvData.push([newColName]);
    } else {
      csvData.forEach((row, index) => {
        row.push(index === 0 ? newColName : "");
      });
    }
    renderCsvGrid();
    updateTextboxFromGrid();
  }

  function deleteRow(rowIndex) {
    if (confirm(`Are you sure you want to delete row ${rowIndex + 1}?`)) {
      csvData.splice(rowIndex, 1);
      renderCsvGrid();
      updateTextboxFromGrid();
    }
  }

  function deleteColumn(colIndex) {
    if (
      confirm(
        `Are you sure you want to delete column "${csvData[0][colIndex]}"?`,
      )
    ) {
      csvData.forEach((row) => {
        row.splice(colIndex, 1);
      });
      renderCsvGrid();
      updateTextboxFromGrid();
    }
  }

  function renderCsvGrid() {
    if (!isCsvMode || !csvData) return;
    const container = elements.csvGridContainer;
    container.innerHTML = `
          <div id="csv-grid-controls">
              <button id="csv-add-row-btn">Add Row</button>
              <button id="csv-add-col-btn">Add Column</button>
          </div>
          <table id="csv-grid">
              <thead></thead>
              <tbody></tbody>
          </table>
      `;

    const table = container.querySelector("#csv-grid");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (csvData.length > 0) {
      const headerRow = document.createElement("tr");
      csvData[0].forEach((headerText, colIndex) => {
        const th = document.createElement("th");
        const input = document.createElement("input");
        input.type = "text";
        input.value = headerText || "";
        input.dataset.row = 0;
        input.dataset.col = colIndex;
        input.oninput = () => {
          csvData[0][colIndex] = input.value;
          updateTextboxFromGrid();
        };
        input.onkeydown = (e) => handleCsvGridKeyDown(e, 0, colIndex);
        th.appendChild(input);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "csv-col-delete-btn";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "Delete Column";
        deleteBtn.onclick = () => deleteColumn(colIndex);
        th.appendChild(deleteBtn);
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
    }

    const dataRows = csvData.slice(1);
    dataRows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const absoluteRowIndex = rowIndex + 1;
      row.forEach((cell, colIndex) => {
        const td = document.createElement("td");
        if (colIndex === 0) {
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "csv-row-delete-btn";
          deleteBtn.innerHTML = "&times;";
          deleteBtn.title = "Delete Row";
          deleteBtn.onclick = () => deleteRow(absoluteRowIndex);
          td.appendChild(deleteBtn);
        }
        const input = document.createElement("input");
        input.type = "text";
        input.value = cell || "";
        input.dataset.row = absoluteRowIndex;
        input.dataset.col = colIndex;
        input.oninput = () => {
          csvData[absoluteRowIndex][colIndex] = input.value;
          updateTextboxFromGrid();
        };
        input.onkeydown = (e) =>
          handleCsvGridKeyDown(e, absoluteRowIndex, colIndex);
        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.getElementById("csv-add-row-btn").onclick = addRow;
    document.getElementById("csv-add-col-btn").onclick = addColumn;
  }

  function toggleCsvMode(forceOn) {
    if (!settings.enableCsvMode && forceOn) return;
    const shouldBeOn = forceOn !== undefined ? forceOn : !isCsvMode;
    if (shouldBeOn === isCsvMode) return;

    isCsvMode = shouldBeOn;
    elements.editorPane1.classList.toggle("csv-view", isCsvMode);

    const buttonsToDisable = [
      elements.findReplaceBtn,
      elements.previewBtn,
      elements.splitViewBtn,
      elements.undoButton,
    ];
    buttonsToDisable.forEach((btn) => (btn.disabled = isCsvMode));

    if (isCsvMode) {
      activeTextbox = null;
      updateGridFromTextbox();
    } else {
      updateTextboxFromGrid();
      activeTextbox = elements.textbox1;
      elements.textbox1.focus();
      updateAllUI();
    }
  }

  function handleCsvGridKeyDown(event, rowIndex, colIndex) {
    if (
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();

    let nextRow = rowIndex;
    let nextCol = colIndex;
    const maxCol = csvData[rowIndex].length - 1;

    switch (event.key) {
      case "ArrowUp":
        nextRow = Math.max(0, rowIndex - 1);
        break;
      case "ArrowDown":
        const maxRow = csvData.length - 1;
        nextRow = Math.min(maxRow, rowIndex + 1);
        break;
      case "ArrowLeft":
        nextCol = Math.max(0, colIndex - 1);
        break;
      case "ArrowRight":
        nextCol = Math.min(maxCol, colIndex + 1);
        break;
    }

    const nextInput = document.querySelector(
      `#csv-grid input[data-row='${nextRow}'][data-col='${nextCol}']`,
    );
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  }

  // --- Blackjack Game Logic ---
  const blackjack = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameOver: true,

    createDeck() {
      this.deck = [];
      const suits = ["♥", "♦", "♣", "♠"];
      const values = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      for (let suit of suits) {
        for (let value of values) {
          this.deck.push({ suit, value });
        }
      }
    },

    shuffle() {
      for (let i = this.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
      }
    },

    getCardValue(card) {
      if (["J", "Q", "K"].includes(card.value)) return 10;
      if (card.value === "A") return 11;
      return parseInt(card.value);
    },

    calculateScore(hand) {
      let score = 0;
      let aceCount = 0;
      for (let card of hand) {
        score += this.getCardValue(card);
        if (card.value === "A") aceCount++;
      }
      while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
      }
      return score;
    },

    renderText(text) {
      const output = elements.blackjackOutput;
      output.innerHTML += text + "\n";
      output.scrollTop = output.scrollHeight;
    },

    renderHands() {
      let handsDisplay = "---------------------------------\n";
      let dealerHandStr = this.gameOver
        ? this.dealerHand.map((c) => `${c.value}${c.suit}`).join(" ")
        : `${this.dealerHand[0].value}${this.dealerHand[0].suit} [?]`;
      let dealerScoreStr = this.gameOver
        ? `(${this.calculateScore(this.dealerHand)})`
        : "";
      handsDisplay += `Dealer's Hand: ${dealerHandStr} ${dealerScoreStr}\n`;

      let playerHandStr = this.playerHand
        .map((c) => `${c.value}${c.suit}`)
        .join(" ");
      handsDisplay += `Your Hand:     ${playerHandStr} (${this.calculateScore(this.playerHand)})\n`;
      handsDisplay += "---------------------------------\n";
      this.renderText(handsDisplay);
    },

    deal() {
      this.createDeck();
      this.shuffle();
      this.playerHand = [this.deck.pop(), this.deck.pop()];
      this.dealerHand = [this.deck.pop(), this.deck.pop()];
      this.gameOver = false;
      elements.blackjackOutput.innerHTML = "";
      this.renderText("New hand dealt!");
      this.renderHands();

      this.playerScore = this.calculateScore(this.playerHand);
      if (this.playerScore === 21) {
        this.renderText("Blackjack! You win!");
        this.gameOver = true;
      }
    },

    hit() {
      if (this.gameOver) {
        this.renderText("Game is over. Press [D] to start a new game.");
        return;
      }
      this.playerHand.push(this.deck.pop());
      this.renderHands();
      this.playerScore = this.calculateScore(this.playerHand);
      if (this.playerScore > 21) {
        this.renderText("Bust! You lose.");
        this.gameOver = true;
      }
    },

    stand() {
      if (this.gameOver) {
        this.renderText("Game is over. Press [D] to start a new game.");
        return;
      }
      this.gameOver = true;
      this.dealerTurn();
    },

    dealerTurn() {
      this.dealerScore = this.calculateScore(this.dealerHand);
      while (this.dealerScore < 17) {
        this.dealerHand.push(this.deck.pop());
        this.dealerScore = this.calculateScore(this.dealerHand);
      }
      this.determineWinner();
    },

    determineWinner() {
      this.renderText("--- Final Results ---");
      this.renderHands();
      const playerScore = this.calculateScore(this.playerHand);
      const dealerScore = this.calculateScore(this.dealerHand);

      if (playerScore > 21) {
        // Already handled in hit()
      } else if (dealerScore > 21) {
        this.renderText("Dealer busts! You win!");
      } else if (playerScore > dealerScore) {
        this.renderText("You win!");
      } else if (dealerScore > playerScore) {
        this.renderText("You lose.");
      } else {
        this.renderText("It's a push (tie).");
      }
      this.renderText("\nPress [D] to play again.");
    },

    startGame() {
      elements.blackjackOutput.innerHTML = "";
      this.renderText("Welcome to Blackjack! Press [D] to begin.");
      this.gameOver = true;
    },
  };

  loadSettings();
  loadProtectedNotes();
  applySettings(true);

  [elements.textbox1, elements.textbox2].forEach((tb) => {
    tb.addEventListener("focus", (e) => {
      if (!isCsvMode) activeTextbox = e.target;
      updateAllUI();
    });
    tb.addEventListener("click", (e) => {
      if (!isCsvMode) activeTextbox = e.target;
      updateAllUI();
    });
    tb.addEventListener("keydown", handleKeyDown);
    tb.addEventListener("keyup", updateActiveLineHighlight);
    tb.addEventListener("mouseup", handleMouseUp);
    tb.addEventListener("input", handleInput);
  });

  [elements.filenameBox1, elements.filenameBox2].forEach((box) => {
    box.addEventListener("change", handleFilenameChange);
  });

  elements.openBtn.addEventListener("click", () => openFileToBuffer());
  elements.saveBtn.addEventListener("click", () => saveCurrentBuffer());
  elements.emailBtn.addEventListener("click", shareViaEmail);
  elements.csvModeBtn.addEventListener("click", () => toggleCsvMode());
  elements.openInput1.addEventListener("change", (e) =>
    handleFileOpen(e, elements.textbox1, elements.filenameBox1),
  );
  elements.openInput2.addEventListener("change", (e) =>
    handleFileOpen(e, elements.textbox2, elements.filenameBox2),
  );
  elements.recentFilesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = elements.recentFilesDropdown;
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });
  elements.recentFilesDropdown.addEventListener("click", (e) => {
    const target = e.target;
    e.stopPropagation();
    if (target.classList.contains("delete-recent-btn")) {
      removeRecentFile(target.dataset.filename);
    } else {
      const item = target.closest(".recent-file-item");
      if (item) {
        openRecentFile(item.dataset.filename);
        elements.recentFilesDropdown.style.display = "none";
      }
    }
  });

  document.addEventListener("fullscreenchange", onFullScreenChange);
  document.addEventListener("webkitfullscreenchange", onFullScreenChange);
  document.addEventListener("mozfullscreenchange", onFullScreenChange);
  document.addEventListener("MSFullscreenChange", onFullScreenChange);

  window.addEventListener("click", (e) => {
    if (!elements.recentFilesBtn.contains(e.target)) {
      elements.recentFilesDropdown.style.display = "none";
    }
  });

  elements.findReplaceBtn.addEventListener("click", () =>
    togglePopup("findReplace", true),
  );
  elements.openLinkBtn.addEventListener("click", openHighlightedLink);
  elements.undoButton.addEventListener("click", undo);
  elements.openNewTabBtn.addEventListener("click", openNewTab);
  elements.splitViewBtn.addEventListener("click", () => toggleSplitView());
  elements.editrBtn.addEventListener("click", () =>
    togglePopup("settings", true),
  );

  elements.previewBtn.addEventListener("click", togglePreviewMode);
  elements.exportHtmlBtn.addEventListener("click", handleExportHTML);
  elements.exportPdfBtn.addEventListener("click", handleExportPDF);

  elements.defaultWordWrapCheck.addEventListener("change", (e) => {
    settings.wordWrap = e.target.checked;
    saveSettings();
    applySettings();
  });
  elements.defaultAutoIndentCheck.addEventListener("change", (e) => {
    settings.autoIndent = e.target.checked;
    saveSettings();
  });
  elements.defaultTurboBoostCheck.addEventListener("change", (e) => {
    settings.turboBoost = e.target.checked;
    saveSettings();
  });
  elements.enableSpellCheckerCheck.addEventListener("change", (e) => {
    settings.spellCheck = e.target.checked;
    saveSettings();
    applySettings();
  });
  elements.autoCloseBracketsCheck.addEventListener("change", (e) => {
    settings.autoCloseBrackets = e.target.checked;
    saveSettings();
  });
  elements.focusModeCheck.addEventListener("change", (e) => {
    settings.focusMode = e.target.checked;
    saveSettings();
    if (settings.focusMode) {
      enterFullScreen();
    } else {
      exitFullScreen();
    }
  });
  elements.showEmailBtnCheck.addEventListener("change", (e) => {
    settings.showEmailButton = e.target.checked;
    saveSettings();
    applySettings();
  });
  elements.showSplitBtnCheck.addEventListener("change", (e) => {
    settings.showSplitButton = e.target.checked;
    saveSettings();
    applySettings();
  });
  elements.enableCsvModeCheck.addEventListener("change", (e) => {
    settings.enableCsvMode = e.target.checked;
    saveSettings();
    applySettings();
    if (!settings.enableCsvMode && isCsvMode) {
      toggleCsvMode(false);
    }
  });
  elements.defaultThemeSelect.addEventListener("change", (e) => {
    settings.theme = e.target.value;
    saveSettings();
    applySettings();
  });
  elements.dateFormatSelect.addEventListener("change", (e) => {
    settings.dateFormat = e.target.value;
    saveSettings();
  });
  elements.exportSettingsBtn.addEventListener("click", handleExportSettings);
  elements.importSettingsBtn.addEventListener("click", () =>
    elements.importSettingsInput.click(),
  );
  elements.importSettingsInput.addEventListener("change", handleImportSettings);

  elements.findText.addEventListener("input", findAllMatches);
  elements.findText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      findNext();
    }
  });
  elements.caseSensitiveCheckbox.addEventListener("change", findAllMatches);
  elements.regexCheckbox.addEventListener("change", findAllMatches);
  elements.findBtn.addEventListener("click", findNext);
  elements.replaceBtn.addEventListener("click", replaceCurrentMatch);
  elements.replaceAllBtn.addEventListener("click", replaceAll);
  elements.passwordSubmitBtn.addEventListener("click", handlePasswordSubmit);
  elements.passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePasswordSubmit();
    }
  });

  elements.closeButtons.forEach((button) => {
    button.addEventListener("click", () => togglePopup(null, false));
  });

  elements.overlay.addEventListener("click", () => togglePopup(null, false));

  elements.helpNewBtn.addEventListener("click", () => {
    createNewBuffer();
  });
  elements.helpOpenBtn.addEventListener("click", () => {
    togglePopup(null, false);
    openFileToBuffer();
  });
  elements.helpSaveBtn.addEventListener("click", () => {
    togglePopup(null, false);
    saveCurrentBuffer();
  });
  elements.helpEmailBtn.addEventListener("click", () => {
    togglePopup(null, false);
    shareViaEmail();
  });
  elements.helpSplitBtn.addEventListener("click", toggleSplitView);
  elements.helpPreviewBtn.addEventListener("click", () => {
    if (!elements.editorContainer.classList.contains("split-view-active")) {
      toggleSplitView(true);
    }
    togglePreviewMode();
  });
  elements.helpCsvBtn.addEventListener("click", () => {
    if (settings.enableCsvMode) {
      togglePopup(null, false);
      toggleCsvMode();
    } else {
      alert("CSV Mode is disabled. You can enable it in the settings panel.");
    }
  });
  elements.helpFindBtn.addEventListener("click", () => {
    togglePopup("findReplace", true);
  });
  elements.helpLinkBtn.addEventListener("click", () => {
    togglePopup(null, false);
    openHighlightedLink();
  });
  elements.helpSettingsBtn.addEventListener("click", () => {
    togglePopup(null, false);
  });
  elements.helpLockBtn.addEventListener("click", () => {
    if (activeProtectedNotePassword) {
      togglePopup(null, false);
      lockAndSaveProtectedNote();
    } else {
      togglePopup("password", true);
    }
  });
  elements.helpUndoBtn.addEventListener("click", undo);
  elements.helpPwaBtn.addEventListener("click", () => {
    if (elements.installButton) elements.installButton.click();
  });
  elements.helpBlackjackBtn.addEventListener("click", () => {
    togglePopup("blackjack", true);
  });

  adjustTextareaHeight();
  window.addEventListener("resize", adjustTextareaHeight);

  const savedContent1 = localStorage.getItem(
    `editr_${tabId}_${elements.textbox1.id}`,
  );
  if (savedContent1) {
    elements.textbox1.value = savedContent1;
    addToHistory(savedContent1, 0);
  } else {
    addToHistory(elements.textbox1.value, 0);
  }
  const savedContent2 = localStorage.getItem(
    `editr_${tabId}_${elements.textbox2.id}`,
  );
  if (savedContent2) {
    elements.textbox2.value = savedContent2;
  }

  updateAllUI();
  updateRecentFilesUI();

  // Initialize buffer system
  initializeBuffers();
  createBufferIndicator();
  updateBufferIndicator();

  // Handle incoming shares, shortcuts, and file openings
  const urlParams = new URLSearchParams(window.location.search);
  const sharedTitle = urlParams.get("title");
  const sharedText = urlParams.get("text");
  const sharedUrl = urlParams.get("url");

  if (sharedTitle || sharedText || sharedUrl) {
    const contentToLoad = `${sharedTitle ? sharedTitle + "\n\n" : ""}${sharedText ? sharedText + "\n\n" : ""}${sharedUrl ? sharedUrl : ""}`;
    elements.textbox1.value = contentToLoad.trim();
    elements.filenameBox1.value = (sharedTitle || "shared-note") + ".txt";

    // Update current buffer
    const buffer = fileBuffers[currentBufferId];
    buffer.content = contentToLoad.trim();
    buffer.filename = (sharedTitle || "shared-note") + ".txt";

    updateAllUI();
    updateBufferIndicator();
    storeLocally(elements.textbox1);
    addToHistory(elements.textbox1.value, 0);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.has("open")) {
    openFileToBuffer();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.has("new")) {
    createNewBuffer();
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const { editorContainer } = elements;
  editorContainer.addEventListener("dragover", (event) => {
    event.preventDefault();
    editorContainer.classList.add("drag-over");
  });
  editorContainer.addEventListener("dragleave", (event) => {
    event.preventDefault();
    editorContainer.classList.remove("drag-over");
  });
  editorContainer.addEventListener("drop", (event) => {
    event.preventDefault();
    editorContainer.classList.remove("drag-over");
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) {
      return;
    }

    const targetTextbox = event.target.closest(".textbox");
    if (targetTextbox === elements.textbox2) {
      fileHandles[elements.textbox2.id] = null;
      openDroppedFile(files[0], elements.textbox2, elements.filenameBox2);
    } else {
      fileHandles[elements.textbox1.id] = null;
      openDroppedFile(files[0], elements.textbox1, elements.filenameBox1);
      if (
        files.length > 1 &&
        elements.editorContainer.classList.contains("split-view-active")
      ) {
        fileHandles[elements.textbox2.id] = null;
        openDroppedFile(files[1], elements.textbox2, elements.filenameBox2);
      }
    }
  });

  if ("launchQueue" in window) {
    launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) {
        return;
      }

      const fileHandle = launchParams.files[0];
      const file = await fileHandle.getFile();

      let targetTextbox, targetFilenameBox;
      if (
        elements.textbox1.value === "" &&
        !fileHandles[elements.textbox1.id]
      ) {
        targetTextbox = elements.textbox1;
        targetFilenameBox = elements.filenameBox1;
      } else if (
        elements.editorContainer.classList.contains("split-view-active") &&
        elements.textbox2.value === "" &&
        !fileHandles[elements.textbox2.id]
      ) {
        targetTextbox = elements.textbox2;
        targetFilenameBox = elements.filenameBox2;
      } else {
        targetTextbox = activeTextbox || elements.textbox1;
        targetFilenameBox =
          targetTextbox === elements.textbox1
            ? elements.filenameBox1
            : elements.filenameBox2;
      }

      fileHandles[targetTextbox.id] = fileHandle;
      openDroppedFile(file, targetTextbox, targetFilenameBox);
    });
  }
});
