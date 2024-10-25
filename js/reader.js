let translationsData;
let highlightedWordId = null;
let wordEquivalencies = {};
let selectedWordOnLeft = null;
let selectedWordOnRight = null;

// Track current index and side for keyboard navigation
let currentWordIndex = -1;
let currentSide = null;

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
  leftSelector.innerHTML = '';
  rightSelector.innerHTML = '';

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

  leftSelector.value = 'en';
  rightSelector.value = 'fr';
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

// Handle word click events to set keyboard navigation starting point
function handleWordClick(event, side) {
  const words = getWordElements(side);
  currentWordIndex = Array.from(words).indexOf(event.target);
  currentSide = side;

  console.log("Clicked word index:", currentWordIndex);
  console.log("Current side:", currentSide);
  
  clearSelectedWordOnBothSides();
  event.target.classList.add('highlight', 'selected-word');
  highlightedWordId = event.target.getAttribute('data-word-id');

  if (side === 'left') selectedWordOnLeft = event.target;
  else selectedWordOnRight = event.target;
  highlightWordsOnBothSides(highlightedWordId);
}

// Updated function to highlight word by index and ensure consistent behavior
function highlightWordByIndex(side, index) {
  const words = getWordElements(side);

  // Clear previous highlights on both sides
  clearSelectedWordOnBothSides();

  // Ensure the index is within bounds
  if (index >= 0 && index < words.length) {
    const word = words[index];
    
    // Add highlight and box to the new word
    word.classList.add('highlight', 'selected-word');
    
    // Update selected word reference and highlightedWordId
    if (side === 'left') {
      selectedWordOnLeft = word;
    } else if (side === 'right') {
      selectedWordOnRight = word;
    }
    highlightedWordId = word.getAttribute('data-word-id');
    currentWordIndex = index;
    currentSide = side;

    // Highlight the equivalent word on the other side
    highlightWordsOnBothSides(highlightedWordId);
  }
}

// Updated keyboard event listener for navigation
document.addEventListener('keydown', (event) => {
  if (currentSide && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    const words = getWordElements(currentSide);

    if (event.key === 'ArrowRight' && currentWordIndex < words.length - 1) {
      currentWordIndex++;
    } else if (event.key === 'ArrowLeft' && currentWordIndex > 0) {
      currentWordIndex--;
    }

    // Use the updated function to highlight the word by index and synchronize both sides
    highlightWordByIndex(currentSide, currentWordIndex);
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
