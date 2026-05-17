
BE_URL = 
function removeWish(btn) {
  const card = btn.closest('.wish-card');
  if (!card) return;
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  card.style.transition = 'all 0.2s';
  setTimeout(() => card.remove(), 200);
  showToast('Removed from wishlist');
}

// Purchase filter — event delegation
document.getElementById('purchaseFilters')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const status = btn.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.order-card').forEach(card => {
    card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
  });
});


// sidebar — set active nav-item on page load based on current URL
// (click handling + navigation is already in navbar.js)
(function initSidebarActive() {
  const path = window.location.pathname.replace(/\/+$/, ''); // trim trailing slash
  document.querySelectorAll('#sidebar .nav-item[data-section]').forEach(btn => {
    const sectionPath = '/' + btn.dataset.section;
    btn.classList.toggle('active', path === sectionPath);
  });
})();


// profile
//data yang di butuh kan :

async function loadProfile() {
  fetch('/api/profile/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.code === 200) {
        document.getElementById('profile').innerHTML = `
          <h1>${data.data.username}</h1>
          <p>${data.data.email}</p>
          <p>${data.data.phone}</p>
          <p>${data.data.role}</p>
        `;
      } else {
        showToast(data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Failed to load profile');
    });
}
// Load data purchases
async function loadPurchases() {
  try {
    const res = await fetch(`/api/purchases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.status === 'success') {
      console.log(data.data);
    } else {
      showToast(data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to load purchases');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // const path = window.location.pathname.replace(/\/+$/, ''); // trim trailing slash
  // const navItems = document.querySelectorAll('#sidebar .nav-item[data-section]');
  // navItems.forEach(item => {
  //   const section = item.getAttribute('data-section');
  //   if (path === `/profile/${section}`) {
  //     item.classList.add('active');
  //   }
  // });
  if (window.location.pathname === '/profile/purchases') {
    // loadProfile();
    loadPurchases();
  }
});