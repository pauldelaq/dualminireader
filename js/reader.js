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
document.getElementById('leftLanguageSelector').addEventListener('change', (event) => {
  const selectedLanguage = event.target.value;
  const rightLanguageSelector = document.getElementById('rightLanguageSelector');
  const currentRightLanguage = rightLanguageSelector.value;

  if (selectedLanguage === currentRightLanguage) {
    // Swap the languages if the same language is selected
    rightLanguageSelector.value = localStorage.getItem('leftLanguage') || 'en';
    localStorage.setItem('rightLanguage', rightLanguageSelector.value);
  }

  // Update localStorage for both selectors
  localStorage.setItem('leftLanguage', selectedLanguage);
  localStorage.setItem('rightLanguage', rightLanguageSelector.value);

  // Update text for both sides
  updateText('left');
  updateText('right');
  updateWordEquivalenciesForSelectedLanguages();

  // Update mini-dictionary content if a word is highlighted
  if (highlightedWordId) {
    displayEquivalentWordInFooter(highlightedWordId);
  }
});

// Event listener for right language selector
document.getElementById('rightLanguageSelector').addEventListener('change', (event) => {
  const selectedLanguage = event.target.value;
  const leftLanguageSelector = document.getElementById('leftLanguageSelector');
  const currentLeftLanguage = leftLanguageSelector.value;

  if (selectedLanguage === currentLeftLanguage) {
    // Swap the languages if the same language is selected
    leftLanguageSelector.value = localStorage.getItem('rightLanguage') || 'fr';
    localStorage.setItem('leftLanguage', leftLanguageSelector.value);
  }

  // Update localStorage for both selectors
  localStorage.setItem('rightLanguage', selectedLanguage);
  localStorage.setItem('leftLanguage', leftLanguageSelector.value);

  // Update text for both sides
  updateText('left');
  updateText('right');
  updateWordEquivalenciesForSelectedLanguages();

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

  // Get saved values from localStorage, or fall back to defaults
  leftSelector.value = localStorage.getItem('leftLanguage') || 'en';
  rightSelector.value = localStorage.getItem('rightLanguage') || 'fr';
  footerSelector.value = localStorage.getItem('footerLanguage') || rightSelector.value;

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

  // Clear all highlights, but exclude the clicked element
  clearHighlights(event.target);

  // Ensure the clicked word is the only one with the selected-word class
  event.target.classList.add('selected-word'); // Apply the common selected class

  // Check if the clicked word is numbered or unnumbered
  if (event.target.classList.contains('clickable-word')) {
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
  } else if (event.target.classList.contains('unnumbered-word')) {
    // Clear the highlightedWordId
    highlightedWordId = null;

    // Apply unnumbered highlight class
    event.target.classList.add('unnumbered-highlight');
    console.log("Clicked an unnumbered word:", event.target.textContent);

    if (side === 'left') {
      selectedWordOnLeft = event.target;
    } else {
      selectedWordOnRight = event.target;
    }

    // Display "..." in the mini-dictionary for unnumbered words
    displayEquivalentWordInFooter(null);
  }

  console.log("Final target classes:", event.target.classList);
}

function highlightWordByIndex(side, index) {
  const words = getWordElements(side);

  // Clear all highlights and selections
  clearHighlights();

  if (index >= 0 && index < words.length) {
    const word = words[index];

    // Apply the selected-word class
    word.classList.add('selected-word');

    // Check if the word is numbered or unnumbered
    if (word.classList.contains('clickable-word')) {
      highlightedWordId = word.getAttribute('data-word-id');

      // Highlight all related words on both sides
      highlightWordsOnBothSides(highlightedWordId);

      // Display equivalent words in mini-dictionary
      if (currentDisplayMode === 'miniDictionary' && side === 'left') {
        displayEquivalentWordInFooter(highlightedWordId);
      }

      // Update references to the selected word
      if (side === 'left') selectedWordOnLeft = word;
      else selectedWordOnRight = word;
    } else if (word.classList.contains('unnumbered-word')) {
      // Handle unnumbered words
      highlightedWordId = null; // Clear the highlightedWordId

      // Apply unnumbered-highlight class
      word.classList.add('unnumbered-highlight');

      // Display "..." in the mini-dictionary
      if (currentDisplayMode === 'miniDictionary' && side === 'left') {
        displayEquivalentWordInFooter(null);
      }

      // Update references to the selected word
      if (side === 'left') selectedWordOnLeft = word;
      else selectedWordOnRight = word;
    }
  }
}

// Updated keyboard event listener for navigation to reflect mini-dictionary changes
document.addEventListener('keydown', (event) => {
  if (currentSide && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    const words = getWordElements(currentSide);

    // Determine the new index
    if (event.key === 'ArrowRight' && currentWordIndex < words.length - 1) {
      currentWordIndex++;
    } else if (event.key === 'ArrowLeft' && currentWordIndex > 0) {
      currentWordIndex--;
    } else {
      return; // Exit if no valid navigation
    }

    // Highlight the word at the new index
    highlightWordByIndex(currentSide, currentWordIndex);

    // Ensure mini-dictionary updates on key navigation
    if (currentDisplayMode === 'miniDictionary' && currentSide === 'left') {
      displayEquivalentWordInFooter(highlightedWordId);
    }
  }
});

// Function to get clickable words on a side
function getWordElements(side) {
  const titleWords = document.querySelectorAll(`#${side}Title .clickable-word, #${side}Title .unnumbered-word`);
  const textWords = document.querySelectorAll(`#${side}Text .clickable-word, #${side}Text .unnumbered-word`);
  return [...titleWords, ...textWords];
}

// updateText function: Attach click listeners and process text
function updateText(side) {
  const languageSelectorId = side === 'left' ? 'leftLanguageSelector' : 'rightLanguageSelector';
  const titleId = side === 'left' ? 'leftTitle' : 'rightTitle';
  const textContainerId = side === 'left' ? 'leftText' : 'rightText';
  const notesId = side === 'left' ? 'leftNotes' : 'rightNotes';

  const language = document.getElementById(languageSelectorId).value;

  if (!translationsData[language]) {
    console.error(`Language data for ${language} is not available.`);
    return;
  }

  // Fetch title, text, and notes
  let title = translationsData[language].title;
  let text = translationsData[language].text;
  let notes = translationsData[language].notes || "";

  // Apply placeholders for line breaks and indentation
  title = applyPlaceholders(title);
  notes = applyPlaceholders(notes);

  // Debugging: Log raw content
  console.log(`[DEBUG] Raw Title: ${title}`);
  console.log(`[DEBUG] Raw Notes: ${notes}`);

  // Make words clickable in title and text
  const clickableTitle = makeWordsClickable(title);
  const clickableNotes = makeWordsClickable(notes);

  // Debugging: Log clickable content
  console.log(`[DEBUG] Clickable Title: ${clickableTitle}`);
  console.log(`[DEBUG] Clickable Notes: ${clickableNotes}`);

  // Remove spaces only from the title and text sections
  const finalTitle = removeSpacesForAsianLanguages(clickableTitle, language);
  console.log(`[DEBUG] Final Title: ${finalTitle}`);

  // Populate the title
  document.getElementById(titleId).innerHTML = finalTitle;

  // Process text paragraphs
  const paragraphs = text.split(/\[br\]/);
  const textContainer = document.getElementById(textContainerId);
  textContainer.innerHTML = ''; // Clear previous content

  paragraphs.forEach((paragraph, index) => {
    console.log(`[DEBUG] Raw Paragraph ${index + 1}: ${paragraph}`);

    // Apply placeholders
    paragraph = applyPlaceholders(paragraph);

    // Make paragraph clickable
    let clickableParagraph = makeWordsClickable(paragraph);
    console.log(`[DEBUG] Clickable Paragraph ${index + 1}: ${clickableParagraph}`);

    // Final cleanup of spaces for text
    clickableParagraph = removeSpacesForAsianLanguages(clickableParagraph, language);

    // Debugging: Log final processed paragraph
    console.log(`[DEBUG] Final Paragraph ${index + 1}: ${clickableParagraph}`);

    // Create a row and append the processed paragraph
    const row = document.createElement('div');
    row.classList.add('row');
    const cell = document.createElement('div');
    cell.classList.add('cell', side === 'left' ? 'left-text' : 'right-text');
    cell.innerHTML = clickableParagraph;
    row.appendChild(cell);
    textContainer.appendChild(row);
  });

  // Populate notes without removing spaces
  document.getElementById(notesId).innerHTML = clickableNotes;

  // Attach click listeners for all clickable words and unnumbered words
  const wordElements = document.querySelectorAll(`#${titleId} .clickable-word, #${textContainerId} .clickable-word, #${titleId} .unnumbered-word, #${textContainerId} .unnumbered-word`);
  wordElements.forEach(word => {
    word.addEventListener('click', function(event) {
      handleWordClick(event, side);
    });
  });

  // Align rows in side-by-side mode
  if (currentDisplayMode === 'sideBySide') {
    alignTableRows();
  }

  if (highlightedWordId) {
    highlightWordsOnBothSides(highlightedWordId);
  }
}

function alignTableRows() {
  const leftRows = document.querySelectorAll('.left-text .row');
  const rightRows = document.querySelectorAll('.right-text .row');

  // Ensure we have the same number of rows on each side
  const rowCount = Math.min(leftRows.length, rightRows.length);

  for (let i = 0; i < rowCount; i++) {
      const leftCell = leftRows[i].querySelector('.cell');
      const rightCell = rightRows[i].querySelector('.cell');

      if (leftCell && rightCell) {
          // Reset heights
          leftCell.style.height = 'auto';
          rightCell.style.height = 'auto';

          // Calculate maximum height for the content row
          const maxContentHeight = Math.max(leftCell.offsetHeight, rightCell.offsetHeight);
          leftCell.style.height = `${maxContentHeight}px`;
          rightCell.style.height = `${maxContentHeight}px`;
      }

      // Set a consistent height for any spacer rows if needed
      if (leftRows[i].classList.contains('spacer-row') && rightRows[i].classList.contains('spacer-row')) {
          const spacerHeight = '1em'; // Adjust as needed for spacing
          leftRows[i].style.height = spacerHeight;
          rightRows[i].style.height = spacerHeight;
      }
  }
}

// Ensure alignment on page load and resize
window.addEventListener('load', alignTableRows);
window.addEventListener('resize', alignTableRows);

// Function to apply line break and indentation placeholders
function applyPlaceholders(text) {
  return text
    .replace(/\[br\]/g, '<br>') // Replace [br] with a line break
    .replace(/\[in\]/g, '<span style="margin-left: 1.5em;"></span>'); // Replace [in] with indentation
}

// Function to wrap multi-word phrases (with spaces) in a single span
function makeWordsClickable(text) {
  // Define regex patterns for excluded punctuation
  const excludedPunctuation = /^[«»!?;:.,。、？！，]+$/; // Matches single and multi-character punctuation

  // Parse the text into a DOM structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
  const container = doc.body.firstChild;

  // Traverse the DOM and wrap only valid text nodes
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const words = node.textContent.split(/\s+/); // Split by spaces

    // Replace text content with spans for each word
    const processedWords = words.map(word => {
      // Skip wrapping excluded punctuation
      if (excludedPunctuation.test(word.trim())) {
        return word; // Leave punctuation as-is
      }

      // Check for numbered words
      const wordIds = word.match(/\d+(_\d+)*$/);
      const cleanWord = word.replace(/\d+(_\d+)*$/, '');

      if (wordIds) {
        // Wrap numbered words
        return `<span class="clickable-word" data-word-id="${wordIds[0]}">${cleanWord}</span>`;
      } else if (word.trim() !== '') {
        // Wrap unnumbered words, ignoring empty spaces
        return `<span class="unnumbered-word">${cleanWord}</span>`;
      } else {
        return word; // Preserve spaces
      }
    });

    // Replace the original text node with the processed HTML
    const replacementHTML = processedWords.join(' ');
    const replacementNode = document.createElement('span');
    replacementNode.innerHTML = replacementHTML;

    node.parentNode.replaceChild(replacementNode, node);
  }

  // Return the modified HTML as a string
  return container.innerHTML;
}

