
import { showToast, Login, register, logout, checkAuthStatus, forgotPassword, resendVerification } from '../../common/main/main.js';
import { Cart } from './cart.js';

let currentUser = null;
let notifData = [];
let sidebarCollapsed = false;

// ════════════════════════════════════════════
// CART
// ════════════════════════════════════════════
function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (!sidebar) return;
  sidebar.classList.add('show');
  document.getElementById('cartOverlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderCart();
  updateCartBadge();
}

function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('show');
  document.getElementById('cartOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

async function addToCart(product) {
  const id = product?.id || product;
  if (!id) return;
  const result = await Cart.add(product);
  if (result?.status === 'duplicate') {
    showToast('⚠️ This product is already in your cart');
  } else if (result?.status === 'success') {
    showToast('✓ Produk ditambahkan ke keranjang');
  }
  updateCartBadge();
  if (document.getElementById('cartBody')) renderCart();
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

function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

async function renderCart() {
  const body = document.getElementById('cartBody');
  if (!body) return;
  const items = await Cart.getAll();
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

  body.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-icon">${'📦'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name || 'Product'}</div>
        <div class="cart-item-price">${formatRp(item.price || 0)}</div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  totalEl.textContent = formatRp(total);
  checkoutBtn.disabled = false;
}

// ════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════
async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications', { credentials: 'include' });
    if (res.status === 404) return;
    if (!res.ok) { renderNotifications(); return; }
    const result = await res.json();
    if (result.status === 'success' && Array.isArray(result?.notifications)) {
      const fresh = result.notifications.map(n => ({
        id: n.id,
        icon: n.icon || '🔔',
        title: n.message,
        time: n.time || 'Just now',
        read: n.isRead === true,
        action_url: n.actionUrl
      }));
      const locallyReadIds = new Set(notifData.filter(n => n.read).map(n => n.id));
      notifData = fresh.map(n =>
        locallyReadIds.has(n.id) ? { ...n, read: true } : n
      );
    }
  } catch (e) {
  }
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  const unread = notifData.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
  if (!list) return;

  list.innerHTML = notifData.map(n => `
    <div class="notif-item" data-id="${n.id}" data-url="${n.action_url || ''}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-text">
        <div class="notif-title" style="${n.read ? 'color:var(--text2);font-weight:400' : ''}">${n.title}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>
  `).join('');
}

