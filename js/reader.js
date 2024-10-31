let translationsData;
let highlightedWordId = null;
let wordEquivalencies = {};
let selectedWordOnLeft = null;
let selectedWordOnRight = null;

// Track current index and side for keyboard navigation
let currentWordIndex = -1;
let currentSide = null;
let currentDisplayMode = 'sideBySide'; // Default mode

// Get the DOM elements for display mode handling
const textContainer = document.getElementById('textContainer');
const rightSection = document.getElementById('rightSection');
const footerDictionary = document.getElementById('footerDictionary');
const footerLanguageSelector = document.getElementById('footerLanguageSelector');
const footerContent = document.getElementById('footerContent');

// Function to get the value of the query parameter (e.g., "text=the_fox_and_the_grapes.json")
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const textFile = getQueryParam('text');
if (textFile) {
  fetch(`data/texts/${textFile}`)
    .then(response => response.json())
    .then(data => {
      translationsData = data.languages;
      populateLanguageSelectors();
      updateText('left');
      updateText('right');

      // Event listener for left language selector
      document.getElementById('leftLanguageSelector').addEventListener('change', () => {
        updateText('left');
        updateWordEquivalenciesForSelectedLanguages(); // Recalculate word equivalencies based on new language pair

        // Update mini-dictionary content if a word is highlighted
        if (highlightedWordId) {
          displayEquivalentWordInFooter(highlightedWordId);
        }
      });

      // Event listener for right language selector
      document.getElementById('rightLanguageSelector').addEventListener('change', () => {
        updateText('right');
        updateWordEquivalenciesForSelectedLanguages(); // Recalculate word equivalencies

        // Update mini-dictionary content if a word is highlighted
        if (highlightedWordId) {
          displayEquivalentWordInFooter(highlightedWordId);
        }
      });
    })
    .catch(error => console.error('Error loading text:', error));
} else {
  console.error('No text file specified.');
}

// ** New function: update word equivalencies based on the selected languages **
function updateWordEquivalenciesForSelectedLanguages() {
  const leftLang = document.getElementById('leftLanguageSelector').value;
  const rightLang = document.getElementById('rightLanguageSelector').value;
  
  wordEquivalencies = {}; // Clear current equivalencies
  processTranslations(leftLang, rightLang); // Cross-reference only selected languages
}

// ** Modified function: processTranslations for only two languages **
function processTranslations(lang1, lang2) {
  wordEquivalencies = {};

  // Retrieve words for lang1 and lang2 from translationsData
  const lang1Words = [...translationsData[lang1].text.split(' '), ...translationsData[lang1].title.split(' ')];
  const lang2Words = [...translationsData[lang2].text.split(' '), ...translationsData[lang2].title.split(' ')];

  // Process words in lang1
  lang1Words.forEach(word => processWord(word, lang1));

  // Process words in lang2
  lang2Words.forEach(word => processWord(word, lang2));
}

function processWord(word, lang) {
  const wordIds = word.match(/\d+(_\d+)*/);
  if (wordIds) {
    const cleanWord = word.replace(/\d+(_\d+)*/, '');

    wordIds[0].split('_').forEach(id => {
      if (!wordEquivalencies[id]) wordEquivalencies[id] = {};
      
      // Store each word with the same ID in an array for the language
      if (!wordEquivalencies[id][lang]) {
        wordEquivalencies[id][lang] = []; // Initialize array if not present
      }
      wordEquivalencies[id][lang].push(cleanWord); // Add the word to the array

      // Track multi-word connections across IDs for reverse lookup
      wordIds[0].split('_').forEach(relatedId => {
        if (relatedId !== id) {
          if (!wordEquivalencies[id].connections) wordEquivalencies[id].connections = new Set();
          wordEquivalencies[id].connections.add(relatedId);
        }
      });
    });
  }
}

// ** Modified function: Populate dropdown menus and add synchronization **
function populateLanguageSelectors() {
  const languageOptions = Object.keys(translationsData);
  const leftSelector = document.getElementById('leftLanguageSelector');
  const rightSelector = document.getElementById('rightLanguageSelector');
  const footerSelector = document.getElementById('footerLanguageSelector');
  
  leftSelector.innerHTML = '';
  rightSelector.innerHTML = '';
  footerSelector.innerHTML = '';

  languageOptions.forEach(languageKey => {
    const languageName = translationsData[languageKey].languageName;
    const optionLeft = document.createElement('option');
    const optionRight = document.createElement('option');
    const optionFooter = document.createElement('option');
    optionLeft.value = languageKey;
    optionLeft.textContent = languageName;
    optionRight.value = languageKey;
    optionRight.textContent = languageName;
    optionFooter.value = languageKey;
    optionFooter.textContent = languageName;
    leftSelector.appendChild(optionLeft);
    rightSelector.appendChild(optionRight);
    footerSelector.appendChild(optionFooter);
  });

  // Set default values
  leftSelector.value = 'en';
  rightSelector.value = 'fr';
  footerSelector.value = 'fr';

  // Synchronize right and footer selectors
  syncLanguageSelectors(rightSelector, footerSelector);

  // Set initial word equivalencies for default language selections
  updateWordEquivalenciesForSelectedLanguages();
}