// Function to remove spaces for Japanese and Chinese content just before rendering to HTML
function removeSpacesForAsianLanguages(text, language) {
  if (language === 'ja' || language === 'zh-TW' || language === 'zh-CN') {
    // Use a DOM parser to separate HTML structure from text
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
    const container = doc.body.firstChild;

    // Walk through child nodes and modify only text nodes
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      // Remove spaces in the text content
      node.textContent = node.textContent
        .replace(/\s+([.,!?;、。，])/g, '$1') // Remove spaces before punctuation
        .replace(/([.,!?;、。，])\s+/g, '$1') // Remove spaces after punctuation
        .replace(/\s+/g, ''); // Remove all extra spaces
    }

    return container.innerHTML; // Return the modified HTML structure
  }

  return text; // For non-Asian languages, return text as-is
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

function clearHighlights(excludeElement = null) {
  const leftWords = document.querySelectorAll('#leftTitle .clickable-word, #leftText .clickable-word, #leftTitle .unnumbered-word, #leftText .unnumbered-word');
  const rightWords = document.querySelectorAll('#rightTitle .clickable-word, #rightText .clickable-word, #rightTitle .unnumbered-word, #rightText .unnumbered-word');

  // Remove all highlight-related classes, except for the excluded element
  [...leftWords, ...rightWords].forEach(word => {
    if (word !== excludeElement) {
      word.classList.remove('highlight', 'unnumbered-highlight', 'selected-word');
    }
  });
}