async function markRead(id) {
  const n = notifData.find(item => item.id === id);
  if (!n || n.read) return;
  n.read = true;
  renderNotifications();
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
  } catch (e) {
    n.read = false;
    renderNotifications();
  }
}

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
      <button class="dropdown-item" data-action="profile">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        My Profile
      </button>
      <button class="dropdown-item" data-action="purchases">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        Pembelian Saya
      </button>
      <button class="dropdown-item" data-action="settings">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        Pengaturan
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item danger" data-action="logout">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar
      </button>`;
  } else {
    avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    content.innerHTML = `
      <div class="dropdown-header">AKUN</div>
      <button class="dropdown-item" data-action="login">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Masuk
      </button>
      <button class="dropdown-item" data-action="register">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Daftar
      </button>`;
  }
}

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
function openAuthModal(tab = 'login') {
  closeAllDropdowns();
  const overlay = document.getElementById('authModalOverlay');
  if (!overlay) { window.location.href = '/'; return; }
  switchTab(tab);
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const verifyForm = document.getElementById('verifyEmailForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  [loginForm, registerForm, forgotForm, verifyForm].forEach(el => { if (el) el.style.display = 'none'; });

  if (tab === 'forgot') {
    if (tabLogin) tabLogin.style.display = 'none';
    if (tabRegister) tabRegister.style.display = 'none';
    if (forgotForm) forgotForm.style.display = '';
    return;
  }

  if (tab === 'verify') {
    if (tabLogin) tabLogin.style.display = 'none';
    if (tabRegister) tabRegister.style.display = 'none';
    if (verifyForm) verifyForm.style.display = '';
    return;
  }

  if (tabLogin) tabLogin.style.display = '';
  if (tabRegister) tabRegister.style.display = '';
  if (loginForm) loginForm.style.display = tab === 'login' ? '' : 'none';
  if (registerForm) registerForm.style.display = tab === 'register' ? '' : 'none';
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabRegister) tabRegister.classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  try {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) { showToast('⚠️ Fill all the fields'); return; }

    const result = await Login(email, pass);
    if (result.status === "success") {
      localStorage['username'] = result.data.user.username;
      localStorage['email'] = result.data.user.email;
      currentUser = { name: localStorage['username'], email: localStorage['email'] };
      Cart.setLoggedIn(true);
      await Cart.sync();
      await updateCartBadge();
      await renderCart();
      closeAuthModal();
      renderProfileDropdown();
      showToast(`👋 Welcome, ${currentUser.name}!`);
    } else if (result.canResend) {
      document.getElementById('verifyEmailAddr').textContent = email;
      switchTab('verify');
    } else {
      showToast(result.message);
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('⚠️ An unexpected error occurred');
  }
}

async function handleRegister() {
  try {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
    const terms = document.getElementById('regTerms').checked;

    const result = await register(username, email, password, confirmPass, terms);
    if (result.status === "success") {
      document.getElementById('verifyEmailAddr').textContent = email;
      switchTab('verify');
      showToast('Check your email for verification link');
    } else {
      showToast(result.message);
    }
  } catch (err) {
    console.error('Register error:', err);
    showToast('⚠️ An unexpected error occurred');
  }
}

async function handleForgotPassword() {
  try {
    const email = document.getElementById('forgotEmail')?.value.trim();
    if (!email) { showToast('⚠️ Enter your email address'); return; }

    const btn = document.getElementById('btnAuthForgot');
    const originalText = 'Send Reset Link';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Sending...';

    const result = await forgotPassword(email);
    if (result.status === "success") {
      showToast('✓ Reset link sent — check your email');
      switchTab('login');
      document.getElementById('forgotEmail').value = '';
    } else {
      showToast(result.message);
    }

    btn.disabled = false;
    btn.textContent = originalText;
  } catch (err) {
    console.error('Forgot password error:', err);
    showToast('⚠️ An unexpected error occurred');
    const btn = document.getElementById('btnAuthForgot');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
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

// ════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════
function initSidebarActive() {
  const path = window.location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('#sidebar .nav-item[data-section]').forEach(btn => {
    btn.classList.toggle('active', path === '/' + btn.dataset.section);
  });
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
async function initNavbar() {
  loadNotifications();

  Cart.onDuplicate(() => {
    showToast('⚠️ This product is already in your cart');
  });

  try {
    const user = await checkAuthStatus();
    if (user) {
      currentUser = { name: user.username, email: user.email };
      Cart.setLoggedIn(true);
      Cart.onSessionExpired(handleSessionExpired);
    }
  } catch (err) {}

  renderProfileDropdown();
  updateCartBadge();
  initSidebarActive();
}

// Auto-init — runs after DOM is parsed (module scripts are deferred by default)
initNavbar();

// ════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════

// Cart
document.getElementById('cartBtn')?.addEventListener('click', openCart);
document.getElementById('cartClose')?.addEventListener('click', closeCart);
document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
  closeCart();
  window.location.href = '/checkout';
});

// Cart body — event delegation for remove buttons
document.getElementById('cartBody')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.cart-item-remove');
  if (btn) removeFromCart(btn.dataset.id);
});

// Notifications
document.getElementById('notifBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('notifDropdown');
  const isOpen = dropdown?.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) dropdown?.classList.add('show');
  loadNotifications();
});

document.getElementById('markAllRead')?.addEventListener('click', async () => {
  notifData.forEach(n => n.read = true);
  renderNotifications();
  try {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH', credentials: 'include'
    });
    if (!res.ok) throw new Error('Server error');
    showToast('✓ Semua notifikasi sudah dibaca');
  } catch (e) {
    notifData.forEach(n => n.read = false);
    renderNotifications();
    showToast('⚠️ Gagal menyimpan', 'error');
  }
});

// Notif list — event delegation for mark read
document.getElementById('notifList')?.addEventListener('click', async (e) => {
  const item = e.target.closest('.notif-item');
  if (!item) return;
  const id = parseInt(item.dataset.id);
  const n = notifData.find(x => x.id === id);
  if (!n || n.read) return;
  n.read = true;
  renderNotifications();
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
  } catch (err) {
    n.read = false;
    renderNotifications();
  }
  if (item.dataset.url) window.location.href = item.dataset.url;
});

// Profile dropdown
document.getElementById('profileBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  renderProfileDropdown();
  toggleDropdown(document.getElementById('profileBtn'), document.getElementById('profileDropdown'));
});

document.getElementById('profileDropdownContent')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.dropdown-item');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'profile') window.location.href = '/profile';
  else if (action === 'purchases') window.location.href = '/profile/purchases';
  else if (action === 'settings') window.location.href = '/profile/settings';
  else if (action === 'logout') handleLogout();
  else if (action === 'login') openAuthModal('login');
  else if (action === 'register') openAuthModal('register');
});

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  const notifBtn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown && !dropdown.contains(e.target) && e.target !== notifBtn) {
    dropdown.classList.remove('show');
  }
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileBtn) {
    profileDropdown.classList.remove('show');
    profileBtn?.classList.remove('active');
  }
});

// Auth modal
document.getElementById('authModalClose')?.addEventListener('click', closeAuthModal);
document.getElementById('authModalOverlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
});

document.getElementById('tabLogin')?.addEventListener('click', () => switchTab('login'));
document.getElementById('tabRegister')?.addEventListener('click', () => switchTab('register'));
document.getElementById('btnAuthLogin')?.addEventListener('click', handleLogin);
document.getElementById('btnAuthRegister')?.addEventListener('click', handleRegister);
document.getElementById('forgotPasswordLink')?.addEventListener('click', () => switchTab('forgot'));
document.getElementById('backToLogin')?.addEventListener('click', () => switchTab('login'));
document.getElementById('backToLoginVerify')?.addEventListener('click', () => switchTab('login'));
document.getElementById('btnResendVerification')?.addEventListener('click', async () => {
  const email = document.getElementById('verifyEmailAddr').textContent;
  const btn = document.getElementById('btnResendVerification');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  const result = await resendVerification(email);
  btn.disabled = false;
  btn.textContent = 'Resend Verification';
  showToast(result.message);
});
document.getElementById('btnAuthForgot')?.addEventListener('click', handleForgotPassword);

document.querySelectorAll('[data-switch-tab]').forEach(el => {
  el.addEventListener('click', () => switchTab(el.dataset.switchTab));
});

// Hamburger / mobile sidebar
document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', !isOpen);
  if (overlay) {
    overlay.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) overlay.style.opacity = 1; else overlay.style.opacity = 0;
  }
});

document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.style.display = 'none';
});

// Profile sidebar — event delegation for section nav & logout
document.getElementById('sidebar')?.addEventListener('click', (e) => {
  const item = e.target.closest('[data-section]');
  if (item) {
    window.location.href = '/' + item.dataset.section;
    return;
  }
  const logoutBtn = e.target.closest('[data-action="logout"]');
  if (logoutBtn) {
    handleLogout();
  }
});

document.querySelector('.sidebar-toggle')?.addEventListener('click', (e) => {
  e.preventDefault();
  const s = document.getElementById('sidebar');
  const m = document.getElementById('main');
  if (!s) return;
  sidebarCollapsed = !sidebarCollapsed;
  s.classList.toggle('collapsed', sidebarCollapsed);
  m?.classList.toggle('collapsed', sidebarCollapsed);
});

// ════════════════════════════════════════════
// UPDATE CURRENT USER (called externally after profile save)
// ════════════════════════════════════════════
function updateCurrentUser(name, email) {
  currentUser = { name, email };
  renderProfileDropdown();
}

// ════════════════════════════════════════════
// EXPORTS (consumed by products.js, landing.js)
// ════════════════════════════════════════════
export { addToCart };

// ════════════════════════════════════════════
// GLOBAL — for profile.js classic script
// ════════════════════════════════════════════
window.updateCurrentUser = updateCurrentUser;
