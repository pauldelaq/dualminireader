let timerInterval = null;
let timeRemaining = 30;
let gameInProgress = false;

export function startBilingualGame() {
  gameInProgress = true;

  const titleElement = document.getElementById('pageTitle');
  const settingsButton = document.querySelector('.settings-button');

  if (titleElement) {
    timeRemaining = 30;
    titleElement.textContent = formatTime(timeRemaining);
  }

  if (settingsButton) {
    settingsButton.textContent = '[X]';
  }

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
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function endBilingualGame() {
  gameInProgress = false;

  const titleElement = document.getElementById('pageTitle');
  if (titleElement) {
    titleElement.textContent = 'DualMiniReader';
  }

  const settingsButton = document.querySelector('.settings-button');
  if (settingsButton) {
    settingsButton.textContent = '[≡]';
  }

  clearInterval(timerInterval);

  document.getElementById('leftLanguageSelector')?.classList.remove('nonvisible');
  document.getElementById('rightLanguageSelector')?.classList.remove('nonvisible');
}

// Let other scripts check game state
export function isGameInProgress() {
  return gameInProgress;
}

// Ensure these are accessible from settings.js (which doesn't use import)
window.startBilingualGame = startBilingualGame;
window.endBilingualGame = endBilingualGame;
window.isGameInProgress = isGameInProgress;
