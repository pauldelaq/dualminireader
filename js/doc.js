document.addEventListener('DOMContentLoaded', function () {
    const uiLanguageDropdown = document.getElementById('uiLanguageDropdown');
  
    // Load translations and apply them to the page
    const applyTranslations = (uiLanguage) => {
      fetch('data/doc.json') // Path to your JSON file
        .then((response) => response.json())
        .then((translations) => {
          // Iterate over all translatable elements
          Object.keys(translations).forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
              // Use innerHTML for specific IDs that include HTML content
              const htmlIDs = ['sourcesText2', 'wordMatchModeText', 'FillInTheBlankModeText'];
              if (htmlIDs.includes(id)) {
                element.innerHTML = translations[id][uiLanguage] || translations[id]['en'];
              } else {
                element.textContent = translations[id][uiLanguage] || translations[id]['en'];
              }
            }
          });
        })
        .catch((error) => console.error('Error loading translations:', error));
    };
  
    // Load the initial language setting from localStorage or default to English
    const uiLanguage = localStorage.getItem('uiLanguage') || 'en';
    uiLanguageDropdown.value = uiLanguage; // Set dropdown to the current language
    applyTranslations(uiLanguage);
  
    // Update the language when the dropdown selection changes
    uiLanguageDropdown.addEventListener('change', (event) => {
      const selectedLanguage = event.target.value;
      localStorage.setItem('uiLanguage', selectedLanguage); // Save the new language
      applyTranslations(selectedLanguage); // Apply translations in the selected language
    });
  });
  