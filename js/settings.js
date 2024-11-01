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
            initializeUILanguageDropdown(); // Initialize UI language dropdown

            const savedDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';
            applyDisplayMode(savedDisplayMode);
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

// Function to setup open/close behavior using the settings button
function setupSettingsMenuListeners() {
    const settingsButton = document.querySelector('.settings-button');
    const settingsMenu = document.querySelector('#settingsMenu');

    // Toggle settings menu on button click
    settingsButton.addEventListener('click', () => {
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
    const savedFontSize = localStorage.getItem('fontSize') || 100; // Default to 100 if not set
    applyFontSize(savedFontSize);
}

// Initialize font size slider without preview text
function initializeFontSizeControl() {
    const fontSizeSlider = document.getElementById('fontSizeSlider');
  
    // Set initial slider value from localStorage or default
    const savedFontSize = localStorage.getItem('fontSize') || 100;
    fontSizeSlider.value = savedFontSize;
    applyFontSize(savedFontSize);
  
    // Update font size on slider change
    fontSizeSlider.addEventListener('input', (event) => {
        const newSize = event.target.value;
        applyFontSize(newSize);
        localStorage.setItem('fontSize', newSize); // Save font size to localStorage
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

    // Trigger re-alignment of rows to adjust cell heights
    alignTableRows();
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
    }
}
        
// Load settings menu, font size, and initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    loadFontSize(); // Apply font size from localStorage on page load
});
