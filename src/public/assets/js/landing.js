
// ════════════════════════════════════════════
// IMPORT MODULE
// ════════════════════════════════════════════

import { 
  showToast,
  Login, 
  register,
  logout,
  checkAuthStatus
} from '../../common/main/main.js';


// ════════════════════════════════════════════
// DATA & STATE
// ════════════════════════════════════════════

// const NOTIFICATIONS = [
//   { id: 1, icon: '🎉', title: 'Produk baru tersedia: Framer Kit 2025', time: '2 menit lalu', read: false },
//   { id: 2, icon: '💸', title: 'Flash Sale dimulai! Diskon hingga 70%', time: '1 jam lalu', read: false },
//   { id: 3, icon: '⭐', title: 'Review produk Anda telah dibalas', time: '3 jam lalu', read: false },
//   { id: 4, icon: '📦', title: 'Pembelian Anda berhasil diproses', time: '1 hari lalu', read: true },
//   { id: 5, icon: '🔔', title: 'Produk wishlist tersedia kembali', time: '2 hari lalu', read: true },
// ];

let currentProduct = null;
let currentUser = null;
let activeCategory = 'all';
let notifData = [];
let PRODUCTS_DATA = [];

// Compatibility shim for older calls to stopPropagations without an event
function stopPropagations() {
  if (arguments.length > 0 && arguments[0] && typeof arguments[0].stopPropagation === 'function') {
    arguments[0].stopPropagation();
  }
}

// Fetch latest notifications from API (if available) 
async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications', { credentials: 'include' });
    if (res.status === 404) return;
    if (!res.ok) { renderNotifications(); return; }
    const result = await res.json();
    if (result.status === 'success' && Array.isArray(result?.notifications)) {
      notifData = result.notifications.map(n => ({
        id: n.id,
        icon: n.icon || '🔔',
        title: n.message,
        time: n.time || 'Just now',
        read: n.is_read === 'read',
        action_url: n.action_url
      }));
    }
  } catch (e) {
    // ignore; keep existing NOTIFICATIONS
  }
  renderNotifications();
}


