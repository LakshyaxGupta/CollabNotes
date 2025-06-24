document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('tagSearch');
  const notes = document.querySelectorAll('#filteredNotes > div');

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();

    notes.forEach(note => {
      const tags = note.dataset.tags.toLowerCase();
      note.style.display = tags.includes(searchTerm) ? '' : 'none';
    });
  });
});