function syncLanguageSelectors(rightSelector, footerSelector) {
  // When the right language selector changes
  rightSelector.addEventListener('change', () => {
    footerSelector.value = rightSelector.value;
    updateText('right'); // Refresh content for the right side
    updateWordEquivalenciesForSelectedLanguages(); // Recalculate word equivalencies
    if (highlightedWordId && currentDisplayMode === 'miniDictionary') {
      displayEquivalentWordInFooter(highlightedWordId); // Update mini-dictionary content
    }
  });

  // When the footer language selector changes
  footerSelector.addEventListener('change', () => {
    rightSelector.value = footerSelector.value;
    updateText('right'); // Refresh content for the right side
    updateWordEquivalenciesForSelectedLanguages(); // Recalculate word equivalencies
    if (highlightedWordId && currentDisplayMode === 'miniDictionary') {
      displayEquivalentWordInFooter(highlightedWordId); // Update mini-dictionary content
    }
  });
}

function handleWordClick(event, side) {
  console.log("handleWordClick called with side:", side);
  console.log("Current display mode:", currentDisplayMode);

  const words = getWordElements(side);
  currentWordIndex = Array.from(words).indexOf(event.target);
  currentSide = side;

  clearSelectedWordOnBothSides();
  event.target.classList.add('highlight', 'selected-word');
  highlightedWordId = event.target.getAttribute('data-word-id');

  console.log("Clicked word ID (highlightedWordId):", highlightedWordId); 

  if (side === 'left') {
      selectedWordOnLeft = event.target;
  } else {
      selectedWordOnRight = event.target;
  }

  highlightWordsOnBothSides(highlightedWordId);

  // Preload mini-dictionary content with the highlighted word
  displayEquivalentWordInFooter(highlightedWordId);
}

function highlightWordByIndex(side, index) {
  const words = getWordElements(side);

  clearSelectedWordOnBothSides();

  if (index >= 0 && index < words.length) {
      const word = words[index];
      word.classList.add('highlight', 'selected-word');
      
      if (side === 'left') selectedWordOnLeft = word;
      else selectedWordOnRight = word;

      highlightedWordId = word.getAttribute('data-word-id');
      currentWordIndex = index;
      currentSide = side;

      highlightWordsOnBothSides(highlightedWordId);

      if (currentDisplayMode === 'miniDictionary' && side === 'left') {
          displayEquivalentWordInFooter(highlightedWordId);
      }
  }
}

// Updated keyboard event listener for navigation to reflect mini-dictionary changes
document.addEventListener('keydown', (event) => {
  if (currentSide && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      const words = getWordElements(currentSide);

      if (event.key === 'ArrowRight' && currentWordIndex < words.length - 1) {
          currentWordIndex++;
      } else if (event.key === 'ArrowLeft' && currentWordIndex > 0) {
          currentWordIndex--;
      }

      highlightWordByIndex(currentSide, currentWordIndex);

      // Ensure mini-dictionary updates on key navigation
      if (currentDisplayMode === 'miniDictionary' && currentSide === 'left') {
          displayEquivalentWordInFooter(highlightedWordId);
      }
  }
});

// Function to get clickable words on a side
function getWordElements(side) {
  const titleWords = document.querySelectorAll(`#${side}Title .clickable-word`);
  const textWords = document.querySelectorAll(`#${side}Text .clickable-word`);
  return [...titleWords, ...textWords];
}

