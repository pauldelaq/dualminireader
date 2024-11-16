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

  // Function to filter and display text content based on the selected languages
  const filterContentBasedOnLanguages = () => {
    const leftLanguage = localStorage.getItem('leftLanguage') || 'en';
    const rightLanguage = localStorage.getItem('rightLanguage') || 'en';

    fetch('data/texts.json')
      .then(response => response.json())
      .then(data => {
        const filteredTexts = data.texts.filter(text => {
          // Only include texts that have both selected languages
          return text.title[leftLanguage] && text.title[rightLanguage];
        });

        updateTextList(filteredTexts);
      })
      .catch(error => console.error('Error loading texts:', error));
  };

  // Function to update the text list on the index page
  const updateTextList = (filteredTexts) => {
    const textList = document.getElementById('textList');
    textList.classList.add('common-text');
    textList.innerHTML = ''; // Clear existing content
  
    // Get the uiLanguage for displaying content
    const uiLanguage = localStorage.getItem('uiLanguage') || 'en'; // Default to English if not set
  
    // Group texts by author using uiLanguage for display
    const textsByAuthor = {};
    filteredTexts.forEach(text => {
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
        link.textContent = text.title[uiLanguage] || text.title['en']; // Use uiLanguage for display
  
        const description = document.createElement('p');
        description.classList.add('description');
        description.textContent = text.description[uiLanguage] || text.description['en']; // Use uiLanguage for display
  
        textItem.appendChild(link);
        textItem.appendChild(description);
        textList.appendChild(textItem);
      });
    });
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
      const currentRightLanguage = rightLanguageDropdown.value;

      if (selectedLanguage === currentRightLanguage) {
        // Swap the languages if the same language is selected on the opposite menu
        rightLanguageDropdown.value = localStorage.getItem('leftLanguage') || 'en';
        localStorage.setItem('rightLanguage', rightLanguageDropdown.value);
      }

      // Update localStorage and filter content
      localStorage.setItem('leftLanguage', selectedLanguage);
      filterContentBasedOnLanguages(); // Filter content when the left language changes
    });

    rightLanguageDropdown.addEventListener('change', (event) => {
      const selectedLanguage = event.target.value;
      const currentLeftLanguage = leftLanguageDropdown.value;

      if (selectedLanguage === currentLeftLanguage) {
        // Swap the languages if the same language is selected on the opposite menu
        leftLanguageDropdown.value = localStorage.getItem('rightLanguage') || 'en';
        localStorage.setItem('leftLanguage', leftLanguageDropdown.value);
      }

      // Update localStorage and filter content
      localStorage.setItem('rightLanguage', selectedLanguage);
      localStorage.setItem('footerLanguage', selectedLanguage); // Set footerLanguage as well
      filterContentBasedOnLanguages(); // Filter content when the right language changes

      // Dispatch a custom event to refresh the content dynamically
      window.dispatchEvent(new Event('languageChanged'));
    });
  }

  // Initialize dropdowns on page load
  initializeUILanguageDropdown();

  // Initial content load
  updateStaticContent();
  filterContentBasedOnLanguages(); // Filter content based on initial language selection

  // Listen for custom event to detect uiLanguage change and update content dynamically
  window.addEventListener('languageChanged', () => {
    updateStaticContent(); // Update static text with new language
    filterContentBasedOnLanguages(); // Reload text list based on new language
  });
});
