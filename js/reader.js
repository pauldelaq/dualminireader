let translationsData;
let highlightedWordId = null;
let wordEquivalencies = {};
let selectedWordOnLeft = null;
let selectedWordOnRight = null;

// Track current index and side for keyboard navigation
let currentWordIndex = -1;
let currentSide = null;
let currentDisplayMode = 'sideBySide'; // Default mode

window.isGameModeActive = false;

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

document.getElementById('leftLanguageSelector').addEventListener('change', (event) => {
  const newLeftLang = event.target.value;
  const leftLanguageSelector = document.getElementById('leftLanguageSelector');
  const rightLanguageSelector = document.getElementById('rightLanguageSelector');
  const footerLanguageSelector = document.getElementById('footerLanguageSelector'); // purely visual

  const oldLeftLang = localStorage.getItem('leftLanguage') || 'en';
  const currentRightLang = rightLanguageSelector.value;

  if (newLeftLang === currentRightLang) {
    // 🔁 Swap left <-> right
    rightLanguageSelector.value = oldLeftLang;
    footerLanguageSelector.value = oldLeftLang; // keep footer visually synced
    localStorage.setItem('rightLanguage', oldLeftLang);
  }

  // 📝 Save the new left language
  localStorage.setItem('leftLanguage', newLeftLang);

  // 🔄 Refresh
  updateText('left');
  updateWordEquivalenciesForSelectedLanguages();

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
  footerSelector.value = rightSelector.value; // Always mirrors right

  // ✅ Right selector controls both right and footer language
  rightSelector.addEventListener('change', () => {
    const newRightLang = rightSelector.value;
    const leftLang = leftSelector.value;
    const oldRightLang = localStorage.getItem('rightLanguage') || 'fr';

    if (currentDisplayMode === 'sideBySide' && newRightLang === leftLang) {
      // 🔁 Swap right <-> left
      leftSelector.value = oldRightLang;
      localStorage.setItem('leftLanguage', oldRightLang);
    }

    // 🔄 Always mirror footer visually
    footerSelector.value = rightSelector.value;

    // Save right language
    localStorage.setItem('rightLanguage', rightSelector.value);

    // Refresh
    updateText('right');
    updateWordEquivalenciesForSelectedLanguages();

    if (highlightedWordId && currentDisplayMode === 'miniDictionary') {
      displayEquivalentWordInFooter(highlightedWordId);
    }
  });

  // Set initial word equivalencies for default language selections
  updateWordEquivalenciesForSelectedLanguages();
}

function handleWordClick(event, side) {
  if (window.isGameModeActive) return;
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

    if (word.classList.contains('clickable-word')) {
      highlightedWordId = word.getAttribute('data-word-id');

      highlightWordsOnBothSides(highlightedWordId);

      // Update references
      if (side === 'left') selectedWordOnLeft = word;
      else selectedWordOnRight = word;

      return highlightedWordId; // 🔁 Return the ID
    } else if (word.classList.contains('unnumbered-word')) {
      highlightedWordId = null;
      word.classList.add('unnumbered-highlight');

      if (side === 'left') selectedWordOnLeft = word;
      else selectedWordOnRight = word;

      return null; // 🔁 Return null for unnumbered
    }
  }
}

function applySoftHyphensIfWrapped(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('span.clickable-word, span.unnumbered-word').forEach(originalSpan => {
    const cleanText = originalSpan.textContent.replace(/\u00AD/g, '');
    originalSpan.textContent = cleanText;

    if (!cleanText || !cleanText.trim()) return;

    // Check if the word wraps by comparing to a no-wrap clone
    const clone = originalSpan.cloneNode(true);
    clone.textContent = cleanText;
    clone.style.visibility = 'hidden';
    clone.style.position = 'absolute';
    clone.style.whiteSpace = 'nowrap';
    clone.style.fontSize = getComputedStyle(originalSpan).fontSize;
    document.body.appendChild(clone);

    const originalWidth = originalSpan.offsetWidth;
    const cloneWidth = clone.offsetWidth;
    document.body.removeChild(clone);

    if (cloneWidth <= originalWidth) {
      return; // ✅ Still fits — no need to hyphenate
    }

    // Find best hyphenation point
    let bestSplitIndex = -1;

    for (let i = 2; i < cleanText.length - 1; i++) {
      const testText = cleanText.slice(0, i) + '\u00AD' + cleanText.slice(i);

      const testSpan = document.createElement('span');
      testSpan.className = originalSpan.className;
      testSpan.style.visibility = 'hidden';
      testSpan.style.position = 'absolute';
      testSpan.style.whiteSpace = 'normal';
      testSpan.style.width = originalWidth + 'px';
      testSpan.innerHTML = testText;

      document.body.appendChild(testSpan);
      const testHeight = testSpan.clientHeight;
      document.body.removeChild(testSpan);

      if (testHeight > originalSpan.clientHeight) {
        bestSplitIndex = i;
      }
    }

    if (bestSplitIndex !== -1) {
      originalSpan.innerHTML =
        cleanText.slice(0, bestSplitIndex) +
        '\u00AD' +
        cleanText.slice(bestSplitIndex);
    }
  });
}

