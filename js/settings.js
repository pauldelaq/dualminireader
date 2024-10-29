// Function to load settings HTML
function loadSettingsMenu() {
    fetch('settings.html')
        .then(response => response.text())
        .then(html => {
            const container = document.createElement('div');
            container.innerHTML = html;
            document.body.appendChild(container);

            setupSettingsMenuListeners();  // Set up open/close behavior after loading HTML
            initializeFontSizeControl();   // Initialize font size control
            initializeDisplayModeControl(); // Initialize display mode control

            // Apply saved display mode here, ensuring elements are in the DOM
            const savedDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';
            applyDisplayMode(savedDisplayMode);
        })
        .catch(error => console.error('Error loading settings menu:', error));
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

    // Update preview text size, but only if previewText exists
    const previewText = document.getElementById('previewText');
    if (previewText) {
        previewText.style.fontSize = `${scale}em`;
    }
}

function initializeDisplayModeControl() {
    // Get the saved display mode from localStorage
    const savedDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';

    // Select the radio buttons
    const sideBySideRadio = document.querySelector('input[name="displayMode"][value="sideBySide"]');
    const miniDictionaryRadio = document.querySelector('input[name="displayMode"][value="miniDictionary"]');
    
    // Set the radio button checked status based on saved display mode
    if (savedDisplayMode === 'sideBySide') {
        sideBySideRadio.checked = true;
        applyDisplayMode('sideBySide'); // Apply side-by-side mode on load
    } else if (savedDisplayMode === 'miniDictionary') {
        miniDictionaryRadio.checked = true;
        applyDisplayMode('miniDictionary'); // Apply mini-dictionary mode on load
    }

    // Add event listeners to update display mode on radio button change
    document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            const selectedMode = event.target.value;
            localStorage.setItem('displayMode', selectedMode); // Save selected mode
            applyDisplayMode(selectedMode); // Apply the selected display mode
            console.log("Display mode changed to:", selectedMode); // Log the selected mode
        });
    });
}

// Apply display mode to the layout
function applyDisplayMode(mode) {
    const textContainer = document.getElementById('textContainer');
    const rightSection = document.getElementById('rightSection');
    const leftSection = document.getElementById('leftSection');
    const footerDictionary = document.getElementById('footerDictionary');

    if (textContainer && rightSection && leftSection && footerDictionary) {
        if (mode === 'sideBySide') {
            textContainer.classList.remove('single-column');
            footerDictionary.classList.remove('active');
            rightSection.classList.remove('hidden');
            leftSection.style.width = '';
        } else if (mode === 'miniDictionary') {
            textContainer.classList.add('single-column');
            footerDictionary.classList.add('active');
            rightSection.classList.add('hidden');
            leftSection.style.width = '100%';
        }
    }
}
        
// Load settings menu, font size, and initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    loadFontSize(); // Apply font size from localStorage on page load
});
