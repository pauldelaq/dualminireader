function applySettingsTranslations(uiLanguage) {
  fetch('data/settings.json')
    .then(res => res.json())
    .then(translations => {
    const ids = [
      'gameModeHeader',
      'gameModePlaceholder',
      'gameModeBilingual',
      'gameModeMonolingual',
      'gameTimerLabel',
      'startGameBtn'
    ];

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && translations[id]) {
          el.textContent = translations[id][uiLanguage] || translations[id]['en'];
        }
      });
    });
}

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
      initializeDarkModeToggle(); // ✅ add dark mode logic

      const savedDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';
      applyDisplayMode(savedDisplayMode);

      const isReaderPage = window.location.pathname.includes('reader.html');
      const gameSettingsSection = document.getElementById('gameSettingsSection');
      if (gameSettingsSection) {
        gameSettingsSection.style.display = isReaderPage ? 'block' : 'none';
      }

      const displayModeSection = document.getElementById('displayModeSection');
      if (displayModeSection) {
        displayModeSection.classList.toggle('nonvisible', !isReaderPage);
      }

      if (isReaderPage) {
        const startGameBtn = document.getElementById('startGameBtn');
        const gameModeSelector = document.getElementById('gameModeSelector');
        const timerInputWrapper = document.getElementById('timerInputWrapper');

        if (gameModeSelector && timerInputWrapper) {
          gameModeSelector.addEventListener('change', () => {
            timerInputWrapper.classList.toggle('nonvisible', gameModeSelector.value !== 'bilingual');
          });
        }

        if (startGameBtn && gameModeSelector) {
          startGameBtn.addEventListener('click', () => {
            const selectedMode = gameModeSelector.value;

            if (selectedMode === 'bilingual') {
              localStorage.setItem('displayMode', 'sideBySide');
              applyDisplayMode('sideBySide');

              const sideBySideRadio = document.querySelector('input[name="displayMode"][value="sideBySide"]');
              if (sideBySideRadio) sideBySideRadio.checked = true;

              closeSettingsMenu();
              const customSeconds = parseInt(document.getElementById('gameTimerInput')?.value) || 30;
              window.startBilingualGame?.(customSeconds);
            } else if (selectedMode === 'monolingual') {
              localStorage.setItem('displayMode', 'miniDictionary');
              applyDisplayMode('miniDictionary');

              const miniDictionaryRadio = document.querySelector('input[name="displayMode"][value="miniDictionary"]');
              if (miniDictionaryRadio) miniDictionaryRadio.checked = true;

              closeSettingsMenu();
              window.startMonolingualGame?.();
            }
          });
        }
      }
    })
    .catch(error => console.error('Error loading settings menu:', error));
}

function initializeDarkModeToggle() {
  const toggleSwitch = document.getElementById('darkModeSwitch');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  let isDark = localStorage.getItem('dmrDarkMode');
  if (isDark === null) {
    isDark = prefersDark;
    localStorage.setItem('dmrDarkMode', prefersDark);
  } else {
    isDark = isDark === 'true';
  }

  // Apply dark mode class and update toggle state
  document.body.classList.toggle('dark-mode', isDark);
  toggleSwitch.checked = isDark;

  // 💡 Set initial theme-color based on current background color
  if (themeMeta) {
    const bgColor = getComputedStyle(document.body).getPropertyValue('--background-color').trim();
    themeMeta.setAttribute('content', bgColor);
  }

  // 📦 Update on toggle
  toggleSwitch.addEventListener('change', () => {
    const enabled = toggleSwitch.checked;
    document.body.classList.toggle('dark-mode', enabled);
    localStorage.setItem('dmrDarkMode', enabled);

    if (themeMeta) {
      const newBgColor = getComputedStyle(document.body).getPropertyValue('--background-color').trim();
      themeMeta.setAttribute('content', newBgColor);
    }
  });
}