function patchFrenchPunctuationSpaces() {
  const walker = document.createTreeWalker(
    document.getElementById('textContainer'),
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const oldText = node.textContent;

    const newText = oldText
      // Non-breaking space **after** opening guillemet «
      .replace(/(«)(\s)/g, '$1\u00A0')
      // Non-breaking space **before** closing guillemet », !, ?, :, ;, %, $, €
      .replace(/(\s)([»!?;:%$€])/g, '\u00A0$2');

    if (oldText !== newText) {
      node.textContent = newText;
    }
  }
}

document.addEventListener('keydown', (event) => {
  // 🔒 Disable arrow key navigation during game
  if (window.isGameModeActive && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    event.preventDefault();
    return;
  }

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

    // 🟡 Simulate a click event on the new word
    const newWord = words[currentWordIndex];
    handleWordClick({ target: newWord }, currentSide);
  }
});

// Function to get clickable words on a side
function getWordElements(side) {
  const titleWords = document.querySelectorAll(`#${side}Title .clickable-word, #${side}Title .unnumbered-word`);
  const textWords = document.querySelectorAll(`.cell.${side}-text .clickable-word, .cell.${side}-text .unnumbered-word`);
  return [...titleWords, ...textWords];
}

function updateText(side) {
  // Only run when called from left — skip right to avoid double render
  if (side !== 'left') return;

  const leftLang = document.getElementById('leftLanguageSelector').value;
  const rightLang = document.getElementById('rightLanguageSelector').value;

  const leftTitleId = 'leftTitle';
  const rightTitleId = 'rightTitle';
  const leftNotesId = 'leftNotes';
  const rightNotesId = 'rightNotes';

  const container = document.getElementById('textContainer');

  // 🧱 Preserve title row before clearing
  const titleRow = Array.from(container.children).find(row =>
    row.contains(document.getElementById(leftTitleId))
  );

  // Clear content
  container.innerHTML = '';
  if (titleRow) container.appendChild(titleRow);

  // Fetch translation data
  const leftData = translationsData[leftLang];
  const rightData = translationsData[rightLang];

  // 📝 Prepare and populate titles
  const clickableLeftTitle = removeSpacesForAsianLanguages(
    makeWordsClickable(applyPlaceholders(leftData.title)),
    leftLang
  );
  const clickableRightTitle = removeSpacesForAsianLanguages(
    makeWordsClickable(applyPlaceholders(rightData.title)),
    rightLang
  );

  const leftTitleEl = document.getElementById(leftTitleId);
  const rightTitleEl = document.getElementById(rightTitleId);
  if (leftTitleEl) leftTitleEl.innerHTML = clickableLeftTitle;
  if (rightTitleEl) rightTitleEl.innerHTML = clickableRightTitle;

  // 📝 Prepare notes (will be appended after paragraphs)
  const clickableLeftNotes = removeSpacesForAsianLanguages(
    makeWordsClickable(applyPlaceholders(leftData.notes || '')),
    leftLang
  );
  const clickableRightNotes = removeSpacesForAsianLanguages(
    makeWordsClickable(applyPlaceholders(rightData.notes || '')),
    rightLang
  );

  // 📄 Split and render aligned paragraph rows
  const leftParagraphs = leftData.text.split(/\[br\]/);
  const rightParagraphs = rightData.text.split(/\[br\]/);
  const rowCount = Math.max(leftParagraphs.length, rightParagraphs.length);

  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('div');
    row.classList.add('row');

    const leftCell = document.createElement('div');
    leftCell.classList.add('cell', 'left-text');
    leftCell.innerHTML = removeSpacesForAsianLanguages(
      makeWordsClickable(applyPlaceholders(leftParagraphs[i] || '')),
      leftLang
    );

    const gap = document.createElement('div');
    gap.classList.add('cell', 'gap');

    const rightCell = document.createElement('div');
    rightCell.classList.add('cell', 'right-text');
    rightCell.innerHTML = removeSpacesForAsianLanguages(
      makeWordsClickable(applyPlaceholders(rightParagraphs[i] || '')),
      rightLang
    );

    row.appendChild(leftCell);
    row.appendChild(gap);
    row.appendChild(rightCell);
    container.appendChild(row);
  }

  // 📝 Add notes row after all paragraphs
  const notesRow = document.createElement('div');
  notesRow.classList.add('row');

  const leftNotesCell = document.createElement('div');
  leftNotesCell.classList.add('cell', 'left-notes');
  leftNotesCell.innerHTML = `<p class="notes">${clickableLeftNotes}</p>`;

  const gap = document.createElement('div');
  gap.classList.add('cell', 'gap');

  const rightNotesCell = document.createElement('div');
  rightNotesCell.classList.add('cell', 'right-notes');
  rightNotesCell.innerHTML = `<p class="notes">${clickableRightNotes}</p>`;

  notesRow.appendChild(leftNotesCell);
  notesRow.appendChild(gap);
  notesRow.appendChild(rightNotesCell);
  container.appendChild(notesRow);

  // 🖱️ Attach click listeners for both sides
  ['left', 'right'].forEach(side => {
    const titleId = side === 'left' ? 'leftTitle' : 'rightTitle';
    const wordElements = document.querySelectorAll(
      `#${titleId} .clickable-word, .cell.${side}-text .clickable-word, #${titleId} .unnumbered-word, .cell.${side}-text .unnumbered-word`
    );
    wordElements.forEach(word => {
      word.addEventListener('click', function (event) {
        handleWordClick(event, side);
      });
    });
  });

  // ♻️ Reset layout heights and reapply highlights
  resetAllRowHeights();

  if (currentDisplayMode === 'sideBySide') {
    alignTableRows();
  }

  if (highlightedWordId) {
    highlightWordsOnBothSides(highlightedWordId);
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      applySoftHyphensIfWrapped('#leftTitle');
      applySoftHyphensIfWrapped('#rightTitle');
    }, 20); // Slightly more time
  });

  patchFrenchPunctuationSpaces();
}

