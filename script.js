document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const editor = document.getElementById("editor");
  const fileInput = document.getElementById("fileInput");
  const wordCount = document.getElementById("wordCount");
  const currentBuffer = document.getElementById("currentBuffer");
  const contextMenu = document.getElementById("contextMenu");
  const commandPalette = document.getElementById("commandPalette");
  const commandInput = document.getElementById("commandInput");
  const commandList = document.getElementById("commandList");
  const helpModal = document.getElementById("helpModal");
  const closeHelpBtn = document.getElementById("closeHelpBtn");
  const hamburgerBtn = document.getElementById("hamburgerBtn");

  // Expansions DOM elements
  const expansionsModal = document.getElementById("expansionsModal");
  const closeExpansionsBtn = document.getElementById("closeExpansionsBtn");
  const expansionsList = document.getElementById("expansionsList");
  const saveExpansionsBtn = document.getElementById("saveExpansionsBtn");
  const importExpansionsBtn = document.getElementById("importExpansionsBtn");
  const exportExpansionsBtn = document.getElementById("exportExpansionsBtn");
  const importExpansionsInput = document.getElementById(
    "importExpansionsInput",
  );

  // Find/Replace DOM elements
  const findReplaceDialog = document.getElementById("findReplaceDialog");
  const findInput = document.getElementById("findInput");
  const replaceInput = document.getElementById("replaceInput");
  const findNextBtn = document.getElementById("findNextBtn");
  const findPrevBtn = document.getElementById("findPrevBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  const replaceAllBtn = document.getElementById("replaceAllBtn");
  const closeFindBtn = document.getElementById("closeFindBtn");

  // Crypto constants
  const ENCRYPTION_ALGORITHM = "AES-GCM";
  const KEY_DERIVATION_ALGORITHM = "PBKDF2";
  const HASH_ALGORITHM = "SHA-256";
  const KEY_DERIVATION_ITERATIONS = 100000;
  // Special buffer names
  const CALC_BUFFER_NAME = "[Calculator]";
  const CALENDAR_BUFFER_NAME = "[Calendar]";

  let tabId;
  let buffers = [];
  let activeBufferIndex = 0;
  let commandPaletteOpen = false;
  let currentCommands = [];
  let expansions = {};
  let calendarInterval = null;

  // --- App State & Settings ---
  let lastSearch = { term: "" };
  let lastMatch = null; // To store the last find result's position {start, end}
  const bracketPairs = { "(": ")", "[": "]", "{": "}" };

  function initializeTabAndUrl() {
    const hash = window.location.hash.slice(1); // Remove the #

    if (hash) {
      // Parse the hash to extract just the tabId (everything before the first dash)
      const hashParts = hash.split("-");
      tabId = hashParts[0];
    } else {
      tabId = Math.random().toString(36).substr(2, 6);
      window.location.hash = tabId;
    }
  }

  function getFileNameForUrl(fileName) {
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    // Convert to lowercase and replace non-alphanumeric characters with nothing
    // This ensures we get a clean URL-safe string
    return nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function updateUrlForCurrentBuffer() {
    const buffer = buffers[activeBufferIndex];
    if (!buffer || buffer.isSpecial) return;

    let newHash;
    if (buffer.name === "editr.txt") {
      // For default buffer, just use the tab ID
      newHash = tabId;
    } else {
      // For other files, use tabId + filename (but ensure we don't duplicate)
      const urlName = getFileNameForUrl(buffer.name);
      newHash = `${tabId}-${urlName}`;
    }

    // Only update if the hash is actually different
    const currentHash = window.location.hash.slice(1);
    if (currentHash !== newHash) {
      // Use replaceState to avoid adding to browser history for every buffer switch
      window.history.replaceState(null, null, `#${newHash}`);
    }
  }

  function handleHashChange() {
    const newHash = window.location.hash.slice(1);
    if (!newHash) return;

    // Parse the hash to extract tabId and potential filename
    const hashParts = newHash.split("-");
    const newTabId = hashParts[0];

    // If this is a different tab entirely, we could handle that here
    if (newTabId && newTabId !== tabId) {
      tabId = newTabId;
      // Optionally reload buffers for the new tab
    }
  }

  class FileBuffer {
    constructor(
      name = "editr.txt",
      content = "",
      fileHandle = null,
      isLocked = false,
      encryptedContent = null,
      salt = null,
      iv = null,
    ) {
      this.name = name;
      this.content = content;
      this.originalContent = content;
      this.fileHandle = fileHandle;
      this.id = Math.random().toString(36).substr(2, 9);
      this.isLocked = isLocked;
      this.encryptedContent = encryptedContent;
      this.salt = salt;
      this.iv = iv;
      this.isSpecial = false; // For calculator/calendar buffers
    }
    get isModified() {
      if (this.isLocked || this.isSpecial) return false;
      return this.content !== this.originalContent;
    }
    markSaved() {
      this.originalContent = this.content;
    }
  }

  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: KEY_DERIVATION_ALGORITHM },
      false,
      ["deriveKey"],
    );
    return window.crypto.subtle.deriveKey(
      {
        name: KEY_DERIVATION_ALGORITHM,
        salt: salt,
        iterations: KEY_DERIVATION_ITERATIONS,
        hash: HASH_ALGORITHM,
      },
      keyMaterial,
      { name: ENCRYPTION_ALGORITHM, length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
  }

  async function encryptText(text, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const encodedText = enc.encode(text);
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv: iv },
      key,
      encodedText,
    );
    return {
      encryptedContent: btoa(
        String.fromCharCode.apply(null, new Uint8Array(encryptedContent)),
      ),
      salt: btoa(String.fromCharCode.apply(null, salt)),
      iv: btoa(String.fromCharCode.apply(null, iv)),
    };
  }

  async function decryptText(encryptedContentB64, password, saltB64, ivB64) {
    try {
      const salt = new Uint8Array(
        atob(saltB64)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const iv = new Uint8Array(
        atob(ivB64)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const encryptedContent = new Uint8Array(
        atob(encryptedContentB64)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const key = await deriveKey(password, salt);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ENCRYPTION_ALGORITHM, iv: iv },
        key,
        encryptedContent,
      );
      const dec = new TextDecoder();
      return dec.decode(decryptedContent);
    } catch (e) {
      console.error("Decryption failed:", e);
      return null;
    }
  }

  function saveBuffersToLocalStorage() {
    const buffersToSave = buffers
      .filter((buffer) => !buffer.isSpecial) // Don't save special buffers
      .map((buffer) => ({
        name: buffer.name,
        content: buffer.isLocked ? "" : buffer.content,
        originalContent: buffer.originalContent,
        isLocked: buffer.isLocked,
        encryptedContent: buffer.encryptedContent,
        salt: buffer.salt,
        iv: buffer.iv,
      }));
    localStorage.setItem(
      `editr_buffers_${tabId}`,
      JSON.stringify(buffersToSave),
    );
    localStorage.setItem(
      `editr_active_buffer_index_${tabId}`,
      activeBufferIndex,
    );
  }

  function saveExpansions() {
    localStorage.setItem("editr_expansions", JSON.stringify(expansions));
  }

  function loadExpansions() {
    const savedExpansions = localStorage.getItem("editr_expansions");
    if (savedExpansions) {
      expansions = JSON.parse(savedExpansions);
    } else {
      // Initialize with empty strings for all customizable shortcuts
      expansions = {};
      const shortcuts = "abcdefghijklmnopqrstuvwxyz".split(""); // Now includes q
      shortcuts.forEach((char) => {
        expansions["." + char] = "";
      });
      // Set default value for .d expansion
      expansions[".d"] = "YYYYMMDD";
    }
  }

  function initializeBuffers() {
    const savedBuffersData = localStorage.getItem(`editr_buffers_${tabId}`);
    if (savedBuffersData) {
      const savedBuffers = JSON.parse(savedBuffersData);
      buffers = savedBuffers.map(
        (b) =>
          new FileBuffer(
            b.name,
            b.content,
            null,
            b.isLocked,
            b.encryptedContent,
            b.salt,
            b.iv,
          ),
      );
      activeBufferIndex =
        parseInt(
          localStorage.getItem(`editr_active_buffer_index_${tabId}`),
          10,
        ) || 0;
      if (activeBufferIndex >= buffers.length) activeBufferIndex = 0;
    } else {
      // Migration from older version if needed
      const oldContentKey = `editr_${tabId}_editorContent`;
      const savedContent = localStorage.getItem(oldContentKey) || "";
      buffers = [new FileBuffer("editr.txt", savedContent)];
      activeBufferIndex = 0;
      if (localStorage.getItem(oldContentKey)) {
        saveBuffersToLocalStorage();
        localStorage.removeItem(oldContentKey);
      }
    }
    if (buffers.length === 0) {
      buffers = [new FileBuffer("editr.txt", "")];
      activeBufferIndex = 0;
    }
    updateBufferBar();
    loadActiveBuffer();
  }

  function createNewBuffer(
    name = "editr.txt",
    content = "",
    fileHandle = null,
  ) {
    const buffer = new FileBuffer(name, content, fileHandle);
    buffers.push(buffer);
    activeBufferIndex = buffers.length - 1;
    updateBufferBar();
    loadActiveBuffer();
    updateUrlForCurrentBuffer();
    saveBuffersToLocalStorage();
    return buffer;
  }

  function switchToBuffer(index) {
    if (index < 0 || index >= buffers.length) return;
    // Clear calendar interval when switching away from a calendar buffer
    if (calendarInterval) {
      clearInterval(calendarInterval);
      calendarInterval = null;
    }
    const currentBuf = buffers[activeBufferIndex];
    if (currentBuf && !currentBuf.isLocked && !currentBuf.isSpecial) {
      currentBuf.content = editor.value;
    }
    activeBufferIndex = index;
    loadActiveBuffer();
    updateBufferBar();
    updateUrlForCurrentBuffer();
    saveBuffersToLocalStorage();
  }

  function closeBuffer(index) {
    if (buffers.length === 1) return;
    const buffer = buffers[index];
    if (buffer.isModified && !buffer.isLocked) {
      if (!confirm(`"${buffer.name}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }
    buffers.splice(index, 1);
    if (activeBufferIndex >= index && activeBufferIndex > 0) {
      activeBufferIndex--;
    } else if (activeBufferIndex >= buffers.length) {
      activeBufferIndex = buffers.length - 1;
    }
    updateBufferBar();
    loadActiveBuffer();
    updateUrlForCurrentBuffer();
    saveBuffersToLocalStorage();
  }

  function loadActiveBuffer() {
    if (calendarInterval) clearInterval(calendarInterval); // Clear any existing interval

    const buffer = buffers[activeBufferIndex];
    if (buffer) {
      if (buffer.name === CALENDAR_BUFFER_NAME) {
        // Handle calendar buffer
        editor.value = generateCalendarView(buffer.calendarDate);
        editor.readOnly = true;
        editor.placeholder = "Calendar View. 'n' for next, 'p' for previous.";
        calendarInterval = setInterval(() => {
          if (
            activeBufferIndex >= buffers.length ||
            buffers[activeBufferIndex].name !== CALENDAR_BUFFER_NAME
          ) {
            clearInterval(calendarInterval);
            calendarInterval = null;
            return;
          }
          const { scrollTop, scrollLeft } = editor;
          editor.value = generateCalendarView(
            buffers[activeBufferIndex].calendarDate,
          );
          editor.scrollTop = scrollTop;
          editor.scrollLeft = scrollLeft;
        }, 1000);
      } else if (buffer.isLocked) {
        editor.value = "";
        editor.placeholder =
          "🔒 This note is locked. Press Ctrl/Cmd + = to unlock.";
        editor.readOnly = true;
      } else {
        editor.value = buffer.content;
        editor.placeholder = "Right click or Ctrl\\Cmd + K for menu.";
        editor.readOnly = buffer.name === CALC_BUFFER_NAME;
        if (buffer.name === CALC_BUFFER_NAME) {
          editor.readOnly = false;
        }
      }
      updateWordCount();
      updateBufferBar();
      editor.focus();
    }
  }

  function updateBufferBar() {
    if (currentBuffer) {
      const buffer = buffers[activeBufferIndex];
      if (!buffer) return;
      const modifiedText =
        buffer.isModified && !buffer.isLocked ? " (modified)" : "";
      const lockedText = buffer.isLocked ? " 🔒" : "";
      currentBuffer.textContent = `Buffer: ${
        activeBufferIndex + 1
      }/${buffers.length} - ${buffer.name}${lockedText}${modifiedText}`;
    }
  }

  // --- Load App Settings ---
  function loadSettings() {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) document.body.classList.add("dark-mode");

    const isWordWrapOff = localStorage.getItem("wordWrap") === "false";
    if (isWordWrapOff) {
      editor.classList.add("no-wrap");
    }
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "darkMode",
      document.body.classList.contains("dark-mode"),
    );
  }

  // --- Toggle Word Wrap ---
  function toggleWordWrap() {
    const isNoWrap = editor.classList.toggle("no-wrap");
    localStorage.setItem("wordWrap", !isNoWrap);
    editor.focus();
  }

  function updateWordCount() {
    const text = editor.value;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    wordCount.textContent = `Words: ${words} | Lines: ${lines}`;
  }

  async function saveFile() {
    const buffer = buffers[activeBufferIndex];
    if (!buffer) return;
    if (buffer.isSpecial) {
      showSaveIndicator("Cannot save this type of buffer.", true);
      return;
    }
    if (buffer.isLocked) {
      showSaveIndicator("Cannot save a locked note!");
      return;
    }
    const content = editor.value;
    buffer.content = content;

    // Use File System Access API if available and there's a handle (for overwriting)
    if ("showSaveFilePicker" in window && buffer.fileHandle) {
      try {
        const writable = await buffer.fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        buffer.markSaved();
        updateBufferBar();
        showSaveIndicator("Saved!");
        return;
      } catch (err) {
        console.log("Direct save failed, falling back:", err);
      }
    }

    // Use File System Access API for "Save As"
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: buffer.name,
          types: [
            {
              description: "Text files",
              accept: {
                "text/plain": [".txt", ".md", ".js", ".html", ".css"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        buffer.fileHandle = handle;
        buffer.name = handle.name;
        buffer.markSaved();
        updateBufferBar();
        updateUrlForCurrentBuffer();
        showSaveIndicator("Saved!");
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("Save picker failed:", err);
        }
        return; // Don't fall through to download link if user cancels
      }
    }

    // Fallback for older browsers
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buffer.name;
    a.click();
    URL.revokeObjectURL(url);
    buffer.markSaved();
    updateBufferBar();
    showSaveIndicator("Downloaded!");
  }

  function showSaveIndicator(message, isError = false) {
    let indicator = document.getElementById("saveIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "saveIndicator";
      indicator.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; z-index: 5000; opacity: 0; transition: opacity 0.3s; pointer-events: none;`;
      document.body.appendChild(indicator);
    }
    indicator.textContent = message;
    indicator.style.background = isError
      ? "rgba(180, 0, 0, 0.9)"
      : "rgba(0, 0, 0, 0.8)";
    indicator.style.opacity = "1";
    setTimeout(() => {
      indicator.style.opacity = "0";
    }, 2000);
  }

  async function openFile() {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
        });
        const file = await handle.getFile();
        const content = await file.text();
        createNewBuffer(file.name, content, handle);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("File picker failed:", err);
        }
      }
    } else {
      fileInput.click();
    }
  }

  async function toggleLock() {
    const buffer = buffers[activeBufferIndex];
    if (!buffer || buffer.isSpecial) return;
    if (buffer.isLocked) {
      const password = prompt("Enter password to unlock:");
      if (!password) return;
      const decryptedContent = await decryptText(
        buffer.encryptedContent,
        password,
        buffer.salt,
        buffer.iv,
      );
      if (decryptedContent !== null) {
        buffer.content = decryptedContent;
        buffer.isLocked = false;
        buffer.encryptedContent = null;
        buffer.salt = null;
        buffer.iv = null;
        showSaveIndicator("Note unlocked!");
      } else {
        alert("Decryption failed. Incorrect password.");
        return;
      }
    } else {
      const password = prompt("Enter password to lock note:");
      if (!password) {
        alert("Password cannot be empty.");
        return;
      }
      const passwordConfirm = prompt("Confirm password:");
      if (password !== passwordConfirm) {
        alert("Passwords do not match.");
        return;
      }
      const { encryptedContent, salt, iv } = await encryptText(
        editor.value,
        password,
      );
      buffer.encryptedContent = encryptedContent;
      buffer.salt = salt;
      buffer.iv = iv;
      buffer.isLocked = true;
      buffer.content = "";
      showSaveIndicator("Note locked!");
    }
    saveBuffersToLocalStorage();
    loadActiveBuffer();
  }

  async function exportProject() {
    const projectData = {
      version: "1.0",
      tabId: tabId,
      activeBufferIndex: activeBufferIndex,
      buffers: buffers
        .filter((b) => !b.isSpecial)
        .map((buffer) => ({
          name: buffer.name,
          content: buffer.isLocked ? "" : buffer.content,
          originalContent: buffer.originalContent,
          isLocked: buffer.isLocked,
          encryptedContent: buffer.encryptedContent,
          salt: buffer.salt,
          iv: buffer.iv,
        })),
      expansions: expansions,
      exportDate: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });

    // Use File System Access API if available
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `editr-project-${tabId}.json`,
          types: [
            {
              description: "Editr Project files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        showSaveIndicator("Project exported!");
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("Save picker failed:", err);
        }
        return;
      }
    }

    // Fallback for older browsers
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `editr-project-${tabId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSaveIndicator("Project downloaded!");
  }

  async function importProject() {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Editr Project files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
        const file = await handle.getFile();
        const content = await file.text();
        await processProjectImport(content);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("File picker failed:", err);
        }
      }
    } else {
      // Create a temporary file input for older browsers
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.addEventListener("change", async (e) => {
        if (e.target.files[0]) {
          const file = e.target.files[0];
          const content = await file.text();
          await processProjectImport(content);
        }
      });
      input.click();
    }
  }

  function newTab() {
    const newId = Math.random().toString(36).substr(2, 6);
    const newUrl = `${window.location.origin}${window.location.pathname}#${newId}`;
    window.open(newUrl, "_blank");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function showContextMenu(x, y) {
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    x = Math.max(10, x);
    y = Math.max(10, y);

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";

    // Position submenus
    const submenus = document.querySelectorAll(".submenu");
    submenus.forEach((submenu) => {
      submenu.classList.remove("open-left");
      const parentRect = submenu.parentElement.getBoundingClientRect();
      if (parentRect.right + submenu.offsetWidth > window.innerWidth) {
        submenu.classList.add("open-left");
      }
    });
  }

  function hideContextMenu() {
    contextMenu.style.display = "none";
    contextMenu.classList.remove("mobile-menu");
    // Also remove open classes from any submenus
    contextMenu.querySelectorAll(".context-menu-item.open").forEach((item) => {
      item.classList.remove("open");
    });
  }

  // --- Command Palette Logic ---
  function openCommandPalette() {
    populateCommands();
    renderCommands(currentCommands);
    commandPalette.classList.remove("hidden");
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="modalBackdrop" class="modal-backdrop"></div>',
    );
    commandInput.value = "";
    commandInput.focus();
    commandPaletteOpen = true;

    document
      .getElementById("modalBackdrop")
      .addEventListener("click", closeCommandPalette);
  }

  function closeCommandPalette() {
    commandPalette.classList.add("hidden");
    const backdrop = document.getElementById("modalBackdrop");
    if (backdrop) backdrop.remove();
    commandPaletteOpen = false;
    editor.focus();
  }

  function showHelp() {
    helpModal.classList.remove("hidden");
    if (!document.getElementById("modalBackdrop")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div id="modalBackdrop" class="modal-backdrop"></div>',
      );
      document
        .getElementById("modalBackdrop")
        .addEventListener("click", closeHelpModal);
    }
  }

  function closeHelpModal() {
    helpModal.classList.add("hidden");
    const backdrop = document.getElementById("modalBackdrop");
    if (backdrop) backdrop.remove();
    editor.focus();
  }

  // --- Expansions Modal Logic ---
  function openExpansionsModal() {
    expansionsList.innerHTML = ""; // Clear previous list

    const sortedKeys = Object.keys(expansions).sort();

    sortedKeys.forEach((key) => {
      const item = document.createElement("div");
      item.className = "expansion-item";

      const label = document.createElement("label");
      label.textContent = key;
      label.htmlFor = `exp-input-${key}`;

      const input = document.createElement("input");
      input.type = "text";
      input.id = `exp-input-${key}`;
      input.dataset.key = key;
      input.value = expansions[key];

      item.appendChild(label);
      item.appendChild(input);
      expansionsList.appendChild(item);
    });

    expansionsModal.classList.remove("hidden");
    if (!document.getElementById("modalBackdrop")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div id="modalBackdrop" class="modal-backdrop"></div>',
      );
      document
        .getElementById("modalBackdrop")
        .addEventListener("click", closeExpansionsModal);
    }
  }

  function closeExpansionsModal() {
    expansionsModal.classList.add("hidden");
    const backdrop = document.getElementById("modalBackdrop");
    if (backdrop) backdrop.remove();
    editor.focus();
  }

  // --- FINALIZED Find/Replace Logic ---
  function openFindDialog() {
    findReplaceDialog.classList.remove("hidden");
    const selectedText = editor.value.substring(
      editor.selectionStart,
      editor.selectionEnd,
    );
    findInput.value = selectedText || lastSearch.term || "";
    // Use timeout to ensure the element is visible and focusable
    setTimeout(() => {
      findInput.focus();
      findInput.select();
    }, 0);
  }

  function closeFindDialog() {
    findReplaceDialog.classList.add("hidden");
    editor.focus();
  }

  function find(isForward) {
    const searchTerm = findInput.value;
    if (!searchTerm) {
      return;
    }

    if (lastSearch.term !== searchTerm) {
      lastMatch = null;
    }
    lastSearch.term = searchTerm;

    const text = editor.value;
    const lowerCaseText = text.toLowerCase();
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    let foundIndex = -1;
    let wrapped = false;

    if (isForward) {
      const startPos = lastMatch ? lastMatch.end : editor.selectionEnd;
      foundIndex = lowerCaseText.indexOf(lowerCaseSearchTerm, startPos);
      if (foundIndex === -1) {
        wrapped = true;
        foundIndex = lowerCaseText.indexOf(lowerCaseSearchTerm, 0);
      }
    } else {
      // Backward search
      const startPos = lastMatch ? lastMatch.start : editor.selectionStart;
      foundIndex = lowerCaseText.lastIndexOf(lowerCaseSearchTerm, startPos - 1);
      if (foundIndex === -1) {
        wrapped = true;
        foundIndex = lowerCaseText.lastIndexOf(lowerCaseSearchTerm);
      }
    }

    if (foundIndex !== -1) {
      if (lastMatch && lastMatch.start === foundIndex && wrapped) {
        showSaveIndicator("Term not found", true);
        lastMatch = null;
      } else {
        const matchEnd = foundIndex + searchTerm.length;
        editor.setSelectionRange(foundIndex, matchEnd);
        lastMatch = { start: foundIndex, end: matchEnd };

        // Scroll the view to the found text
        const textToSelection = text.substring(0, foundIndex);
        const lineNumber = (textToSelection.match(/\n/g) || []).length;
        const computedStyle = window.getComputedStyle(editor);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const scrollTop = lineNumber * lineHeight - editor.clientHeight / 3;
        editor.scrollTop = Math.max(0, scrollTop);

        if (wrapped) {
          showSaveIndicator("Find: Wrapped around document");
        }
      }
    } else {
      showSaveIndicator("Term not found", true);
      lastMatch = null;
      findInput.focus();
      findInput.select();
      return;
    }
    editor.focus();
  }

  function replace() {
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;
    if (!searchTerm) return;

    const selection = editor.value.substring(
      editor.selectionStart,
      editor.selectionEnd,
    );
    if (selection.toLowerCase() === searchTerm.toLowerCase()) {
      editor.setRangeText(
        replaceTerm,
        editor.selectionStart,
        editor.selectionEnd,
        "end",
      );
      lastMatch = null;
    }
    find(true);
  }

  function replaceAll() {
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;
    if (!searchTerm) return;

    const regex = new RegExp(
      searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
      "gi",
    );
    const originalValue = editor.value;
    let changes = 0;
    const newValue = originalValue.replace(regex, (match) => {
      changes++;
      return replaceTerm;
    });

    if (changes > 0) {
      editor.value = newValue;
      lastMatch = null;
      editor.dispatchEvent(new Event("input"));
      showSaveIndicator(`Replaced ${changes} occurrence(s)`);
    } else {
      showSaveIndicator("Term not found", true);
    }
  }

  // --- New Feature Functions ---
  function emailBuffer() {
    const buffer = buffers[activeBufferIndex];
    if (!buffer) return;
    if (buffer.isLocked) {
      showSaveIndicator("Cannot email a locked note!", true);
      return;
    }
    if (buffer.isSpecial) {
      showSaveIndicator("Cannot email this type of buffer.", true);
      return;
    }
    const subject = `Note: ${buffer.name}`;
    const body = buffer.content;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  function openCalculator() {
    const existingIndex = buffers.findIndex((b) => b.name === CALC_BUFFER_NAME);
    if (existingIndex !== -1) {
      switchToBuffer(existingIndex);
      return;
    }
    const content = `Welcome to the Editr Calculator!\nType a math expression (e.g., 5 * (10 + 2)) and press Enter.\n\n`;
    const buffer = new FileBuffer(CALC_BUFFER_NAME, content);
    buffer.isSpecial = true;
    buffers.push(buffer);
    switchToBuffer(buffers.length - 1);
  }

  function openCalendar() {
    const existingIndex = buffers.findIndex(
      (b) => b.name === CALENDAR_BUFFER_NAME,
    );
    if (existingIndex !== -1) {
      switchToBuffer(existingIndex);
      return;
    }
    const buffer = new FileBuffer(CALENDAR_BUFFER_NAME, "");
    buffer.isSpecial = true;
    buffer.calendarDate = new Date();
    buffers.push(buffer);
    switchToBuffer(buffers.length - 1);
  }

  function generateCalendarView(date) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const month = date.getMonth();
    const year = date.getFullYear();
    const monthName = date.toLocaleString("default", { month: "long" });

    let calendar = `..................................\n`;
    calendar += `${dateString}\n`;
    calendar += `${timeString}\n`;
    calendar += `..................................\n\n`;
    calendar += `     ${monthName} ${year}\n`;
    calendar += `Su Mo Tu We Th Fr Sa\n`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let line = " ".repeat(firstDayOfMonth * 3);

    for (let day = 1; day <= daysInMonth; day++) {
      line += day.toString().padStart(2, " ") + " ";
      if ((day + firstDayOfMonth) % 7 === 0 || day === daysInMonth) {
        calendar += line.trimEnd() + "\n";
        line = "";
      }
    }
    calendar += `\n..................................\n`;
    calendar += `Controls: 'n' for next month, 'p' for previous month.\n`;
    return calendar;
  }
  // --- End New Feature Functions ---

  const staticCommands = [
    {
      name: "Find / Replace",
      action: openFindDialog,
      shortcut: "Ctrl+F",
    },
    {
      name: "Text Expansions",
      action: openExpansionsModal,
      shortcut: "Ctrl+E",
    },
    { name: "Open Calculator", action: openCalculator },
    { name: "Open Calendar", action: openCalendar },
    { name: "Email Current Buffer", action: emailBuffer },
    { name: "Save File", action: saveFile, shortcut: "Ctrl+S" },
    {
      name: "Open File",
      action: openFile,
      shortcut: "Ctrl+O",
    },
    { name: "New Tab", action: newTab, shortcut: "Ctrl+N" },
    {
      name: "Export Project",
      action: exportProject,
      shortcut: "Ctrl+Shift+E",
    },
    {
      name: "Import Project",
      action: importProject,
      shortcut: "Ctrl+Shift+I",
    },
    {
      name: "Toggle Dark/Light Mode",
      action: toggleDarkMode,
      shortcut: "Ctrl+D",
    },
    {
      name: "Toggle Word Wrap",
      action: toggleWordWrap,
    },
    {
      name: "Lock/Unlock Note",
      action: toggleLock,
      shortcut: "Ctrl+=",
    },
    {
      name: "Close Current Buffer",
      action: () => closeBuffer(activeBufferIndex),
      shortcut: "Ctrl+W",
    },
    {
      name: "Toggle Fullscreen",
      action: toggleFullscreen,
      shortcut: "F11",
    },
  ];

  function populateCommands() {
    const bufferCommands = buffers.map((buf, index) => ({
      name: `Switch to: ${buf.name}`,
      action: () => switchToBuffer(index),
      shortcut: `Buffer ${index + 1}`,
    }));

    const helpCommand = {
      name: "Show Help",
      action: showHelp,
      shortcut: "?",
    };

    currentCommands = [...bufferCommands, ...staticCommands, helpCommand];
  }

  function renderCommands(commandsToRender) {
    commandList.innerHTML = "";
    commandsToRender.forEach((cmd, index) => {
      const item = document.createElement("div");
      item.className = "command-item";
      item.dataset.index = index;

      const nameSpan = document.createElement("span");
      nameSpan.textContent = cmd.name;

      const shortcutSpan = document.createElement("span");
      shortcutSpan.className = "shortcut";
      shortcutSpan.textContent = cmd.shortcut || "";

      item.appendChild(nameSpan);
      item.appendChild(shortcutSpan);

      item.addEventListener("click", () => {
        cmd.action();
        closeCommandPalette();
      });
      commandList.appendChild(item);
    });
    if (commandList.firstChild) {
      commandList.firstChild.classList.add("selected");
    }
  }

  commandInput.addEventListener("input", () => {
    const searchTerm = commandInput.value.toLowerCase();
    const filteredCommands = currentCommands.filter((cmd) =>
      cmd.name.toLowerCase().includes(searchTerm),
    );
    renderCommands(filteredCommands);
  });

  // --- Editor Feature Handlers ---
  function handleTextExpansion(e) {
    if (e.key !== " " && e.key !== "Enter" && e.key !== "Tab") {
      return;
    }

    const cursorPos = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, cursorPos);

    const lastSpaceIndex = textBeforeCursor.lastIndexOf(" ");
    const lastNewlineIndex = textBeforeCursor.lastIndexOf("\n");
    const lastWordStartIndex = Math.max(lastSpaceIndex, lastNewlineIndex) + 1;
    const potentialShortcut = textBeforeCursor.substring(lastWordStartIndex);

    if (potentialShortcut.length < 2 || !potentialShortcut.startsWith(".")) {
      return;
    }

    let expansionText = "";
    if (potentialShortcut === ".d") {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      expansionText = `${year}${month}${day}`;
    } else if (
      expansions.hasOwnProperty(potentialShortcut) &&
      expansions[potentialShortcut]
    ) {
      expansionText = expansions[potentialShortcut];
    }

    if (expansionText) {
      e.preventDefault();
      editor.setRangeText(expansionText, lastWordStartIndex, cursorPos, "end");
      if (e.key === " ") {
        editor.setRangeText(
          " ",
          editor.selectionStart,
          editor.selectionEnd,
          "end",
        );
      } else if (e.key === "Enter") {
        editor.setRangeText(
          "\n",
          editor.selectionStart,
          editor.selectionEnd,
          "end",
        );
      }
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function handleAutoClosingBrackets(e) {
    const key = e.key;
    const editor = e.target;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    let openChar = null;
    let closeChar = null;

    if (key === "(") {
      openChar = "(";
      closeChar = ")";
    } else if (key === "[") {
      openChar = "[";
      closeChar = "]";
    } else if (key === "{") {
      openChar = "{";
      closeChar = "}";
    } else if (key === "<") {
      openChar = "<";
      closeChar = ">";
    }

    if (openChar) {
      e.preventDefault();

      if (start !== end) {
        const selectedText = editor.value.substring(start, end);
        const textToInsert = openChar + selectedText + closeChar;
        editor.setRangeText(textToInsert, start, end, "select");
      } else {
        const textToInsert = openChar + closeChar;
        editor.setRangeText(textToInsert, start, end, "end");
        editor.selectionStart = editor.selectionEnd = start + 1;
      }
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function handleAutoIndent(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const cursorPos = editor.selectionStart;
      const textBefore = editor.value.substring(0, cursorPos);
      const lineBefore = textBefore.substring(textBefore.lastIndexOf("\n") + 1);
      const indent = lineBefore.match(/^\s*/)[0];

      editor.setRangeText("\n" + indent, cursorPos, cursorPos, "end");
    }
  }

  function handleBracketMatching(e) {
    if (Object.values(bracketPairs).includes(e.key)) {
      const cursorPos = editor.selectionStart;
      const text = editor.value;
      let stack = [e.key];
      let openerIndex = -1;

      for (let i = cursorPos - 2; i >= 0; i--) {
        if (Object.values(bracketPairs).includes(text[i])) {
          stack.push(text[i]);
        } else if (Object.keys(bracketPairs).includes(text[i])) {
          if (bracketPairs[text[i]] === stack[stack.length - 1]) {
            stack.pop();
            if (stack.length === 0) {
              openerIndex = i;
              break;
            }
          }
        }
      }

      if (openerIndex !== -1) {
        const tempSelectionStart = editor.selectionStart;
        const tempSelectionEnd = editor.selectionEnd;
        editor.setSelectionRange(openerIndex, openerIndex + 1);
        setTimeout(() => {
          editor.setSelectionRange(tempSelectionStart, tempSelectionEnd);
        }, 200);
      }
    }
  }

  function handleCalculatorEvaluation() {
    const cursorPos = editor.selectionStart;
    const textUpToCursor = editor.value.substring(0, cursorPos);
    const lastNewline = textUpToCursor.lastIndexOf("\n");
    const currentLine = editor.value
      .substring(lastNewline + 1, cursorPos)
      .trim();

    if (currentLine) {
      try {
        const sanitizedExpression = currentLine.replace(/[^-()\d/*+.\s^]/g, "");
        const result = new Function(
          "return " + sanitizedExpression.replace(/\^/g, "**"),
        )();
        editor.setRangeText(` = ${result}\n`, cursorPos, cursorPos, "end");
      } catch (error) {
        editor.setRangeText(` = Error\n`, cursorPos, cursorPos, "end");
      }
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function loadFileContent(file) {
    const reader = new FileReader();
    reader.onload = (e) => createNewBuffer(file.name, e.target.result, null);
    reader.readAsText(file);
  }

  // Event Listeners
  editor.addEventListener("input", function () {
    lastMatch = null;
    const buffer = buffers[activeBufferIndex];
    if (buffer && !buffer.isLocked && !buffer.isSpecial) {
      buffer.content = editor.value;
      updateBufferBar();
      saveBuffersToLocalStorage();
    }
    updateWordCount();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) loadFileContent(e.target.files[0]);
  });

  findNextBtn.addEventListener("click", () => find(true));
  findPrevBtn.addEventListener("click", () => find(false));
  replaceBtn.addEventListener("click", replace);
  replaceAllBtn.addEventListener("click", replaceAll);
  closeFindBtn.addEventListener("click", closeFindDialog);

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      find(!e.shiftKey);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeFindDialog();
    }
  });

  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeFindDialog();
    }
  });

  saveExpansionsBtn.addEventListener("click", () => {
    const inputs = expansionsList.querySelectorAll("input[data-key]");
    inputs.forEach((input) => {
      const key = input.dataset.key;
      if (expansions.hasOwnProperty(key)) {
        expansions[key] = input.value;
      }
    });
    saveExpansions();
    showSaveIndicator("Expansions saved!");
    closeExpansionsModal();
  });

  exportExpansionsBtn.addEventListener("click", () => {
    const content = Object.entries(expansions)
      .filter(([key, value]) => value) // Only export non-empty expansions
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "editr-expansions.txt";
    a.click();
    URL.revokeObjectURL(url);
    showSaveIndicator("Expansions exported!");
  });

  importExpansionsBtn.addEventListener("click", () => {
    importExpansionsInput.click();
  });

  importExpansionsInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split("\n");
      let importCount = 0;
      lines.forEach((line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join("=").trim();
          if (expansions.hasOwnProperty(key)) {
            expansions[key] = value;
            importCount++;
          }
        }
      });
      saveExpansions();
      openExpansionsModal(); // Re-open/refresh the modal with new values
      showSaveIndicator(`Imported ${importCount} expansions!`);
    };
    reader.onerror = () => {
      showSaveIndicator("Error reading file.", true);
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file input
  });

  closeExpansionsBtn.addEventListener("click", closeExpansionsModal);

  editor.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    editor.classList.add("drag-over");
  });

  editor.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editor.contains(e.relatedTarget)) {
      editor.classList.remove("drag-over");
    }
  });

  editor.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    editor.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) {
      loadFileContent(e.dataTransfer.files[0]);
    }
  });

  editor.addEventListener("keydown", (e) => {
    const buffer = buffers[activeBufferIndex];
    if (!buffer) return;

    // Handle special buffer inputs
    if (buffer.name === CALC_BUFFER_NAME && e.key === "Enter") {
      e.preventDefault();
      handleCalculatorEvaluation();
      return;
    }
    if (buffer.name === CALENDAR_BUFFER_NAME) {
      if (e.key === "n" || e.key === "p") {
        e.preventDefault();
        const currentDate = buffer.calendarDate;
        const direction = e.key === "n" ? 1 : -1;
        currentDate.setMonth(currentDate.getMonth() + direction);
        buffer.calendarDate = new Date(currentDate);
        editor.value = generateCalendarView(buffer.calendarDate);
      }
      return; // Prevent other handlers for calendar
    }

    // Regular handlers
    handleTextExpansion(e);
    handleAutoClosingBrackets(e);
    handleAutoIndent(e);
  });

  editor.addEventListener("keyup", handleBracketMatching);

  hamburgerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (contextMenu.style.display === "block") {
      hideContextMenu();
    } else {
      // Build the dynamic context menu for mobile
      const bufferList = document.getElementById("ctxBufferList");
      const bufferDivider = document.getElementById("ctxBufferDivider");
      bufferList.innerHTML = "";

      if (buffers.length > 1) {
        buffers.forEach((buf, index) => {
          const item = document.createElement("div");
          item.className = "context-menu-item";
          item.textContent = `${index === activeBufferIndex ? "✓ " : "\u00A0\u00A0"}${index + 1}: ${buf.name}`;
          item.title = buf.name;
          item.addEventListener("click", () => {
            switchToBuffer(index);
            hideContextMenu();
          });
          bufferList.appendChild(item);
        });
        bufferDivider.style.display = "block";
      } else {
        bufferDivider.style.display = "none";
      }

      const buffer = buffers[activeBufferIndex];
      document.getElementById("ctxToggleLock").textContent =
        buffer && buffer.isLocked ? "Unlock Note" : "Lock Note";
      document.getElementById("ctxToggleDark").textContent =
        document.body.classList.contains("dark-mode")
          ? "Light Mode"
          : "Dark Mode";
      document.getElementById("ctxToggleWrap").textContent =
        editor.classList.contains("no-wrap")
          ? "Enable Word Wrap"
          : "Disable Word Wrap";
      document.getElementById("ctxToggleFullscreen").textContent =
        document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";

      // Add mobile class for CSS hooks
      contextMenu.classList.add("mobile-menu");

      const rect = hamburgerBtn.getBoundingClientRect();
      const menuX = rect.right - 280;
      const menuY = rect.bottom + 5;

      showContextMenu(menuX, menuY);
    }
  });

  closeHelpBtn.addEventListener("click", closeHelpModal);

  document.addEventListener("keydown", async (e) => {
    if (
      (!findReplaceDialog.classList.contains("hidden") ||
        !expansionsModal.classList.contains("hidden")) &&
      e.key === "Escape"
    ) {
      closeFindDialog();
      closeExpansionsModal();
      return;
    }
    if (commandPaletteOpen) {
      const items = commandList.querySelectorAll(".command-item");
      let selected = commandList.querySelector(".selected");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selected && selected.nextElementSibling) {
          selected.classList.remove("selected");
          selected.nextElementSibling.classList.add("selected");
          selected.nextElementSibling.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selected && selected.previousElementSibling) {
          selected.classList.remove("selected");
          selected.previousElementSibling.classList.add("selected");
          selected.previousElementSibling.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selected) selected.click();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (selected) {
          const commandName =
            selected.querySelector("span:first-child").textContent;
          commandInput.value = commandName.startsWith("Switch to: ")
            ? commandName.substring(11)
            : commandName;
          commandInput.dispatchEvent(new Event("input"));
        }
      } else if (e.key === "Escape") {
        closeCommandPalette();
      }
      return;
    }

    const isModifierKey = e.ctrlKey || e.metaKey;
    if (isModifierKey) {
      if (
        (!findReplaceDialog.classList.contains("hidden") ||
          !expansionsModal.classList.contains("hidden")) &&
        document.activeElement.tagName === "INPUT"
      ) {
        if (["f", "e"].includes(e.key.toLowerCase())) e.preventDefault();
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        switchToBuffer(parseInt(e.key) - 1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex =
          activeBufferIndex > 0 ? activeBufferIndex - 1 : buffers.length - 1;
        switchToBuffer(prevIndex);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex =
          activeBufferIndex < buffers.length - 1 ? activeBufferIndex + 1 : 0;
        switchToBuffer(nextIndex);
        return;
      }

      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          openFindDialog();
          break;
        case "s":
          e.preventDefault();
          saveFile();
          break;
        case "d":
          e.preventDefault();
          toggleDarkMode();
          break;
        case "o":
          e.preventDefault();
          openFile();
          break;
        case "n":
          e.preventDefault();
          newTab();
          break;
        case "e":
          if (e.shiftKey) {
            e.preventDefault();
            exportProject();
          } else {
            e.preventDefault();
            openExpansionsModal();
          }
          break;
        case "i":
          if (e.shiftKey) {
            e.preventDefault();
            importProject();
          }
          break;
        case "w":
          e.preventDefault();
          closeBuffer(activeBufferIndex);
          break;
        case "=":
          e.preventDefault();
          await toggleLock();
          break;
        case "k":
          e.preventDefault();
          openCommandPalette();
          break;
      }
    } else if (e.key === "F11") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === "Escape") {
      if (!helpModal.classList.contains("hidden")) {
        closeHelpModal();
      }
      if (contextMenu.style.display === "block") {
        hideContextMenu();
      }
    }
  });

  document.addEventListener("contextmenu", (e) => {
    if (window.innerWidth <= 768) {
      return;
    }
    e.preventDefault();

    const bufferList = document.getElementById("ctxBufferList");
    const bufferDivider = document.getElementById("ctxBufferDivider");
    bufferList.innerHTML = "";

    if (buffers.length > 1) {
      buffers.forEach((buf, index) => {
        const item = document.createElement("div");
        item.className = "context-menu-item";
        item.textContent = `${index === activeBufferIndex ? "✓ " : "\u00A0\u00A0"}${index + 1}: ${buf.name}`;
        item.title = buf.name;
        item.addEventListener("click", () => {
          switchToBuffer(index);
          hideContextMenu();
        });
        bufferList.appendChild(item);
      });
      bufferDivider.style.display = "block";
    } else {
      bufferDivider.style.display = "none";
    }

    const buffer = buffers[activeBufferIndex];
    document.getElementById("ctxToggleLock").textContent =
      buffer && buffer.isLocked ? "Unlock Note" : "Lock Note";
    document.getElementById("ctxToggleDark").textContent =
      document.body.classList.contains("dark-mode")
        ? "Light Mode"
        : "Dark Mode";
    document.getElementById("ctxToggleWrap").textContent =
      editor.classList.contains("no-wrap")
        ? "Enable Word Wrap"
        : "Disable Word Wrap";
    document.getElementById("ctxToggleFullscreen").textContent =
      document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
    showContextMenu(e.clientX, e.clientY);
  });

  contextMenu.addEventListener("click", (e) => {
    if (!contextMenu.classList.contains("mobile-menu")) return;

    const menuItem = e.target.closest(".context-menu-item.has-submenu");
    if (menuItem) {
      // If we click a parent menu item, toggle its submenu
      e.preventDefault();
      e.stopPropagation();
      menuItem.classList.toggle("open");
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !contextMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      contextMenu.style.display === "block"
    ) {
      hideContextMenu();
    }
  });

  document.addEventListener("touchstart", (e) => {
    if (
      !contextMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      contextMenu.style.display === "block"
    ) {
      hideContextMenu();
    }
  });

  // Context menu item event listeners
  document.getElementById("ctxCommandPalette").addEventListener("click", () => {
    openCommandPalette();
    hideContextMenu();
  });
  document.getElementById("ctxFindReplace").addEventListener("click", () => {
    openFindDialog();
    hideContextMenu();
  });
  document
    .getElementById("ctxManageExpansions")
    .addEventListener("click", () => {
      openExpansionsModal();
      hideContextMenu();
    });
  document.getElementById("ctxNewTab").addEventListener("click", () => {
    newTab();
    hideContextMenu();
  });
  document.getElementById("ctxOpenFile").addEventListener("click", () => {
    openFile();
    hideContextMenu();
  });
  document.getElementById("ctxSaveFile").addEventListener("click", () => {
    saveFile();
    hideContextMenu();
  });
  document.getElementById("ctxExportProject").addEventListener("click", () => {
    exportProject();
    hideContextMenu();
  });
  document.getElementById("ctxImportProject").addEventListener("click", () => {
    importProject();
    hideContextMenu();
  });
  document.getElementById("ctxCloseBuffer").addEventListener("click", () => {
    closeBuffer(activeBufferIndex);
    hideContextMenu();
  });
  document
    .getElementById("ctxToggleLock")
    .addEventListener("click", async () => {
      await toggleLock();
      hideContextMenu();
    });
  document.getElementById("ctxToggleDark").addEventListener("click", () => {
    toggleDarkMode();
    hideContextMenu();
  });
  document.getElementById("ctxToggleWrap").addEventListener("click", () => {
    toggleWordWrap();
    hideContextMenu();
  });
  document
    .getElementById("ctxToggleFullscreen")
    .addEventListener("click", () => {
      toggleFullscreen();
      hideContextMenu();
    });
  document.getElementById("ctxShowHelp").addEventListener("click", () => {
    showHelp();
    hideContextMenu();
  });
  document.getElementById("ctxNextBuffer").addEventListener("click", () => {
    const nextIndex =
      activeBufferIndex < buffers.length - 1 ? activeBufferIndex + 1 : 0;
    switchToBuffer(nextIndex);
    hideContextMenu();
  });
  document.getElementById("ctxPrevBuffer").addEventListener("click", () => {
    const prevIndex =
      activeBufferIndex > 0 ? activeBufferIndex - 1 : buffers.length - 1;
    switchToBuffer(prevIndex);
    hideContextMenu();
  });
  // New context menu listeners
  document.getElementById("ctxCalculator").addEventListener("click", () => {
    openCalculator();
    hideContextMenu();
  });
  document.getElementById("ctxCalendar").addEventListener("click", () => {
    openCalendar();
    hideContextMenu();
  });
  document.getElementById("ctxEmailBuffer").addEventListener("click", () => {
    emailBuffer();
    hideContextMenu();
  });

  // Hash change event listener for browser back/forward navigation
  window.addEventListener("hashchange", handleHashChange);

  // Initialization
  initializeTabAndUrl();
  initializeBuffers();
  loadSettings();
  loadExpansions();
  editor.focus();
});
