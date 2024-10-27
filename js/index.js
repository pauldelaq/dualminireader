document.addEventListener('DOMContentLoaded', function () {
  fetch('data/texts.json')
    .then(response => response.json())
    .then(data => {
      const textList = document.getElementById('textList');
      textList.classList.add('common-text');

      data.texts.forEach(text => {
        const textItem = document.createElement('div');
        textItem.classList.add('text-item');

        const link = document.createElement('a');
        link.href = `reader.html?text=${encodeURIComponent(text.jsonFile)}`;
        link.textContent = text.title;

        const description = document.createElement('p');
        description.classList.add('description'); // Ensures consistency
        description.textContent = text.description;

        textItem.appendChild(link);
        textItem.appendChild(description);
        textList.appendChild(textItem);
      });
    })
    .catch(error => console.error('Error loading texts:', error));
});
