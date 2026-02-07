// Simple tab switching
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
    // Remove active from all
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.style.display = 'none');

    // Activate clicked
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).style.display = 'block';
    });
});

// Fake save button feedback
document.querySelector('.btn-save')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
});