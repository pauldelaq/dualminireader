// index.js

// Function to load and apply the saved font size from localStorage
function loadFontSize() {
  const savedFontSize = localStorage.getItem('fontSize') || 100; // Default to 100 if not set
  const scale = savedFontSize / 100;
  document.documentElement.style.setProperty('--base-font-size', `${scale}em`);
}

document.addEventListener('DOMContentLoaded', function () {
  fetch('data/texts.json')
    .then(response => response.json())
    .then(data => {
      const textList = document.getElementById('textList');
      data.texts.forEach(text => {
        const textItem = document.createElement('div');
        textItem.classList.add('text-item', 'common-text'); // Apply shared class

        const link = document.createElement('a');
        link.href = `reader.html?text=${encodeURIComponent(text.jsonFile)}`;
        link.textContent = text.title;

        const description = document.createElement('p');
        description.textContent = text.description;
        description.classList.add('common-text'); // Apply shared class

        textItem.appendChild(link);
        textItem.appendChild(description);
        textList.appendChild(textItem);
      });
    })
    .catch(error => console.error('Error loading texts:', error));
});