// ════════════════════════════════════════════
// FETCH / RENDER PRODUCTS
// ════════════════════════════════════════════
async function fetchProducts(category = 'all') {
  const grid = document.getElementById('productGrid');

  // 🔹 Skeleton loading
  grid.innerHTML = Array(6).fill(`
    <div class="skeleton">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w40"></div>
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
      </div>
    </div>
  `).join('');

  try {
    //  FETCH DATA DARI API
    const res = await fetch('/api/product');
    if (!res.ok) {
      throw new Error('Gagal fetch data');
    }

    const json = await res.json();

    // HANDLE STRUKTUR RESPONSE (AMAN)
    const data = json.data || json;
    PRODUCTS_DATA = data;
    // kalau API kamu { data: [...] } → pakai json.data
    // kalau langsung array → pakai json

    //  FILTER CATEGORY
    const filtered = category === 'all'
      ? data
      : data.filter(p => p.category === category);

    //  SEARCH
    const searchVal = document
      .getElementById('searchInput')
      .value.toLowerCase();

    const results = searchVal
      ? filtered.filter(p =>
        (p.name || '').toLowerCase().includes(searchVal) ||
        (p.desc || '').toLowerCase().includes(searchVal) ||
        (p.tags || []).some(t =>
          t.toLowerCase().includes(searchVal)
        )
      )
      : filtered;

    //  EMPTY STATE
    if (results.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;">
          <div style="font-size:40px;">🔍</div>
          <div>Produk tidak ditemukan</div>
        </div>
      `;
      return;
    }

    //  RENDER
    grid.innerHTML = results.map((p, i) => `
      <div class="product-card"
           style="animation-delay:${i * 50}ms">

        <div class="product-thumb" onclick="openProductModal(${p.id})">
          <span class="product-thumb-emoji">📦</span>
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        </div>

        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name" onclick="openProductModal(${p.id})">${p.name}</div>
          <div class="product-desc">${p.desc || ''}</div>

          <div class="product-footer">
            <div>
              ${p.oldPrice ? `<span class="product-price-old">${formatRp(p.oldPrice)}</span>` : ''}
              <span class="product-price">${formatRp(p.price)}</span>
            </div>

            <button class="product-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.warn('Failed to fetch products — backend may not be running');

    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3);">
        <div style="font-size:40px;">⚠️</div>
        <div>Failed to load products</div>
        <div style="font-size:12px;margin-top:8px;">Please ensure the API server is running</div>
      </div>
    `;
  }
}

// ════════════════════════════════════════════
// PRODUCT MODAL
// ════════════════════════════════════════════
function openProductModal(id) {
  const p = PRODUCTS_DATA.find(x => x.id == id);
  if (!p) return;
  currentProduct = p;

  document.getElementById('modalEmoji').textContent = p.emoji;
  document.getElementById('modalCategory').textContent = p.category.toUpperCase();
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalRating').innerHTML = `<span class="star">★★★★★</span> ${p.rating} · ${p.reviews} ulasan`;
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalTags').innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modalPriceOld').textContent = p.oldPrice ? formatRp(p.oldPrice) : '';
  document.getElementById('modalPrice').textContent = formatRp(p.price);

  document.getElementById('productModalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('productModalClose').onclick = closeProductModal;
document.getElementById('productModalOverlay').onclick = (e) => {
  if (e.target === document.getElementById('productModalOverlay')) closeProductModal();
};

document.getElementById('modalAddCart').onclick = () => {
  if (!currentProduct) return;
  addToCart(currentProduct);
  closeProductModal();
};

document.getElementById('modalBuyNow').onclick = async () => {
  if (!currentProduct) return;
  await addToCart(currentProduct);
  closeProductModal();
  window.location.href = '/checkout';
};

// ════════════════════════════════════════════
// CART
// ════════════════════════════════════════════
function openCart() {
  document.getElementById('cartSidebar').classList.add('show');
  document.getElementById('cartOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  renderCart();
  updateCartBadge();
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('show');
  document.getElementById('cartOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('cartBtn').onclick = openCart;
document.getElementById('cartClose').onclick = closeCart;
document.getElementById('cartOverlay').onclick = closeCart;

// ════════════════════════════════════════════
// CART INTEGRATION
// ════════════════════════════════════════════

async function addToCart(product) {
  const id = product?.id || product;
  if (!id) return;

  const result = await Cart.add(id);
  
  if (result?.status === 'duplicate') {
    showToast('⚠️ This product is already in your cart');
  } else if (result?.status === 'success') {
    showToast('✓ Produk ditambahkan ke keranjang');
  }
  
  updateCartBadge();
  renderCart();
}

async function removeFromCart(id) {
  await Cart.remove(id);
  updateCartBadge();
  renderCart();
}

async function updateCartBadge() {
  const items = await Cart.getAll();
  const badge = document.getElementById('cartBadge');
  if (items.length > 0) {
    badge.textContent = items.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function renderCart() {
  const items = await Cart.getAll();
  const body = document.getElementById('cartBody');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (items.length === 0) {
    body.innerHTML = `<div class="cart-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <div>Your cart is empty</div>
      <div style="font-size:12px;color:var(--text3)">Add products you like</div>
    </div>`;
    totalEl.textContent = 'Rp 0';
    checkoutBtn.disabled = true;
    return;
  }

  body.innerHTML = items.map(item => {
    const product = PRODUCTS_DATA.find(p => p.id == item.id);
    const name = product ? product.name : (item.name || 'Product');
    const price = product ? product.price : (item.price || 0);
    return `
      <div class="cart-item">
        <div class="cart-item-icon">${'📦'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${name}</div>
          <div class="cart-item-price">${formatRp(price)}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
  }).join('');

  const total = items.reduce((sum, item) => {
    const product = PRODUCTS_DATA.find(p => p.id == item.id);
    const price = product ? product.price : (item.price || 0);
    return sum + price;
  }, 0);
  totalEl.textContent = formatRp(total);
  checkoutBtn.disabled = false;
}

document.getElementById('checkoutBtn').onclick = () => {
  closeCart();
  window.location.href = '/checkout';
};