function initializeUILanguageDropdown() {
  const uiLanguageDropdown = document.getElementById('uiLanguageDropdown');
  const savedUILanguage = localStorage.getItem('uiLanguage') || 'en';
  uiLanguageDropdown.value = savedUILanguage;

  uiLanguageDropdown.addEventListener('change', (event) => {
    const selectedLanguage = event.target.value;
    localStorage.setItem('uiLanguage', selectedLanguage);
    window.dispatchEvent(new Event('languageChanged'));
  });
}

function handleSettingsButtonClick() {
  const settingsButton = document.querySelector('.settings-button');
  const settingsMenu = document.querySelector('#settingsMenu');

  if (window.isGameInProgress?.()) {
    const currentMode = localStorage.getItem('displayMode');
    if (currentMode === 'bilingual') window.endBilingualGame?.();
    else if (currentMode === 'miniDictionary') window.endMonolingualGame?.();
    return;
  }

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
}

function setupSettingsMenuListeners() {
  const settingsButton = document.querySelector('.settings-button');
  settingsButton.addEventListener('click', handleSettingsButtonClick);
  window._settingsClickHandler = handleSettingsButtonClick; // 🔁 Allow other modules to remove it
}

function closeSettingsMenu() {
  const settingsMenu = document.querySelector('#settingsMenu');
  const settingsButton = document.querySelector('.settings-button');
  if (settingsMenu && settingsButton) {
    settingsMenu.classList.add('hidden');
    settingsButton.textContent = '[≡]';
    document.body.classList.remove('settings-active');
  }
}

function loadFontSize() {
  const savedFontSize = localStorage.getItem('dmrfontSize') || 100;
  applyFontSize(savedFontSize);
}

function initializeFontSizeControl() {
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const savedFontSize = localStorage.getItem('dmrfontSize') || 100;
  fontSizeSlider.value = savedFontSize;
  applyFontSize(savedFontSize);

  fontSizeSlider.addEventListener('input', (event) => {
    const newSize = event.target.value;
    applyFontSize(newSize);
    localStorage.setItem('dmrfontSize', newSize);
  });
}

function applyFontSize(sizePercentage) {
  const scale = sizePercentage / 100;
  document.documentElement.style.setProperty('--base-font-size', `${scale}em`);

  const previewText = document.getElementById('previewText');
  if (previewText) previewText.style.fontSize = `${scale}em`;

  if (typeof alignTableRows === 'function') {
    alignTableRows();
  }
}

function initializeDisplayModeControl() {
  currentDisplayMode = localStorage.getItem('displayMode') || 'sideBySide';

  const sideBySideRadio = document.querySelector('input[name="displayMode"][value="sideBySide"]');
  const miniDictionaryRadio = document.querySelector('input[name="displayMode"][value="miniDictionary"]');

  if (currentDisplayMode === 'sideBySide') {
    sideBySideRadio.checked = true;
    applyDisplayMode('sideBySide');
  } else if (currentDisplayMode === 'miniDictionary') {
    miniDictionaryRadio.checked = true;
    applyDisplayMode('miniDictionary');
  }

  document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      currentDisplayMode = event.target.value;
      localStorage.setItem('displayMode', currentDisplayMode);
      applyDisplayMode(currentDisplayMode);
    });
  });
}

function applyDisplayMode(mode) {
  const tableContainer = document.querySelector('.table-container');
  const footerDictionary = document.getElementById('footerDictionary');

  if (tableContainer && footerDictionary) {
    if (mode === 'sideBySide') {
      tableContainer.classList.remove('single-column');
      footerDictionary.classList.remove('active');
      footerDictionary.classList.add('hidden');
    } else if (mode === 'miniDictionary') {
      tableContainer.classList.add('single-column');
      footerDictionary.classList.add('active');
      footerDictionary.classList.remove('hidden');
    }

    if (typeof alignTableRows === 'function') {
      alignTableRows();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettingsMenu();
  loadFontSize();

  const uiLang = localStorage.getItem('uiLanguage') || 'en';
  applySettingsTranslations(uiLang);
});

window.addEventListener('languageChanged', () => {
  const lang = localStorage.getItem('uiLanguage') || 'en';
  applySettingsTranslations(lang);
});
