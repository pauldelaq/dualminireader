// Function to load settings HTML
function loadSettingsMenu() {
    fetch('settings.html')
      .then(response => response.text())
      .then(html => {
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);
  
        // Add event listeners after loading the HTML
        setupSettingsMenuListeners();
      })
      .catch(error => console.error('Error loading settings menu:', error));
  }
  
  // Function to setup open/close behavior
  function setupSettingsMenuListeners() {
    const settingsButton = document.querySelector('.settings-button');
    const settingsMenu = document.querySelector('.settings-menu');
    const closeButton = document.querySelector('.close-button');
  
    // Open settings menu
    settingsButton.addEventListener('click', () => {
      settingsMenu.classList.remove('hidden');
      document.body.classList.add('settings-active');
      settingsButton.textContent = '[X]'; // Change to close icon
    });
  
    // Close settings menu
    closeButton.addEventListener('click', () => {
      settingsMenu.classList.add('hidden');
      document.body.classList.remove('settings-active');
      settingsButton.textContent = '[≡]'; // Change back to menu icon
    });
  }
  
  // Save settings to localStorage when they change
  function saveSetting(key, value) {
    localStorage.setItem(key, value);
  }
  
  // Load settings from localStorage when opening
  function loadSettings() {
    // Example: Retrieve a setting
    const settingValue = localStorage.getItem('settingKey');
    // Apply the setting value to your settings menu
  }
  
  // Load settings menu and CSS on page load
  document.addEventListener('DOMContentLoaded', () => {
    loadSettingsMenu();
    loadSettings(); // Load previously saved settings
  });
  