function highlightWordsOnBothSides(wordId) {
  const wordIds = new Set(wordId.split('_')); // Split combined IDs into individual components

  const leftWords = Array.from(document.querySelectorAll(`#leftTitle .clickable-word, #leftText .clickable-word`));
  const rightWords = Array.from(document.querySelectorAll(`#rightTitle .clickable-word, #rightText .clickable-word`));

  // Expand wordIds with equivalents from the other side
  leftWords.forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      wordDataIds.forEach(id => wordIds.add(id)); // Add any connected IDs
    }
  });

  rightWords.forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      wordDataIds.forEach(id => wordIds.add(id)); // Add any connected IDs
    }
  });

  // Determine whether each ID has equivalents on the opposite side
  const hasEquivalentOnOppositeSide = {};
  wordIds.forEach(id => {
    hasEquivalentOnOppositeSide[id] = {
      left: leftWords.some(word => word.getAttribute('data-word-id').split('_').includes(id)),
      right: rightWords.some(word => word.getAttribute('data-word-id').split('_').includes(id)),
    };
  });

  // Highlight words on the left
  leftWords.forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      const hasEquivalent = wordDataIds.some(id => hasEquivalentOnOppositeSide[id]?.right);
      word.classList.add(hasEquivalent ? 'highlight' : 'unnumbered-highlight');
    }
  });

  // Highlight words on the right
  rightWords.forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      const hasEquivalent = wordDataIds.some(id => hasEquivalentOnOppositeSide[id]?.left);
      word.classList.add(hasEquivalent ? 'highlight' : 'unnumbered-highlight');
    }
  });
}