// ════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════
function renderNotifications() {
  const list = document.getElementById('notifList');
  const unread = notifData.filter(n => !n.read).length;
  document.getElementById('notifBadge').textContent = unread;
  document.getElementById('notifBadge').style.display = unread > 0 ? 'flex' : 'none';

  list.innerHTML = notifData.map(n => `
    <div class="notif-item" onclick="markRead(${n.id})${n.action_url ? `;window.location.href='${n.action_url}'` : ''}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-text">
        <div class="notif-title" style="${n.read ? 'color:var(--text2);font-weight:400' : ''}">${n.title}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>`).join('');
}

async function markRead(id) {
  notifData = notifData.map(n => n.id === id ? { ...n, read: true } : n);
  renderNotifications();
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
  } catch (e) {}
}

document.getElementById('markAllRead').onclick = async () => {
  notifData = notifData.map(n => ({ ...n, read: true }));
  renderNotifications();
  try {
    await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
  } catch (e) {}
  showToast('✓ All notifications read');
};

// ════════════════════════════════════════════
// PROFILE DROPDOWN
// ════════════════════════════════════════════
function renderProfileDropdown() {
  const content = document.getElementById('profileDropdownContent');
  const avatar = document.getElementById('profileAvatar');

  if (currentUser) {
    avatar.innerHTML = `<span style="font-size:13px;font-weight:700;color:var(--text)">${currentUser.name.charAt(0).toUpperCase()}</span>`;
    content.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px">${currentUser.name}</div>
        <div style="font-size:12px;color:var(--text3)">${currentUser.email}</div>
      </div>
      <button class="dropdown-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        My Profile
      </button>
      <button class="dropdown-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        Pembelian Saya
      </button>
      <button class="dropdown-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        Pengaturan
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item danger" onclick="handleLogout()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar
      </button>`;
  } else {
    avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    content.innerHTML = `
      <div class="dropdown-header">AKUN</div>
      <button class="dropdown-item" onclick="openAuthModal('login')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Masuk
      </button>
      <button class="dropdown-item" onclick="openAuthModal('register')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Daftar
      </button>`;
  }
}

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
function openAuthModal(tab = 'login') {
  const isMobile = window.innerWidth <= 900;
  closeAllDropdowns();
  if (isMobile) {
    window.location.href = tab === 'login' ? '/login' : '/register';
    return;
  }
  switchTab(tab);
  document.getElementById('authModalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('authModalClose').onclick = closeAuthModal;
document.getElementById('authModalOverlay').onclick = (e) => {
  if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
};

function switchTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) { showToast('⚠️ Fill all the fields'); return; }

  const result = await Login(email, pass);
  if (result.status === "success") {
    localStorage['username'] = result.data.user.username;
    localStorage['email'] = result.data.user.email;
    currentUser = { name: localStorage['username'], email: localStorage['email'] };
    
    Cart.setLoggedIn(true);
    await Cart.sync(); // Sync guest cart to backend
    await updateCartBadge();
    await renderCart(); // Show the synced cart
    
    closeAuthModal();
    renderProfileDropdown();
    showToast(`👋 Welcome, ${currentUser.name}!`);
  } else { 
    showToast(result.message);
  }
}

async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPass = document.getElementById('regConfirmPassword').value;
  const terms = document.getElementById('regTerms').checked;

  const result = await register(username, email, password, confirmPass, terms);
  if (result.status === "success") {
    closeAuthModal();
    const result = await Login(email, password); 
    if (result.status == "success") {
      localStorage['username'] = result.data.user.username;
      localStorage['email'] = result.data.user.email;
      currentUser = { name: localStorage['username'], email: localStorage['email'] };
      
      Cart.setLoggedIn(true);
      await Cart.sync(); // Sync guest cart to backend
      await updateCartBadge();
      await renderCart();
    }
    renderProfileDropdown();
    showToast(result.message);
  } else {
    showToast(result.message);
  }

}

async function handleLogout() {
  await logout();
  currentUser = null;
  Cart.setLoggedIn(false);
  closeAllDropdowns();
  renderProfileDropdown();
  updateCartBadge();
}

/**
 * Handle auto-logout when token expires during browsing.
 * Clears all state and switches to guest mode.
 */
function handleSessionExpired() {
  currentUser = null;
  Cart.setLoggedIn(false);
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  closeAllDropdowns();
  renderProfileDropdown();
  updateCartBadge();
  showToast('⚠️ Session expired, please login again');
}

/**
 * Wrapper for authenticated fetch calls.
 * Auto-triggers session expiry handling on 401/403.
 */
async function authFetch(url, options = {}) {
  options.credentials = options.credentials || 'include';
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    handleSessionExpired();
    return null;
  }
  return res;
}

// ════════════════════════════════════════════
// DROPDOWN TOGGLE
// ════════════════════════════════════════════
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}

function toggleDropdown(btn, dropdown) {
  const wasOpen = dropdown.classList.contains('show');
  closeAllDropdowns();
  if (!wasOpen) {
    dropdown.classList.add('show');
    btn.classList.add('active');
  }
}

document.getElementById('notifBtn').onclick = (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('notifDropdown');
  const isOpen = dropdown?.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) {
    dropdown?.classList.add('show');
  }
  loadNotifications();
};

document.getElementById('profileBtn').onclick = (e) => {
  e.stopPropagation();
  renderProfileDropdown();
  toggleDropdown(document.getElementById('profileBtn'), document.getElementById('profileDropdown'));
};

document.addEventListener('click', (e) => {
  // Close notification dropdown when clicking outside
  const notifBtn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown && !dropdown.contains(e.target) && e.target !== notifBtn) {
    dropdown.classList.remove('show');
  }
});

// ════════════════════════════════════════════
// SIDEBAR (MOBILE)
// ════════════════════════════════════════════
document.getElementById('hamburgerBtn').onclick = () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', !isOpen);
  overlay.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) overlay.style.opacity = 1; else overlay.style.opacity = 0;
};

document.getElementById('sidebarOverlay').onclick = () => {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').style.display = 'none';
};

// ════════════════════════════════════════════
// FILTER
// ════════════════════════════════════════════
document.querySelectorAll('.filter-pill, .sidebar-link[data-cat]').forEach(el => {
  el.addEventListener('click', () => {
    const cat = el.dataset.cat;
    activeCategory = cat;

    // Update pills
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
    // Update sidebar links
    document.querySelectorAll('.sidebar-link[data-cat]').forEach(l => l.classList.toggle('active', l.dataset.cat === cat));

    fetchProducts(cat);

    // Close mobile sidebar
    if (window.innerWidth <= 900) {
      document.getElementById('sidebar').classList.remove('mobile-open');
      document.getElementById('sidebarOverlay').style.display = 'none';
    }
  });
});

// ════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchProducts(activeCategory), 400);
});

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

function animateCount(el, target, suffix = '') {
  let start = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start.toLocaleString('id-ID') + suffix;
    if (start >= target) clearInterval(timer);
  }, 20);
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  fetchProducts('all');
  loadNotifications();

  // Set up global cart event handlers
  Cart.onDuplicate(() => {
    showToast('⚠️ This product is already in your cart');
  });

  // Check if user is still authenticated (auto-clears localStorage if token expired)
  try {
    const user = await checkAuthStatus();
    if (user) {
      currentUser = { name: user.username, email: user.email };
      Cart.setLoggedIn(true);
      Cart.onSessionExpired(handleSessionExpired);
    }
  } catch (err) {
    // Backend not reachable — stay as guest
  }

  renderProfileDropdown();
  updateCartBadge();

  // Animate stats
  setTimeout(() => {
    animateCount(document.getElementById('stat1'), 2400, '+');
    animateCount(document.getElementById('stat2'), 18500, '+');
    animateCount(document.getElementById('stat3'), 340, '+');
  }, 300);
});

// ════════════════════════════════════════════
// EXPOSE TO GLOBAL SCOPE (needed for inline onclick in HTML)
// ════════════════════════════════════════════
window.openProductModal = openProductModal;
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.openAuthModal = openAuthModal;
window.markRead = markRead;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.handleSessionExpired = handleSessionExpired;

