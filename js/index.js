document.addEventListener('DOMContentLoaded', function () {
  // Function to update static content with translations
  const updateStaticContent = () => {
    const uiLanguage = localStorage.getItem('uiLanguage') || 'en'; // Default to English if not set

    fetch('data/index.json')
      .then(response => response.json())
      .then(translations => {
        // Update static content with translations
        document.getElementById('welcomeText').textContent = translations.welcomeText[uiLanguage] || translations.welcomeText['en'];
        document.getElementById('showMeLabel').innerHTML = `<i>${translations.showMeText[uiLanguage] || translations.showMeText['en']}</i>`;
        document.getElementById('andLabel').textContent = translations.andText[uiLanguage] || translations.andText['en'];
      })
      .catch(error => console.error('Error loading index translations:', error));
  };

  // Function to load and display text content based on the current uiLanguage
  const loadContent = () => {
    const uiLanguage = localStorage.getItem('uiLanguage') || 'en'; // Default to English if not set

    fetch('data/texts.json')
      .then(response => response.json())
      .then(data => {
        const textList = document.getElementById('textList');
        textList.classList.add('common-text');
        textList.innerHTML = ''; // Clear existing content

        // Group texts by author with language consideration
        const textsByAuthor = {};
        data.texts.forEach(text => {
          const author = text.author[uiLanguage] || text.author['en']; // Fallback to English if translation not available
          if (!textsByAuthor[author]) {
            textsByAuthor[author] = [];
          }
          textsByAuthor[author].push(text);
        });

        // Create and display the text list with headers
        Object.keys(textsByAuthor).forEach(author => {
          // Create a header for each author
          const authorHeader = document.createElement('h2');
          authorHeader.textContent = author;
          authorHeader.classList.add('author-header');
          textList.appendChild(authorHeader);

          // List texts under the header
          textsByAuthor[author].forEach(text => {
            const textItem = document.createElement('div');
            textItem.classList.add('text-item');

            const link = document.createElement('a');
            link.href = `reader.html?text=${encodeURIComponent(text.jsonFile)}`;
            link.textContent = text.title[uiLanguage] || text.title['en']; // Fallback to English

            const description = document.createElement('p');
            description.classList.add('description');
            description.textContent = text.description[uiLanguage] || text.description['en']; // Fallback to English

            textItem.appendChild(link);
            textItem.appendChild(description);
            textList.appendChild(textItem);
          });
        });
      })
      .catch(error => console.error('Error loading texts:', error));
  };

  // Function to initialize and populate language dropdowns
  function initializeUILanguageDropdown() {
    const leftLanguageDropdown = document.getElementById('leftLanguageDropdown');
    const rightLanguageDropdown = document.getElementById('rightLanguageDropdown');
    const languages = ['en', 'fr', 'es', 'zh-TW', 'zh-CN', 'ja'];
    const languageNames = {
      'en': 'English',
      'fr': 'Français',
      'es': 'Español',
      'zh-TW': '中文（繁體）',
      'zh-CN': '中文（简体）',
      'ja': '日本語'
    };

    // Populate dropdowns
    const populateDropdown = (dropdown, storedValue) => {
      dropdown.innerHTML = ''; // Clear existing options
      languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = languageNames[lang];
        if (lang === storedValue) {
          option.selected = true;
        }
        dropdown.appendChild(option);
      });
    };

    const storedLeftLanguage = localStorage.getItem('leftLanguage') || 'en';
    const storedRightLanguage = localStorage.getItem('rightLanguage') || 'en';

    populateDropdown(leftLanguageDropdown, storedLeftLanguage);
    populateDropdown(rightLanguageDropdown, storedRightLanguage);

    // Event listeners for dropdown changes
    leftLanguageDropdown.addEventListener('change', (event) => {
      const selectedLanguage = event.target.value;
      localStorage.setItem('leftLanguage', selectedLanguage);
    });

    rightLanguageDropdown.addEventListener('change', (event) => {
      const selectedLanguage = event.target.value;
      localStorage.setItem('rightLanguage', selectedLanguage);
      localStorage.setItem('footerLanguage', selectedLanguage); // Set footerLanguage as well

      // Dispatch a custom event to refresh the content dynamically
      window.dispatchEvent(new Event('languageChanged'));
    });
  }

  // Initialize dropdowns on page load
  initializeUILanguageDropdown();

  // Initial content load
  updateStaticContent();
  loadContent();

  // Listen for custom event to detect uiLanguage change and update content dynamically
  window.addEventListener('languageChanged', () => {
    updateStaticContent(); // Update static text with new language
    loadContent(); // Reload text list based on new language
  });
});
