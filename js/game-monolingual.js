function adjustMainContentPaddingForFooter() {
  const footer = document.getElementById('footerDictionary');
  const mainContent = document.querySelector('.main-content');

  if (footer && mainContent) {
    const footerHeight = footer.offsetHeight;
    mainContent.style.paddingBottom = `${footerHeight + 20}px`; // add a little buffer
  }
}

export function startMonolingualGame() {
  window.isGameModeActive = true;
  window.gameInProgress = true;

  const settingsButton = document.querySelector('.settings-button');
  if (settingsButton) {
    settingsButton.textContent = '[X]';
    settingsButton.onclick = () => {
      endMonolingualGame();
    };
  }

  // Hide settings menu
  document.body.classList.remove('settings-active');
  document.getElementById('settingsMenu')?.classList.add('hidden');

  // Hide language selectors
  document.getElementById('leftLanguageSelector')?.classList.add('nonvisible');
  document.getElementById('rightLanguageSelector')?.classList.add('nonvisible');

  // Force display mode
  localStorage.setItem('displayMode', 'miniDictionary');
  applyDisplayMode('miniDictionary');

  // Hide default footer stuff
  document.getElementById('footerLanguageSelector')?.classList.add('hidden');
  document.getElementById('footerContent')?.classList.add('nonvisible');

  // Remove leftover classes
  document.querySelectorAll('.highlight, .selected-word').forEach(el => {
    el.classList.remove('highlight', 'selected-word');
  });

  document.getElementById('footerDictionary')?.classList.add('footer-expanded');

  // Adjust for initial render
  setTimeout(adjustMainContentPaddingForFooter, 50);

  // Respond to future resizes
  window.addEventListener('resize', adjustMainContentPaddingForFooter);

  // Get all clickable words on the left side
  const leftWords = Array.from(document.querySelectorAll('#leftTitle .clickable-word, #leftText .clickable-word'));

  // Get unique word IDs
  const uniqueWordIds = [...new Set(leftWords.map(word => word.getAttribute('data-word-id')))];

  // Pick 10 random word IDs
  const targetIds = uniqueWordIds.sort(() => 0.5 - Math.random()).slice(0, 10);

  // Create a Map to track replaced elements so we can restore them later
  const replacedWordMap = new Map();
  window._replacedWordMap = replacedWordMap; // Make it accessible during cleanup

  targetIds.forEach(id => {
    leftWords
      .filter(word => word.getAttribute('data-word-id') === id)
      .forEach(word => {
        word.classList.add('drop-zone', 'hidden-word');
      });
  });

    const footerContent = document.getElementById('footerContent');
    footerContent.innerHTML = ''; // Clear old content

    const draggableWords = targetIds.map(id => {
      const example = leftWords.find(w => w.getAttribute('data-word-id') === id);
      if (!example) return null;

      const span = document.createElement('span');
      span.textContent = example.textContent;
      span.classList.add('draggable-word');
      span.setAttribute('draggable', 'true');
      span.dataset.wordId = id;
      return span;
    }).filter(Boolean);

    // Shuffle before displaying
    draggableWords.sort(() => 0.5 - Math.random());

    // Append to footer
    draggableWords.forEach(span => footerContent.appendChild(span));

    // Unhide the footer area so it's visible
    footerContent.classList.remove('nonvisible');

let currentlySelectedWordId = null;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.querySelectorAll('.draggable-word').forEach(word => {
  const id = word.dataset.wordId;

  if (!isTouchDevice) {
    // ✅ Desktop: native drag
    word.setAttribute('draggable', 'true');
    word.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', id);
    });
  } else {
    // ✅ Mobile: disable native dragging
    word.removeAttribute('draggable');

    let offsetX = 0;
    let offsetY = 0;
    let clone = null;

    word.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      const rect = word.getBoundingClientRect();

      clone = word.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.zIndex = '1000';
      clone.style.opacity = '0.85';
      clone.style.pointerEvents = 'none';
      clone.classList.add('drag-clone');
      document.body.appendChild(clone);

      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;

      currentlySelectedWordId = id;
    });

    word.addEventListener('touchmove', e => {
      if (!clone) return;
      const touch = e.touches[0];
      clone.style.left = (touch.clientX - offsetX) + 'px';
      clone.style.top = (touch.clientY - offsetY) + 'px';

      e.preventDefault(); // Prevent scroll during drag
    });

    word.addEventListener('touchend', e => {
      if (!clone) return;

      const touch = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = dropTarget?.closest('.drop-zone');

      if (dropZone) {
        handleDrop(id, dropZone);
      }

      clone.remove();
      clone = null;
      currentlySelectedWordId = null;
    });
  }

  // Optional: also support tap-to-select + tap-to-drop as fallback
  word.addEventListener('click', () => {
    document.querySelectorAll('.draggable-word').forEach(w => w.classList.remove('active-drag'));
    word.classList.add('active-drag');
    currentlySelectedWordId = id;
  });
});

