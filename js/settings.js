// Function to load settings HTML
function loadSettingsMenu() {
    fetch('settings.html')
        .then(response => response.text())
        .then(html => {
            const container = document.createElement('div');
            container.innerHTML = html;
            document.body.appendChild(container);

            setupSettingsMenuListeners();
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
            // Close the menu
            settingsMenu.classList.add('hidden');
            settingsButton.textContent = '[≡]'; // Switch back to menu icon
            document.body.classList.remove('settings-active');
        } else {
            // Open the menu
            settingsMenu.classList.remove('hidden');
            settingsButton.textContent = '[X]'; // Switch to close icon
            document.body.classList.add('settings-active');
        }
    });
}

// Save settings to localStorage when they change
function saveSetting(key, value) {
    localStorage.setItem(key, value);
}

// Load settings from localStorage when opening
function loadSettings() {
    const settingValue = localStorage.getItem('settingKey');
    // Apply the setting value to your settings menu if needed
}

// Load settings menu and CSS on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    loadSettings();
});
