let translationsData;
let highlightedWordId = null;
let wordEquivalencies = {};

// Load the JSON file with the translations
fetch('translations.json')
  .then(response => response.json())
  .then(data => {
    translationsData = data.languages;
    
    populateLanguageSelectors(); // Populate the dropdown menus
    processTranslations();
    updateText('left');  // Initialize left side with the default language (English)
    updateText('right'); // Initialize right side with the default language (English)
  })
  .catch(error => console.error('Error loading translations:', error));

// Function to dynamically populate the dropdown menus based on available languages in the JSON file
function populateLanguageSelectors() {
  const languageOptions = Object.keys(translationsData); // Get the languages from the JSON
  const leftSelector = document.getElementById('leftLanguageSelector');
  const rightSelector = document.getElementById('rightLanguageSelector');
  
  // Clear the existing options in both dropdowns
  leftSelector.innerHTML = '';
  rightSelector.innerHTML = '';

  // Populate both dropdowns with available languages from JSON
  languageOptions.forEach(languageKey => {
    const languageName = translationsData[languageKey].languageName;
    const optionLeft = document.createElement('option');
    const optionRight = document.createElement('option');
    
    optionLeft.value = languageKey;
    optionLeft.textContent = languageName;
    optionRight.value = languageKey;
    optionRight.textContent = languageName;
    
    leftSelector.appendChild(optionLeft);
    rightSelector.appendChild(optionRight);
  });

  // Set default values for both dropdowns
  leftSelector.value = 'en';  // Set English as default for left
  rightSelector.value = 'en';  // Set English as default for right
}

// Function to process translations and store equivalencies in localStorage
function processTranslations() {
  const languages = Object.keys(translationsData);
  wordEquivalencies = {};

  // Process each language (both title and text content)
  languages.forEach(lang => {
    const words = translationsData[lang].text.split(' ');
    const titleWords = translationsData[lang].title.split(' ');

    // Process title words
    titleWords.forEach(word => {
      const wordId = word.match(/\d+$/); // Extract the word ID (numbers at the end)
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, ''); // Remove the number from the word
        if (!wordEquivalencies[wordId]) {
          wordEquivalencies[wordId] = {};
        }
        wordEquivalencies[wordId][lang] = cleanWord;
      }
    });

    // Process text words
    words.forEach(word => {
      const wordId = word.match(/\d+$/); // Extract the word ID (numbers at the end)
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, ''); // Remove the number from the word
        if (!wordEquivalencies[wordId]) {
          wordEquivalencies[wordId] = {};
        }
        wordEquivalencies[wordId][lang] = cleanWord;
      }
    });
  });

  // Store equivalencies in localStorage
  localStorage.setItem('wordEquivalencies', JSON.stringify(wordEquivalencies));
}

// Function to wrap multi-word phrases (with spaces) in a single span
function makeWordsClickable(text) {
  const words = text.split(' ');
  let result = '';
  let currentPhrase = '';
  let currentWordId = null;

  words.forEach((word, index) => {
    const wordIds = word.match(/\d+(_\d+)*$/); // Extract one or more word IDs
    const cleanWord = word.replace(/\d+(_\d+)*$/, ''); // Remove the numbers from the word

    if (wordIds) {
      if (currentWordId === wordIds[0]) {
        // Add the current word (with a space) to the current phrase
        currentPhrase += ` ${cleanWord}`;
      } else {
        // Close the previous phrase (if any) and start a new one
        if (currentPhrase) {
          result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span> `;
        }
        currentWordId = wordIds[0];
        currentPhrase = cleanWord; // Start the new phrase
      }

      // Handle the last word
      if (index === words.length - 1) {
        result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span>`;
      }
    } else {
      // If no wordId, close any open phrase and add the current word without wrapping
      if (currentPhrase) {
        result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span> `;
        currentPhrase = '';
      }
      result += cleanWord + ' ';
      currentWordId = null; // Reset for the next phrase
    }
  });

  return result.trim();
}

// Function to update the displayed text for either 'left' or 'right' side
function updateText(side) {
  if (!translationsData) {
    console.error('Translations data is not available.');
    return;
  }

  const languageSelectorId = side === 'left' ? 'leftLanguageSelector' : 'rightLanguageSelector';
  const titleElementId = side === 'left' ? 'leftTitle' : 'rightTitle';
  const textElementId = side === 'left' ? 'leftText' : 'rightText';
  
  const language = document.getElementById(languageSelectorId).value;
  
  if (!translationsData[language]) {
    console.error(`Language data for ${language} is not available.`);
    return;
  }

  const title = translationsData[language].title;
  const text = translationsData[language].text;

  // Process and display title
  const clickableTitle = makeWordsClickable(title);
  document.getElementById(titleElementId).innerHTML = clickableTitle;

  // Process and display main text content
  const clickableText = makeWordsClickable(text);
  document.getElementById(textElementId).innerHTML = clickableText;

  // Add click event to each word or phrase (for both title and text)
  const wordElements = document.querySelectorAll(`#${titleElementId} .clickable-word, #${textElementId} .clickable-word`);
  wordElements.forEach(word => {
    word.addEventListener('click', function() {
      highlightedWordId = this.getAttribute('data-word-id');

      // Find equivalent word in both sides and highlight them
      highlightWordsOnBothSides(highlightedWordId);
    });
  });

  // If a word was previously highlighted, highlight the equivalent word/phrase in the new language
  if (highlightedWordId) {
    highlightWordsOnBothSides(highlightedWordId);
  }
}

// Modify highlightWordsOnBothSides to handle multiple word IDs and exact match
function highlightWordsOnBothSides(wordId) {
  const wordIds = wordId.split('_'); // Support multiple word IDs
  const leftWords = document.querySelectorAll(`#leftTitle .clickable-word, #leftText .clickable-word`);
  const rightWords = document.querySelectorAll(`#rightTitle .clickable-word, #rightText .clickable-word`);

  // Clear previous highlights
  leftWords.forEach(word => word.classList.remove('highlight'));
  rightWords.forEach(word => word.classList.remove('highlight'));

  // Highlight words on both sides with exact matches
  wordIds.forEach(id => {
    leftWords.forEach(word => {
      const wordDataIds = word.getAttribute('data-word-id').split('_'); // Split any multi-ID words
      if (wordDataIds.includes(id)) {  // Exact match for each word ID
        word.classList.add('highlight');
      }
    });
    rightWords.forEach(word => {
      const wordDataIds = word.getAttribute('data-word-id').split('_'); // Split any multi-ID words
      if (wordDataIds.includes(id)) {  // Exact match for each word ID
        word.classList.add('highlight');
      }
    });
  });
}

// Add event listeners to the left and right language selectors
document.getElementById('leftLanguageSelector').addEventListener('change', function() {
  updateText('left');
});

document.getElementById('rightLanguageSelector').addEventListener('change', function() {
  updateText('right');
});

// Call updateText after JSON is loaded, for both sides to make words clickable
document.addEventListener('DOMContentLoaded', function() {
  // Nothing here now, updateText is called after fetch completes
});
