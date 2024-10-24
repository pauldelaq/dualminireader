document.addEventListener('DOMContentLoaded', function () {
    // Fetch the JSON file with the text links
    fetch('data/texts.json')
      .then(response => response.json())
      .then(data => {
        const textList = document.getElementById('textList');
        data.texts.forEach(text => {
          // Create a container for each text
          const textItem = document.createElement('div');
          textItem.classList.add('text-item');
  
          // Create the link to reader.html with a query parameter for the JSON file
          const link = document.createElement('a');
          link.href = `reader.html?text=${encodeURIComponent(text.jsonFile)}`;
          link.textContent = text.title;
  
          // Add a description
          const description = document.createElement('p');
          description.textContent = text.description;
  
          // Append the link and description to the textItem
          textItem.appendChild(link);
          textItem.appendChild(description);
  
          // Append the textItem to the main text list container
          textList.appendChild(textItem);
        });
      })
      .catch(error => console.error('Error loading texts:', error));
  });
  