function alignTableRows() {
  if (currentDisplayMode === 'miniDictionary') return;

  const leftCells = document.querySelectorAll('.left-text .cell');
  const rightCells = document.querySelectorAll('.right-text .cell');

  // 🧹 Always reset previous height styles first
  [...leftCells, ...rightCells].forEach(cell => {
    cell.style.height = 'auto';
  });

  const leftRows = document.querySelectorAll('.left-text .row');
  const rightRows = document.querySelectorAll('.right-text .row');

  const rowCount = Math.min(leftRows.length, rightRows.length);

  for (let i = 0; i < rowCount; i++) {
    const leftCell = leftRows[i].querySelector('.cell');
    const rightCell = rightRows[i].querySelector('.cell');

    if (leftCell && rightCell) {
      // Recalculate and match heights
      const maxContentHeight = Math.max(leftCell.offsetHeight, rightCell.offsetHeight);
      leftCell.style.height = `${maxContentHeight}px`;
      rightCell.style.height = `${maxContentHeight}px`;
    }

    if (leftRows[i].classList.contains('spacer-row') && rightRows[i].classList.contains('spacer-row')) {
      const spacerHeight = '1em';
      leftRows[i].style.height = spacerHeight;
      rightRows[i].style.height = spacerHeight;
    }
  }

}

// Ensure alignment on page load and resize
window.addEventListener('load', alignTableRows);
window.addEventListener('resize', () => {
  alignTableRows();
});

function resetAllRowHeights() {
  document.querySelectorAll('#leftText .cell, #rightText .cell').forEach(cell => {
    cell.style.removeProperty('height');
  });

  document.querySelectorAll('#leftText .row, #rightText .row').forEach(row => {
    row.style.removeProperty('height');
  });

}

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
  const leftWords = document.querySelectorAll('#leftTitle .clickable-word, .cell.left-text .clickable-word, #leftTitle .unnumbered-word, .cell.left-text .unnumbered-word');
  const rightWords = document.querySelectorAll('#rightTitle .clickable-word, .cell.right-text .clickable-word, #rightTitle .unnumbered-word, .cell.right-text .unnumbered-word');

  [...leftWords, ...rightWords].forEach(word => {
    if (word !== excludeElement) {
      word.classList.remove('highlight', 'unnumbered-highlight', 'selected-word');
    }
  });
}

