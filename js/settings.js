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

// Initialize font size slider and set up event listeners
function initializeFontSizeControl() {
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const previewText = document.getElementById('previewText');

    if (!fontSizeSlider || !previewText) {
        console.error("Font size slider or preview text element is missing.");
        return;
    }

    // Set initial slider value from localStorage or default
    const savedFontSize = localStorage.getItem('fontSize') || 100;
    fontSizeSlider.value = savedFontSize;
    applyFontSize(savedFontSize);

    // Update font size on slider change
    fontSizeSlider.addEventListener('input', (event) => {
        const newSize = event.target.value;
        applyFontSize(newSize);
        localStorage.setItem('fontSize', newSize);
    });
}

// Function to apply font size across pages, excluding header
function applyFontSize(sizePercentage) {
    const scale = sizePercentage / 100;
  
    // Update the root CSS variable for the entire document
    document.documentElement.style.setProperty('--base-font-size', `${scale}em`);
  
    // Update preview text size based on this variable as well
    const previewText = document.getElementById('previewText');
    if (previewText) {
        previewText.style.fontSize = `${scale}em`;
    }
}

// Load settings menu and initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    // loadSettings();  // Uncomment when you have a loadSettings function defined
});
