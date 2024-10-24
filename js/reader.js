let translationsData;
let highlightedWordId = null;
let wordEquivalencies = {};
let selectedWordOnLeft = null; // Track the selected word on the left
let selectedWordOnRight = null; // Track the selected word on the right

// Function to get the value of the query parameter (e.g., "text=the_fox_and_the_grapes.json")
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Get the text file name from the query parameter
const textFile = getQueryParam('text');

if (textFile) {
  // Fetch the corresponding JSON file based on the selected text
  fetch(`data/texts/${textFile}`)
    .then(response => response.json())
    .then(data => {
      translationsData = data.languages; // Store the languages section of the JSON
      
      populateLanguageSelectors(); // Populate the dropdown menus
      processTranslations(); // Process the translations for word equivalencies
      
      updateText('left');  // Initialize left side with the default language (English)
      updateText('right'); // Initialize right side with the default language (French)

      // Add event listeners for language selectors AFTER they are populated
      document.getElementById('leftLanguageSelector').addEventListener('change', function() {
        updateText('left');
      });

      document.getElementById('rightLanguageSelector').addEventListener('change', function() {
        updateText('right');
      });
    })
    .catch(error => console.error('Error loading text:', error));
} else {
  console.error('No text file specified.');
}

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
  rightSelector.value = 'fr';  // Set French as default for right
}

// Function to process translations and store equivalencies in localStorage
function processTranslations() {
  const languages = Object.keys(translationsData);
  wordEquivalencies = {};

  languages.forEach(lang => {
    const words = translationsData[lang].text.split(' ');
    const titleWords = translationsData[lang].title.split(' ');

    // Process title words
    titleWords.forEach(word => {
      const wordId = word.match(/\d+$/);
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, '');
        if (!wordEquivalencies[wordId]) {
          wordEquivalencies[wordId] = {};
        }
        wordEquivalencies[wordId][lang] = cleanWord;
      }
    });

    // Process text words
    words.forEach(word => {
      const wordId = word.match(/\d+$/);
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, '');
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
        currentPhrase += ` ${cleanWord}`;
      } else {
        if (currentPhrase) {
          result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span> `;
        }
        currentWordId = wordIds[0];
        currentPhrase = cleanWord;
      }

      // Handle the last word
      if (index === words.length - 1) {
        result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span>`;
      }
    } else {
      if (currentPhrase) {
        result += `<span class="clickable-word" data-word-id="${currentWordId}">${currentPhrase}</span> `;
        currentPhrase = '';
      }
      result += cleanWord + ' ';
      currentWordId = null;
    }
  });

  return result.trim();
}

// Function to remove spaces for Japanese and Chinese content just before rendering to HTML
function removeSpacesForAsianLanguages(text, language) {
  if (language === 'ja' || language === 'zh-TW') {
    return text.replace(/>\s+</g, '><'); // Remove spaces between clickable words
  }
  return text;
}

// Function to update the displayed text for either 'left' or 'right' side
function updateText(side) {
  const languageSelectorId = side === 'left' ? 'leftLanguageSelector' : 'rightLanguageSelector';
  const titleElementId = side === 'left' ? 'leftTitle' : 'rightTitle';
  const textElementId = side === 'left' ? 'leftText' : 'rightText';
  const notesElementId = side === 'left' ? 'leftNotes' : 'rightNotes'; // Added for notes
  
  const language = document.getElementById(languageSelectorId).value;

  if (!translationsData[language]) {
    console.error(`Language data for ${language} is not available.`);
    return;
  }

  let title = translationsData[language].title;
  let text = translationsData[language].text;
  let notes = translationsData[language].notes || ""; // Notes might be optional
  
  // Process and display title with word numbers first
  let clickableTitle = makeWordsClickable(title);
  
  // Process and display main text content with word numbers first
  let clickableText = makeWordsClickable(text);

  // Remove spaces for Japanese/Chinese if needed
  clickableTitle = removeSpacesForAsianLanguages(clickableTitle, language);
  clickableText = removeSpacesForAsianLanguages(clickableText, language);

  // Render the clickable content into HTML
  document.getElementById(titleElementId).innerHTML = clickableTitle;
  document.getElementById(textElementId).innerHTML = clickableText;
  
  // Render notes (no clickable spans, just plain text)
  document.getElementById(notesElementId).innerText = notes;
  
  const wordElements = document.querySelectorAll(`#${titleElementId} .clickable-word, #${textElementId} .clickable-word`);
  wordElements.forEach(word => {
    word.addEventListener('click', function() {
      const selectedWordId = this.getAttribute('data-word-id');

      clearSelectedWordOnBothSides();

      if (side === 'left') {
        this.classList.add('selected-word');
        selectedWordOnLeft = this;
      } else if (side === 'right') {
        this.classList.add('selected-word');
        selectedWordOnRight = this;
      }

      highlightedWordId = selectedWordId;
      highlightWordsOnBothSides(highlightedWordId);
    });
  });

  if (highlightedWordId) {
    highlightWordsOnBothSides(highlightedWordId);
  }
}

// Function to clear selected words from both sides
function clearSelectedWordOnBothSides() {
  if (selectedWordOnLeft) {
    selectedWordOnLeft.classList.remove('selected-word');
    selectedWordOnLeft = null;
  }
  if (selectedWordOnRight) {
    selectedWordOnRight.classList.remove('selected-word');
    selectedWordOnRight = null;
  }
}

// Function to highlight words on both sides
function highlightWordsOnBothSides(wordId) {
  const wordIds = wordId.split('_');
  const leftWords = document.querySelectorAll(`#leftTitle .clickable-word, #leftText .clickable-word`);
  const rightWords = document.querySelectorAll(`#rightTitle .clickable-word, #rightText .clickable-word`);

  leftWords.forEach(word => word.classList.remove('highlight'));
  rightWords.forEach(word => word.classList.remove('highlight'));

  wordIds.forEach(id => {
    leftWords.forEach(word => {
      const wordDataIds = word.getAttribute('data-word-id').split('_');
      if (wordDataIds.includes(id)) {
        word.classList.add('highlight');
      }
    });
    rightWords.forEach(word => {
      const wordDataIds = word.getAttribute('data-word-id').split('_');
      if (wordDataIds.includes(id)) {
        word.classList.add('highlight');
      }
    });
  });
}