// Attach event listeners to display mode radio buttons
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
  document.querySelector('.table-container').classList.remove('single-column');
  footerDictionary.classList.remove('active');
  rightSection.classList.remove('hidden');
  currentDisplayMode = 'sideBySide';
  alignTableRows(); // Re-align the rows for side-by-side mode
  console.log("Switched to sideBySide mode - single-column class removed");
}

function activateMiniDictionaryMode() {
  document.querySelector('.table-container').classList.add('single-column');
  footerDictionary.classList.add('active');
  rightSection.classList.add('hidden');
  currentDisplayMode = 'miniDictionary';

  if (highlightedWordId) {
    displayEquivalentWordInFooter(highlightedWordId);
  }
  console.log("Switched to miniDictionary mode - single-column class added");
}

// Event listener for footer language selector
document.getElementById('footerLanguageSelector').addEventListener('change', (event) => {
  const selectedFooterLanguage = event.target.value;
  const leftLanguageSelector = document.getElementById('leftLanguageSelector');
  const rightLanguageSelector = document.getElementById('rightLanguageSelector');
  const currentLeftLanguage = leftLanguageSelector.value;
  const currentRightLanguage = rightLanguageSelector.value;

  if (selectedFooterLanguage === currentLeftLanguage) {
    // Swap footer language with the left language
    leftLanguageSelector.value = currentRightLanguage; // Swap left to the current right
    localStorage.setItem('leftLanguage', currentRightLanguage);

    rightLanguageSelector.value = currentLeftLanguage; // Swap right to the current left
    event.target.value = currentLeftLanguage; // Footer is now the original left
    localStorage.setItem('footerLanguage', currentLeftLanguage);
    localStorage.setItem('rightLanguage', currentLeftLanguage);
  } else {
    // Otherwise, update the footer and right language normally
    rightLanguageSelector.value = selectedFooterLanguage;
    localStorage.setItem('footerLanguage', selectedFooterLanguage);
    localStorage.setItem('rightLanguage', selectedFooterLanguage);
  }

  // Update text and equivalencies for all affected sides
  updateText('left');
  updateText('right');
  updateWordEquivalenciesForSelectedLanguages();

  // Update mini-dictionary content if a word is highlighted
  if (highlightedWordId) {
    displayEquivalentWordInFooter(highlightedWordId);
  }
});

function displayEquivalentWordInFooter(wordId) {
  const selectedFooterLang = footerLanguageSelector.value;
  console.log("Selected language for mini-dictionary:", selectedFooterLang);

  // If no wordId is provided (unnumbered word), display "..."
  if (!wordId) {
    footerContent.textContent = '...';
    return;
  }

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

  // Apply space removal for Asian languages
  if (['ja', 'zh-TW', 'zh-CN'].includes(selectedFooterLang)) {
    wordsToDisplay = removeSpacesForAsianLanguages(wordsToDisplay, selectedFooterLang);
  }

  footerContent.textContent = wordsToDisplay || '...'; // Display the concatenated phrase or placeholder
}
