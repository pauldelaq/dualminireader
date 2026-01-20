let timerInterval = null;
let timeRemaining = 30;
let gameInProgress = false;
let currentTargetId = null;
let isWaitingForNextRound = false;
let score = 0;
let wrongAttempts = 0;

export function startBilingualGame(customTime = 30) {
  window.isGameModeActive = true;
  gameInProgress = true;

  score = 0;
  wrongAttempts = 0;

  const titleElement = document.getElementById('pageTitle');
  const settingsButton = document.querySelector('.settings-button');

  if (titleElement) {
    timeRemaining = customTime;
    titleElement.textContent = formatTime(timeRemaining);
  }

  // ✅ Force settings button to act as "end game" during gameplay,
  // and make sure we cleanly restore the original handler when the game ends.
  if (settingsButton) {
    settingsButton.textContent = '[X]';

    // Remove the original settings click handler (installed by settings.js)
    if (window._settingsClickHandler) {
      settingsButton.removeEventListener('click', window._settingsClickHandler);
    }

    // Remove any previous game handler (in case of re-entry)
    if (window._bilingualGameSettingsHandler) {
      settingsButton.removeEventListener('click', window._bilingualGameSettingsHandler);
    }

    // Add a dedicated game handler via addEventListener (avoid mixing with onclick)
    window._bilingualGameSettingsHandler = () => {
      endBilingualGame();
    };

    settingsButton.addEventListener('click', window._bilingualGameSettingsHandler);
  }

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeRemaining--;
    if (titleElement) {
      titleElement.textContent = formatTime(timeRemaining);
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endBilingualGame();
    }
  }, 1000);

  document.getElementById('leftLanguageSelector')?.classList.add('nonvisible');
  document.getElementById('rightLanguageSelector')?.classList.add('nonvisible');

  setupGameClickListeners();
  startNextRound();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function startNextRound() {
  clearHighlights();
  currentTargetId = null;

  const leftWords = Array.from(document.querySelectorAll('#leftTitle .clickable-word, .cell.left-text .clickable-word'));
  const rightWords = Array.from(document.querySelectorAll('#rightTitle .clickable-word, .cell.right-text .clickable-word'));

  const validIds = leftWords
    .map(w => w.getAttribute('data-word-id'))
    .filter(id => rightWords.some(w => w.getAttribute('data-word-id') === id));

  if (validIds.length === 0) return;

  const randomId = validIds[Math.floor(Math.random() * validIds.length)];
  currentTargetId = randomId;

  leftWords
    .filter(w => w.getAttribute('data-word-id') === randomId)
    .forEach(w => {
      w.classList.add('highlight', 'selected-word');
    });
}

function setupGameClickListeners() {
  const rightWords = document.querySelectorAll('#rightTitle .clickable-word, .cell.right-text .clickable-word');

  rightWords.forEach(word => {
    word.addEventListener('click', () => {
      if (!gameInProgress || isWaitingForNextRound || !currentTargetId) return;

      const clickedId = word.getAttribute('data-word-id');

      if (clickedId === currentTargetId) {
      const matchingRightWords = document.querySelectorAll('#rightTitle .clickable-word, .cell.right-text .clickable-word');
        matchingRightWords.forEach(w => {
          if (w.getAttribute('data-word-id') === clickedId) {
            w.classList.add('highlight');
          }
        });

        score++;
        isWaitingForNextRound = true;

        setTimeout(() => {
          isWaitingForNextRound = false;
          startNextRound();
        }, 1000);
      } else {
        word.classList.add('unnumbered-highlight');
        wrongAttempts++;
      }
    });
  });
}

export function endBilingualGame() {
  window.isGameModeActive = false;
  gameInProgress = false;
  clearInterval(timerInterval);
  clearHighlights();

  const titleElement = document.getElementById('pageTitle');
  if (titleElement) {
    titleElement.textContent = `${score} ⎷   ${wrongAttempts} X`; // ✅ Full result
    setTimeout(() => {
      titleElement.textContent = 'DualMiniReader';
    }, 3000);
  }

  const settingsButton = document.querySelector('.settings-button');
  if (settingsButton) {
    // Remove the game-specific handler (if present)
    if (window._bilingualGameSettingsHandler) {
      settingsButton.removeEventListener('click', window._bilingualGameSettingsHandler);
      window._bilingualGameSettingsHandler = null;
    }

    // Restore original settings menu behavior
    settingsButton.textContent = '[≡]';
    settingsButton.onclick = null;

    if (window._settingsClickHandler) {
      // Ensure we don't accidentally stack duplicates
      settingsButton.removeEventListener('click', window._settingsClickHandler);
      settingsButton.addEventListener('click', window._settingsClickHandler);
    }
  }

  document.getElementById('leftLanguageSelector')?.classList.remove('nonvisible');
  document.getElementById('rightLanguageSelector')?.classList.remove('nonvisible');

  currentTargetId = null;
  isWaitingForNextRound = false;
}

function clearHighlights() {
  document.querySelectorAll('.highlight, .unnumbered-highlight, .selected-word').forEach(el => {
    el.classList.remove('highlight', 'unnumbered-highlight', 'selected-word');
  });
}

// Let other scripts check game state
export function isGameInProgress() {
  return gameInProgress;
}

// Ensure these are accessible from settings.js (which doesn't use import)
window.startBilingualGame = startBilingualGame;
window.endBilingualGame = endBilingualGame;
window.isGameInProgress = isGameInProgress;
