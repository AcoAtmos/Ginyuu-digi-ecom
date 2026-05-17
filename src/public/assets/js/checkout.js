// ════════════════════════════════════════════
// CHECKOUT PAGE - Real API Integration
// ════════════════════════════════════════════

import { checkAuthStatus, showToast, logout } from '../../common/main/main.js';
import { Cart } from './cart.js';

let cartItems = [];
let isLoggedIn = false;
let currentUser = null;
let selectedPayment = null;
let promoApplied = null;

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuthStatus();
  if (user) {
    isLoggedIn = true;
    currentUser = user;
    setupLoggedInUI();
    Cart.setLoggedIn(true);
  } else {
    setupGuestUI();
    Cart.setLoggedIn(false);
  }

  await loadCartItems();
  setupPaymentUI();
  setupPromoInput();
  setupSubmitButton();

  // Password strength checker
  const passInput = document.getElementById('password');
  if (passInput) {
    passInput.addEventListener('input', (e) => checkStrength(e.target.value));
  }

  // Event delegation for upsell buttons
  document.getElementById('upsellItems').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-upsell');
    if (!btn) return;
    addUpsellItem(parseInt(btn.dataset.id));
  });
});

// ════════════════════════════════════════════
// AUTH UI
// ════════════════════════════════════════════
function setupLoggedInUI() {
  document.getElementById('loggedBanner').style.display = 'flex';
  document.getElementById('loggedName').textContent = currentUser.username;
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
  document.getElementById('passwordSection').style.display = 'none';
  document.querySelectorAll('.logged-only').forEach(el => el.style.display = 'block');
}

function setupGuestUI() {
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
  document.getElementById('passwordSection').style.display = 'block';
  document.querySelectorAll('.logged-only').forEach(el => el.style.display = 'none');
}