function highlightWordsOnBothSides(wordId) {
  const wordIds = new Set(wordId.split('_'));

  const leftWords = Array.from(document.querySelectorAll(`#leftTitle .clickable-word, .cell.left-text .clickable-word`));
  const rightWords = Array.from(document.querySelectorAll(`#rightTitle .clickable-word, .cell.right-text .clickable-word`));

  // Expand wordIds with equivalents from the other side
  [...leftWords, ...rightWords].forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      wordDataIds.forEach(id => wordIds.add(id));
    }
  });

  // Determine which IDs have equivalents on the other side
  const hasEquivalentOnOppositeSide = {};
  wordIds.forEach(id => {
    hasEquivalentOnOppositeSide[id] = {
      left: leftWords.some(word => word.getAttribute('data-word-id').split('_').includes(id)),
      right: rightWords.some(word => word.getAttribute('data-word-id').split('_').includes(id)),
    };
  });

  // Highlight left
  leftWords.forEach(word => {
    const wordDataIds = word.getAttribute('data-word-id').split('_');
    if (wordDataIds.some(id => wordIds.has(id))) {
      const hasEquivalent = wordDataIds.some(id => hasEquivalentOnOppositeSide[id]?.right);
      word.classList.add(hasEquivalent ? 'highlight' : 'unnumbered-highlight');
    }
  });

  // Highlight right
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

  requestAnimationFrame(() => {
    resetAllRowHeights();   // 🧹 Clear out any leftover styling
    alignTableRows();       // 📐 Now recalculate cleanly
  });

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

  // Wait for layout to settle, then reset heights
  requestAnimationFrame(() => {
    resetAllRowHeights();
  });

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
    localStorage.setItem('rightLanguage', currentLeftLanguage);
  } else {
    // Otherwise, update the footer and right language normally
    rightLanguageSelector.value = selectedFooterLanguage;
    localStorage.setItem('rightLanguage', selectedFooterLanguage);
  }

  // Update text and equivalencies for all affected sides
  updateText('left');
  updateWordEquivalenciesForSelectedLanguages();

  // Update mini-dictionary content if a word is highlighted
  if (highlightedWordId) {
    displayEquivalentWordInFooter(highlightedWordId);
  }
});

function displayEquivalentWordInFooter(wordId) {
  const selectedFooterLang = document.getElementById('rightLanguageSelector').value; // force use right
  console.log("Selected language for mini-dictionary:", selectedFooterLang);

  // If no wordId is provided (unnumbered word), display "..."
  if (!wordId) {
    footerContent.textContent = '...';
    return;
  }

  // Split multi-ID string (like "9_10") into individual IDs
  const ids = wordId.split('_');

  // Collect words for each ID in the selected language
  let wordsSeen = new Set();
  let wordsToDisplay = ids
    .map(id => {
      const equivalentWords = wordEquivalencies[id];
      if (equivalentWords) {
        return (equivalentWords[selectedFooterLang] || []);
      }
      return [];
    })
    .flat()
    .filter(word => {
      if (wordsSeen.has(word)) return false;
      wordsSeen.add(word);
      return true;
    })
    .join(' ');

  // Remove punctuation from the concatenated phrase
  wordsToDisplay = wordsToDisplay.replace(/[.,\/#!$%\^&\*;:{}=\«»_`~()。]/g, "");

  // Apply space removal for Asian languages
  if (['ja', 'zh-TW', 'zh-CN'].includes(selectedFooterLang)) {
    wordsToDisplay = removeSpacesForAsianLanguages(wordsToDisplay, selectedFooterLang);
  }

  footerContent.textContent = wordsToDisplay || '...'; // Display the concatenated phrase or placeholder
}

import { startBilingualGame } from './game-bilingual.js';
import { startMonolingualGame } from './game-monolingual.js';

document.addEventListener('DOMContentLoaded', () => {
  const startGameBtn = document.getElementById('startGameBtn');
  const gameModeSelector = document.getElementById('gameModeSelector');

  if (startGameBtn && gameModeSelector) {
    startGameBtn.addEventListener('click', () => {
      const selectedMode = gameModeSelector.value;

      if (selectedMode === 'bilingual') {
        window.startBilingualGame();
      } else if (selectedMode === 'monolingual') {
        window.startMonolingualGame();
      }
    });
  }
});

document.querySelector('.main-content').addEventListener('click', (event) => {
  // Ignore clicks on word spans
  const isWordSpan = event.target.classList.contains('clickable-word') || event.target.classList.contains('unnumbered-word');

  // Ignore clicks on header or footer by checking if they are outside .main-content
  const isInHeader = event.target.closest('header');
  const isInFooter = event.target.closest('#footerDictionary');

  if (!isWordSpan && !isInHeader && !isInFooter) {
    clearHighlights();
    clearSelectedWordOnBothSides();
    highlightedWordId = null;
    displayEquivalentWordInFooter(null);
  }
});

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    applySoftHyphensIfWrapped('#leftTitle');
    applySoftHyphensIfWrapped('#rightTitle');
  }, 100);
});
