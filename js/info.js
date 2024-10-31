document.addEventListener('DOMContentLoaded', () => {
    loadContent();

    // Listen for the languageChanged event to reload content instantly
    window.addEventListener('languageChanged', loadContent);

    // Also listen for storage events to handle language changes across tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'uiLanguage') {
            loadContent();
        }
    });
});

function loadContent() {
    fetch('data/info.json')
        .then(response => response.json())
        .then(data => {
            const selectedLanguage = localStorage.getItem('uiLanguage') || 'en';
            const contentArray = data[selectedLanguage].content;

            const contentContainer = document.getElementById('contentContainer');
            contentContainer.innerHTML = contentArray.join('');
        })
        .catch(error => console.error('Error loading content:', error));
}