// ════════════════════════════════════════════
// CART
// ════════════════════════════════════════════
async function loadCartItems() {
  cartItems = await Cart.getAll();

  if (cartItems.length === 0) {
    showToast('⚠️ Keranjang kosong, silahkan tambah produk dulu');
    setTimeout(() => { window.location.href = '/'; }, 2000);
    return;
  }

  // For guest: batch-fetch only cart products (not all products)
  if (!isLoggedIn) {
    try {
      const ids = cartItems.map(i => i.id);
      const res = await fetch(`/api/product/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        const json = await res.json();
        const products = json.data || [];
        const enriched = cartItems
          .map(item => {
            const p = products.find(pr => pr.id == item.id);
            return p ? {
              id: p.id,
              name: p.name,
              price: p.price,
              slug: p.slug,
              category: p.category,
              preview: p.preview,
              discount: p.discount,
              tags: p.tags || []
            } : null;
          })
          .filter(Boolean);
        cartItems = enriched;
      }
    } catch (e) {
      console.error('Failed to batch-load products:', e);
    }
  }

  if (cartItems.length === 0) {
    showToast('⚠️ Produk tidak ditemukan');
    setTimeout(() => { window.location.href = '/'; }, 2000);
    return;
  }

  renderCartItems();
  updateSummary();
  loadRecommendations();
}

function renderCartItems() {
  const container = document.getElementById('orderItems');
  document.getElementById('itemCount').textContent = `${cartItems.length} produk`;

  container.innerHTML = cartItems.map(item => `
    <div class="order-item">
      <div class="order-item-icon">📦</div>
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-price">${formatRp(item.price || 0)}</div>
      </div>
    </div>
  `).join('');
}

function updateSummary() {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const discount = promoApplied ? Math.floor(subtotal * promoApplied.discount_pct) : 0;
  const total = subtotal - discount;

  let html = `
    <div class="price-row">
      <span>Subtotal</span>
      <span>${formatRp(subtotal)}</span>
    </div>`;

  if (discount > 0) {
    html += `
      <div class="price-row discount">
        <span>Diskon (${promoApplied.code})</span>
        <span>-${formatRp(discount)}</span>
      </div>`;
  }

  html += `
    <div class="price-row total">
      <span>Total</span>
      <span>${formatRp(total)}</span>
    </div>`;

  document.getElementById('priceRows').innerHTML = html;
}

// ════════════════════════════════════════════
// PAYMENT
// ════════════════════════════════════════════
function setupPaymentUI() {
  document.querySelectorAll('.pm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.querySelectorAll('.payment-sub').forEach(sub => sub.style.display = 'none');

      selectedPayment = btn.dataset.method;
      document.getElementById(`sub-${selectedPayment}`).style.display = 'block';
    });
  });

  document.querySelectorAll('.sub-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const parent = opt.closest('.payment-sub');
      parent.querySelectorAll('.sub-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      selectedPayment = opt.querySelector('input').value;
    });
  });
}

// ════════════════════════════════════════════
// PROMO
// ════════════════════════════════════════════
function setupPromoInput() {
  document.getElementById('promoInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyPromo();
  });
}

async function applyPromo() {
  const code = document.getElementById('promoInput').value.trim();
  if (!code) return;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  try {
    const res = await fetch(`/api/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    const json = await res.json();

    if (json.status === 'success') {
      promoApplied = json.data;
      document.getElementById('promoSuccess').style.display = 'flex';
      document.getElementById('promoSuccess').textContent = json.message;
      updateSummary();
      showToast(`✅ ${json.message}`);
    } else {
      promoApplied = null;
      document.getElementById('promoSuccess').style.display = 'none';
      updateSummary();
      showToast(`❌ ${json.message}`, 'error');
    }
  } catch (err) {
    showToast('❌ Gagal validasi promo code', 'error');
  }
}

// ════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════
function validateForm() {
  const errors = [];

  if (isLoggedIn) {
    if (!document.getElementById('termsLoggedIn').checked) {
      errors.push('Anda harus menyetujui Syarat dan Ketentuan');
    }
  } else {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    if (!username) errors.push('Username wajib diisi');
    if (!email || !email.includes('@')) errors.push('Email tidak valid');
    if (password.length < 8) errors.push('Password minimal 8 karakter');
    if (password !== confirmPass) errors.push('Password tidak cocok');
    if (!terms) errors.push('Anda harus menyetujui Syarat dan Ketentuan');
  }

  if (!selectedPayment) {
    errors.push('Pilih metode pembayaran terlebih dahulu');
  }

  return errors;
}

// ════════════════════════════════════════════
// SUBMIT
// ════════════════════════════════════════════
function setupSubmitButton() {
  document.getElementById('placeOrderBtn').addEventListener('click', submitOrder);
}

async function submitOrder() {
  const errors = validateForm();
  if (errors.length > 0) {
    showToast(`⚠️ ${errors[0]}`, 'error');
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Processing...';
  btn.querySelector('.spinner').style.display = 'block';

  const payload = {
    cart_items: cartItems.map(item => ({ id: item.id })),
    payment_method: selectedPayment,
    promo_code: promoApplied ? promoApplied.code : null,
    terms: isLoggedIn ? document.getElementById('termsLoggedIn').checked : document.getElementById('terms').checked
  };

  if (!isLoggedIn) {
    payload.username = document.getElementById('username').value.trim();
    payload.email = document.getElementById('email').value.trim();
    payload.password = document.getElementById('password').value;
  }

  try {
    const res = await fetch(`/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === 'failed' && result.message === 'EMAIL_ALREADY_REGISTERED') {
      showToast('❌ Email ini sudah terdaftar. Silakan login terlebih dahulu.', 'error');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
      return;
    }

    if (result.status === 'success') {
      showToast('✅ Checkout berhasil!');
      if (!isLoggedIn) Cart.clearLocal();
      const invoiceNumber = result.data?.invoice_number;
      if (invoiceNumber) {
        window.location.href = `/checkout/waiting-payment?invoice=${encodeURIComponent(invoiceNumber)}`;
      } else {
        showToast('❌ Invoice tidak ditemukan', 'error');
      }
    } else {
      showToast(`❌ ${result.message}`, 'error');
    }
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('❌ Terjadi kesalahan, silahkan coba lagi', 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Bayar Sekarang';
    btn.querySelector('.spinner').style.display = 'none';
  }
}

// ════════════════════════════════════════════
// UPSELL
// ════════════════════════════════════════════

let upsellCandidates = [];

async function loadRecommendations() {
  if (cartItems.length === 0) return;

  try {
    const cartIds = cartItems.map(i => i.id).join(',');
    const res = await fetch(`/api/product/recommendations?cart_ids=${cartIds}&limit=3`);
    if (!res.ok) return;
    const json = await res.json();
    upsellCandidates = json.data || [];

    if (upsellCandidates.length === 0) return;
    renderUpsellItems(upsellCandidates);
  } catch (e) {
    console.error('Load recommendations failed:', e);
  }
}

function renderUpsellItems(products) {
  const wrap = document.getElementById('upsellWrap');
  const container = document.getElementById('upsellItems');
  wrap.style.display = 'block';

  container.innerHTML = products.map(p => `
    <div class="upsell-item">
      <div class="upsell-icon">${p.emoji || '📦'}</div>
      <div class="upsell-info">
        <div class="upsell-name">${p.name}</div>
        <div class="upsell-tags">${(p.tags || []).slice(0, 3).join(', ')}</div>
      </div>
      <div class="upsell-price">${formatRp(p.price || 0)}</div>
      <button class="btn-upsell" data-id="${p.id}">+ Tambah</button>
    </div>
  `).join('');
}

function addUpsellItem(productId) {
  // Guard: cegah duplikat
  if (cartItems.some(i => i.id == productId)) {
    showToast('⚠️ Produk sudah ada di keranjang');
    return;
  }

  const product = upsellCandidates.find(p => p.id == productId);
  if (!product) return;

  cartItems.push({
    id: product.id,
    name: product.name,
    price: product.price,
    slug: product.slug,
    category: product.category,
    preview: product.preview,
    discount: product.discount,
    tags: product.tags || []
  });

  renderCartItems();
  updateSummary();
  updateReqBody();
  showToast('✓ ' + product.name + ' ditambahkan');

  // Remove added item from upsell
  upsellCandidates = upsellCandidates.filter(p => p.id != productId);
  if (upsellCandidates.length === 0) {
    document.getElementById('upsellWrap').style.display = 'none';
  } else {
    renderUpsellItems(upsellCandidates);
  }
}

// ════════════════════════════════════════════
// REQUEST BODY PREVIEW
// ════════════════════════════════════════════
function updateReqBody() {
  const payload = {
    cart_items: cartItems.map(item => ({ id: item.id })),
    payment_method: selectedPayment,
    promo_code: promoApplied ? promoApplied.code : null
  };
  const pre = document.getElementById('reqBodyPre');
  if (pre) pre.textContent = JSON.stringify(payload, null, 2);
}

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

function togglePass(fieldId) {
  const input = document.getElementById(fieldId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function checkStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  for (let i = 0; i < 4; i++) {
    document.getElementById(`seg${i + 1}`).style.background =
      i < strength ? colors[strength - 1] : 'var(--border)';
  }

  document.getElementById('strengthLabel').textContent =
    strength > 0 ? labels[strength - 1] : '';
}

// Expose to global scope
window.togglePass = togglePass;
window.checkStrength = checkStrength;
window.applyPromo = applyPromo;
window.updateReqBody = updateReqBody;
