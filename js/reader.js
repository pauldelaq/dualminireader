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
      processTranslations();
      updateText('left');
      updateText('right');

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

// Populate dropdown menus based on languages in JSON
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

  leftSelector.value = 'en';
  rightSelector.value = 'fr';
  footerSelector.value = 'fr';
}

// Process translations and store equivalencies
function processTranslations() {
  const languages = Object.keys(translationsData);
  wordEquivalencies = {};
  languages.forEach(lang => {
    const words = translationsData[lang].text.split(' ');
    const titleWords = translationsData[lang].title.split(' ');
    titleWords.forEach(word => {
      const wordId = word.match(/\d+$/);
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, '');
        if (!wordEquivalencies[wordId]) wordEquivalencies[wordId] = {};
        wordEquivalencies[wordId][lang] = cleanWord;
      }
    });
    words.forEach(word => {
      const wordId = word.match(/\d+$/);
      if (wordId) {
        const cleanWord = word.replace(/\d+$/, '');
        if (!wordEquivalencies[wordId]) wordEquivalencies[wordId] = {};
        wordEquivalencies[wordId][lang] = cleanWord;
      }
    });
  });
  localStorage.setItem('wordEquivalencies', JSON.stringify(wordEquivalencies));
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

  if (currentDisplayMode === 'miniDictionary' && side === 'left') {
      console.log("Calling displayEquivalentWordInFooter with ID:", highlightedWordId);
      displayEquivalentWordInFooter(highlightedWordId);
  }
}

// Updated highlightWordByIndex function to work with miniDictionary mode
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

      // Update mini-dictionary when in miniDictionary mode
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

  let title = translationsData[language].title;
  let text = translationsData[language].text;
  let notes = translationsData[language].notes || "";
  
  let clickableTitle = makeWordsClickable(title);
  let clickableText = makeWordsClickable(text);

  clickableTitle = removeSpacesForAsianLanguages(clickableTitle, language);
  clickableText = removeSpacesForAsianLanguages(clickableText, language);

  document.getElementById(titleElementId).innerHTML = clickableTitle;
  document.getElementById(textElementId).innerHTML = clickableText;
  document.getElementById(notesElementId).innerText = notes;
  
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

footerLanguageSelector.addEventListener('change', () => {
  console.log("Footer language changed");  // This should log whenever the dropdown value changes
  if (highlightedWordId && currentDisplayMode === 'miniDictionary') {
      displayEquivalentWordInFooter(highlightedWordId); // Update displayed word when language changes
  }
});

// Update displayEquivalentWordInFooter to be consistent across modes
function displayEquivalentWordInFooter(wordId) {
  const equivalentWords = wordEquivalencies[wordId];
  console.log("Displaying equivalent word in footer for word ID:", wordId, "Equivalent words:", equivalentWords);

  if (equivalentWords) {
      const selectedLang = footerLanguageSelector.value; // Get the selected language in the footer
      footerContent.textContent = equivalentWords[selectedLang] || '...'; // Display equivalent word or message
  } else {
      footerContent.textContent = '...'; // Display message if no equivalent found
  }
}