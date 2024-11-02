document.addEventListener('DOMContentLoaded', function () {
  const loadContent = () => {
    const uiLanguage = localStorage.getItem('uiLanguage') || 'en'; // Default to English if not set

    fetch('data/texts.json')
      .then(response => response.json())
      .then(data => {
        const textList = document.getElementById('textList');
        textList.classList.add('common-text');
        textList.innerHTML = ''; // Clear existing content

        // Group texts by author with language consideration
        const textsByAuthor = {};
        data.texts.forEach(text => {
          const author = text.author[uiLanguage] || text.author['en']; // Fallback to English if translation not available
          if (!textsByAuthor[author]) {
            textsByAuthor[author] = [];
          }
          textsByAuthor[author].push(text);
        });

        // Create and display the text list with headers
        Object.keys(textsByAuthor).forEach(author => {
          // Create a header for each author
          const authorHeader = document.createElement('h2');
          authorHeader.textContent = author;
          authorHeader.classList.add('author-header');
          textList.appendChild(authorHeader);

          // List texts under the header
          textsByAuthor[author].forEach(text => {
            const textItem = document.createElement('div');
            textItem.classList.add('text-item');

            const link = document.createElement('a');
            link.href = `reader.html?text=${encodeURIComponent(text.jsonFile)}`;
            link.textContent = text.title[uiLanguage] || text.title['en']; // Fallback to English

            const description = document.createElement('p');
            description.classList.add('description');
            description.textContent = text.description[uiLanguage] || text.description['en']; // Fallback to English

            textItem.appendChild(link);
            textItem.appendChild(description);
            textList.appendChild(textItem);
          });
        });
      })
      .catch(error => console.error('Error loading texts:', error));
  };

  // Initial content load
  loadContent();

  // Listen for custom event to detect local storage change in the same tab
  window.addEventListener('languageChanged', loadContent);
});