// updateText function: Attach click listeners and process text
function updateText(side) {
  const languageSelectorId = side === 'left' ? 'leftLanguageSelector' : 'rightLanguageSelector';
  const titleElementId = side === 'left' ? 'leftTitle' : 'rightTitle';
  const textElementId = side === 'left' ? 'leftText' : 'rightText';
  const notesElementId = side === 'left' ? 'leftNotes' : 'rightNotes';
  
  const language = document.getElementById(languageSelectorId).value;

  if (!translationsData[language]) {
    console.error(`Language data for ${language} is not available.`);
    return;
  }

  // Fetch title, text, and notes from translationsData
  let title = translationsData[language].title;
  let text = translationsData[language].text;
  let notes = translationsData[language].notes || "";

  // Replace placeholders for line breaks and indentation
  title = applyPlaceholders(title);
  text = applyPlaceholders(text);

  // Make words clickable after placeholder replacement
  let clickableTitle = makeWordsClickable(title);
  let clickableText = makeWordsClickable(text);

  clickableTitle = removeSpacesForAsianLanguages(clickableTitle, language);
  clickableText = removeSpacesForAsianLanguages(clickableText, language);

  // Update HTML elements with processed content
  document.getElementById(titleElementId).innerHTML = clickableTitle;
  document.getElementById(textElementId).innerHTML = clickableText;
  document.getElementById(notesElementId).innerText = notes;
  
  // Attach click listeners to each word element
  const wordElements = document.querySelectorAll(`#${titleElementId} .clickable-word, #${textElementId} .clickable-word`);
  wordElements.forEach(word => {
    word.addEventListener('click', function(event) {
      handleWordClick(event, side);
    });
  });

  if (highlightedWordId) {
    highlightWordsOnBothSides(highlightedWordId);
  }
}

// Function to apply line break and indentation placeholders
function applyPlaceholders(text) {
  return text
    .replace(/\[br\]/g, '<br>') // Replace [br] with a line break
    .replace(/\[in\]/g, '<span style="margin-left: 2em;"></span>'); // Replace [in] with indentation
}

// Function to wrap multi-word phrases (with spaces) in a single span
function makeWordsClickable(text) {
  const words = text.split(' ');
  let result = '';
  let currentPhrase = '';
  let currentWordId = null;

  words.forEach((word, index) => {
    const wordIds = word.match(/\d+(_\d+)*$/);
    const cleanWord = word.replace(/\d+(_\d+)*$/, '');

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
    return text.replace(/>\s+</g, '><');
  }
  return text;
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

function highlightWordsOnBothSides(wordId) {
  const wordIds = new Set(wordId.split('_'));
  
  // Include connected IDs in the set
  wordIds.forEach(id => {
    if (wordEquivalencies[id] && wordEquivalencies[id].connections) {
      wordEquivalencies[id].connections.forEach(connId => wordIds.add(connId));
    }
  });

  const leftWords = document.querySelectorAll(`#leftTitle .clickable-word, #leftText .clickable-word`);
  const rightWords = document.querySelectorAll(`#rightTitle .clickable-word, #rightText .clickable-word`);

  // Clear existing highlights
  leftWords.forEach(word => word.classList.remove('highlight'));
  rightWords.forEach(word => word.classList.remove('highlight'));

  // Apply highlights based on gathered IDs
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

// Functions for display mode switching
document.querySelectorAll('input[name="displayMode"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    if (event.target.value === 'sideBySide') {
      activateSideBySideMode();
    } else if (event.target.value === 'miniDictionary') {
      activateMiniDictionaryMode();
    }
  });
});

function activateSideBySideMode() {
  textContainer.classList.remove('single-column');
  footerDictionary.classList.remove('active');
  rightSection.classList.remove('hidden');
  currentDisplayMode = 'sideBySide';
  console.log("Switched to sideBySide mode");
}

function activateMiniDictionaryMode() {
  textContainer.classList.add('single-column');
  footerDictionary.classList.add('active');
  rightSection.classList.add('hidden');
  currentDisplayMode = 'miniDictionary';
  console.log("Switched to miniDictionary mode");
}

// Event listener for footer language selector
footerLanguageSelector.addEventListener('change', () => {
  console.log("Footer language changed");
  updateWordEquivalenciesForSelectedLanguages(); // Recalculate word equivalencies

  // Update mini-dictionary content if a word is highlighted
  if (highlightedWordId) {
    displayEquivalentWordInFooter(highlightedWordId);
  }
});

function displayEquivalentWordInFooter(wordId) {
  const selectedFooterLang = footerLanguageSelector.value;
  console.log("Selected language for mini-dictionary:", selectedFooterLang);

  // Split multi-ID string (like "9_10") into individual IDs
  const ids = wordId.split('_');

  // Collect words for each ID in the selected language
  let wordsToDisplay = ids
    .map(id => {
      const equivalentWords = wordEquivalencies[id];
      if (equivalentWords) {
        return (equivalentWords[selectedFooterLang] || []).join(' ');
      }
      return ''; // Return empty string if no equivalent found for this ID
    })
    .filter(word => word) // Remove empty strings
    .join(' '); // Join all words with a space between them

  // Remove punctuation from the concatenated phrase
  wordsToDisplay = wordsToDisplay.replace(/[.,\/#!$%\^&\*;:{}=\«»_`~()。]/g, "");

  footerContent.textContent = wordsToDisplay || '...'; // Display the concatenated phrase or placeholder
}
