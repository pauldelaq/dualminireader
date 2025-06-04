// Function to load settings HTML
function loadSettingsMenu() {
  fetch('settings.html')
    .then(response => response.text())
    .then(html => {
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      setupSettingsMenuListeners();
      initializeFontSizeControl();
      initializeDisplayModeControl();
      initializeUILanguageDropdown();

      const savedDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';
      applyDisplayMode(savedDisplayMode);

      // 🔍 Detect current page
      const isReaderPage = window.location.pathname.includes('reader.html');

      // 🎮 Show/hide Game Mode section
      const gameSettingsSection = document.getElementById('gameSettingsSection');
      if (gameSettingsSection) {
        gameSettingsSection.style.display = isReaderPage ? 'block' : 'none';
      }

        // 📖 Show/hide Display Mode section
        const displayModeSection = document.getElementById('displayModeSection');
        if (displayModeSection) {
        if (isReaderPage) {
            displayModeSection.classList.remove('nonvisible');
        } else {
            displayModeSection.classList.add('nonvisible');
        }
        }

      // 🎮 If on reader.html, attach Start Game logic
      if (isReaderPage) {
        const startGameBtn = document.getElementById('startGameBtn');
        const gameModeSelector = document.getElementById('gameModeSelector');

        if (startGameBtn && gameModeSelector) {
            startGameBtn.addEventListener('click', () => {
            const selectedMode = gameModeSelector.value;

            if (selectedMode === 'bilingual') {
                // 1. Set display mode to side-by-side
                localStorage.setItem('displayMode', 'sideBySide');
                applyDisplayMode('sideBySide');

                // 2. Update the side-by-side radio button
                const sideBySideRadio = document.querySelector('input[name="displayMode"][value="sideBySide"]');
                if (sideBySideRadio) {
                sideBySideRadio.checked = true;
                }

                // 3. Close the settings menu
                const settingsMenu = document.querySelector('#settingsMenu');
                const settingsButton = document.querySelector('.settings-button');
                if (settingsMenu && settingsButton) {
                settingsMenu.classList.add('hidden');
                settingsButton.textContent = '[≡]';
                document.body.classList.remove('settings-active');
                }

                // 4. Start the game
                window.startBilingualGame?.();
            }
            });
        }
      }
    })
    .catch(error => console.error('Error loading settings menu:', error));
}

function initializeUILanguageDropdown() {
    const uiLanguageDropdown = document.getElementById('uiLanguageDropdown');
    const savedUILanguage = localStorage.getItem('uiLanguage') || 'en'; // Default to English

    uiLanguageDropdown.value = savedUILanguage;

    uiLanguageDropdown.addEventListener('change', (event) => {
        const selectedLanguage = event.target.value;
        localStorage.setItem('uiLanguage', selectedLanguage);

        // Dispatch a custom event after updating localStorage
        window.dispatchEvent(new Event('languageChanged'));
    });
}

function setupSettingsMenuListeners() {
    const settingsButton = document.querySelector('.settings-button');
    const settingsMenu = document.querySelector('#settingsMenu');

    // Toggle settings menu or cancel game
    settingsButton.addEventListener('click', () => {
        // ✅ Check if game is in progress
        if (window.isGameInProgress?.()) {
            // ⛔ Cancel the game
            window.endBilingualGame?.();
            return;
        }

        // Otherwise, toggle menu as usual
        const isMenuOpen = !settingsMenu.classList.contains('hidden');

        if (isMenuOpen) {
            settingsMenu.classList.add('hidden');
            settingsButton.textContent = '[≡]';
            document.body.classList.remove('settings-active');
        } else {
            settingsMenu.classList.remove('hidden');
            settingsButton.textContent = '[X]';
            document.body.classList.add('settings-active');
        }
    });
}

// Load and apply the saved font size from localStorage
function loadFontSize() {
    const savedFontSize = localStorage.getItem('dmrfontSize') || 100; // Default to 100 if not set
    applyFontSize(savedFontSize);
}

// Initialize font size slider without preview text
function initializeFontSizeControl() {
    const fontSizeSlider = document.getElementById('fontSizeSlider');
  
    // Set initial slider value from localStorage or default
    const savedFontSize = localStorage.getItem('dmrfontSize') || 100;
    fontSizeSlider.value = savedFontSize;
    applyFontSize(savedFontSize);
  
    // Update font size on slider change
    fontSizeSlider.addEventListener('input', (event) => {
        const newSize = event.target.value;
        applyFontSize(newSize);
        localStorage.setItem('dmrfontSize', newSize); // Save font size to localStorage
    });
}

// Apply font size across pages, excluding header
function applyFontSize(sizePercentage) {
    const scale = sizePercentage / 100;
    document.documentElement.style.setProperty('--base-font-size', `${scale}em`);

    // Update preview text size if previewText exists
    const previewText = document.getElementById('previewText');
    if (previewText) {
        previewText.style.fontSize = `${scale}em`;
    }

        // Call alignTableRows if it is defined
        if (typeof alignTableRows === 'function') {
            alignTableRows();
        }
    }

function initializeDisplayModeControl() {
    // Get the saved display mode from localStorage or default to 'sideBySide'
    currentDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';

    // Select the radio buttons
    const sideBySideRadio = document.querySelector('input[name="displayMode"][value="sideBySide"]');
    const miniDictionaryRadio = document.querySelector('input[name="displayMode"][value="miniDictionary"]');
    
    // Set the checked status of the radio button based on currentDisplayMode
    if (currentDisplayMode === 'sideBySide') {
        sideBySideRadio.checked = true;
        applyDisplayMode('sideBySide'); // Apply side-by-side mode on load
    } else if (currentDisplayMode === 'miniDictionary') {
        miniDictionaryRadio.checked = true;
        applyDisplayMode('miniDictionary'); // Apply mini-dictionary mode on load
    }

    // Event listeners to update display mode on radio button change
    document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            currentDisplayMode = event.target.value; // Update currentDisplayMode
            localStorage.setItem('displayMode', currentDisplayMode); // Save to localStorage
            applyDisplayMode(currentDisplayMode); // Apply the selected display mode
            console.log("Display mode changed to:", currentDisplayMode); // Log the change
        });
    });
}

// Apply display mode to the layout
function applyDisplayMode(mode) {
    const tableContainer = document.querySelector('.table-container');
    const footerDictionary = document.getElementById('footerDictionary');

    if (tableContainer && footerDictionary) {
        if (mode === 'sideBySide') {
            tableContainer.classList.remove('single-column');
            footerDictionary.classList.remove('active');
        } else if (mode === 'miniDictionary') {
            tableContainer.classList.add('single-column');
            footerDictionary.classList.add('active');
        }

        // Call alignTableRows if it is defined
        if (typeof alignTableRows === 'function') {
            alignTableRows();
        }
    }
}

// Load settings menu, font size, and initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    loadFontSize(); // Apply font size from localStorage on page load
});