document.querySelectorAll('.drop-zone').forEach(zone => {
  // ✅ Desktop drop logic
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    handleDrop(draggedId, zone);
  });

  // ✅ Mobile tap-to-drop (optional fallback)
  zone.addEventListener('click', () => {
    if (currentlySelectedWordId) {
      handleDrop(currentlySelectedWordId, zone);
    }
  });
});

function handleDrop(draggedId, zone) {
  const targetId = zone.dataset.wordId;
  const draggedEl = document.querySelector(`.draggable-word[data-word-id="${draggedId}"]`);
  if (!draggedEl) return;

  const draggedText = draggedEl.textContent?.trim();
  const targetText = zone.textContent?.trim();

  const isIdMatch = draggedId === targetId && zone.classList.contains('hidden-word');
  const isTextMatch = draggedText === targetText;

  if (isIdMatch || isTextMatch) {
    zone.classList.remove('hidden-word');
    zone.classList.add('highlight');
    draggedEl.remove();

    currentlySelectedWordId = null;
    document.querySelectorAll('.draggable-word').forEach(w => w.classList.remove('active-drag'));

    const remaining = document.querySelectorAll('.drop-zone.hidden-word');
    if (remaining.length === 0) {
      document.getElementById('footerDictionary')?.classList.add('hidden');
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) {
        pageTitle.dataset.originalText = pageTitle.textContent;
        pageTitle.textContent = '100%!';
      }
    }
  }
}
}

function endMonolingualGame() {
  window.isGameModeActive = false;
  window.gameInProgress = false;

  const settingsButton = document.querySelector('.settings-button');
  if (settingsButton) {
    settingsButton.textContent = '[≡]';
    settingsButton.onclick = null;
  }

  document.getElementById('leftLanguageSelector')?.classList.remove('nonvisible');
  document.getElementById('rightLanguageSelector')?.classList.remove('nonvisible');
  document.getElementById('footerLanguageSelector')?.classList.remove('hidden');

  document.getElementById('footerDictionary')?.classList.remove('footer-expanded');

  const footerContent = document.getElementById('footerContent');
  footerContent?.classList.remove('nonvisible');
  footerContent?.replaceChildren();

  document.querySelectorAll('.hidden-word, .drop-zone, .highlight').forEach(el => {
    el.classList.remove('hidden-word', 'drop-zone', 'highlight');
  });

  window.removeEventListener('resize', adjustMainContentPaddingForFooter);

  // Reset padding
  document.querySelector('.main-content').style.paddingBottom = '90px';

  // ✅ Restore the page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle && pageTitle.dataset.originalText) {
    pageTitle.textContent = pageTitle.dataset.originalText;
    delete pageTitle.dataset.originalText;
  }

  // ✅ Show the footer again
  document.getElementById('footerDictionary')?.classList.remove('hidden');
}

// Let other scripts check game state
export function isGameInProgress() {
  return window.gameInProgress; // reference the correct scope
}

// Ensure these are accessible from settings.js or reader.js (non-module contexts)
window.endMonolingualGame = endMonolingualGame;
window.isGameInProgress = isGameInProgress;
window.startMonolingualGame = startMonolingualGame;
