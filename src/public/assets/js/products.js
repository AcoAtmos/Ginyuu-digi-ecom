
// ════════════════════════════════════════════
// PRODUCTS — landing page only
// ════════════════════════════════════════════
import { addToCart } from './navbar.js';

let currentProduct = null;
let activeCategory = 'all';
let PRODUCTS_DATA = [];

function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

// ════════════════════════════════════════════
// FETCH / RENDER PRODUCTS
// ════════════════════════════════════════════
async function fetchProducts(category = 'all') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

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
    const res = await fetch('/api/product');
    if (!res.ok) throw new Error('Gagal fetch data');

    const json = await res.json();
    const data = json.data || json;
    PRODUCTS_DATA = data;

    const filtered = category === 'all'
      ? data
      : data.filter(p => p.category === category);

    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();

    const results = searchVal
      ? filtered.filter(p =>
        (p.name || '').toLowerCase().includes(searchVal) ||
        (p.desc || '').toLowerCase().includes(searchVal) ||
        (p.tags || []).some(t => t.toLowerCase().includes(searchVal))
      )
      : filtered;

    if (results.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;">
          <div style="font-size:40px;">🔍</div>
          <div>Produk tidak ditemukan</div>
        </div>`;
      return;
    }

    grid.innerHTML = results.map((p, i) => `
      <div class="product-card" data-id="${p.id}" style="animation-delay:${i * 50}ms">
        <div class="product-thumb">
          <span class="product-thumb-emoji">📦</span>
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc || ''}</div>
          <div class="product-footer">
            <div>
              ${p.oldPrice ? `<span class="product-price-old">${formatRp(p.oldPrice)}</span>` : ''}
              <span class="product-price">${formatRp(p.price)}</span>
            </div>
            <button class="product-cart-btn">
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
      </div>`;
  }
}

// ════════════════════════════════════════════
// PRODUCT MODAL
// ════════════════════════════════════════════
function openProductModal(id) {
  const overlay = document.getElementById('productModalOverlay');
  if (!overlay) return;
  const p = PRODUCTS_DATA.find(x => x.id == id);
  if (!p) return;
  currentProduct = p;

  document.getElementById('modalEmoji').textContent = p.emoji || '📦';
  document.getElementById('modalCategory').textContent = p.category.toUpperCase();
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalRating').innerHTML = `<span class="star">★★★★★</span> ${p.rating || ''}${p.reviews ? (' · ' + p.reviews + ' ulasan') : ''}`;
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalTags').innerHTML = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modalPriceOld').textContent = p.oldPrice ? formatRp(p.oldPrice) : '';
  document.getElementById('modalPrice').textContent = formatRp(p.price);

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const overlay = document.getElementById('productModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow = '';
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
// INIT (called from landing.js DOMContentLoaded)
// ════════════════════════════════════════════
export function initProducts() {
  fetchProducts('all');

  document.querySelectorAll('.filter-pill, .sidebar-link[data-cat]').forEach(el => {
    el.addEventListener('click', () => {
      const cat = el.dataset.cat;
      activeCategory = cat;
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
      document.querySelectorAll('.sidebar-link[data-cat]').forEach(l => l.classList.toggle('active', l.dataset.cat === cat));
      fetchProducts(cat);
      if (window.innerWidth <= 900) {
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay').style.display = 'none';
      }
    });
  });

  // Search
  let searchTimeout;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => fetchProducts(activeCategory), 400);
    });
  }

  // Product grid — event delegation for modal & add to cart
  document.getElementById('productGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);
    if (e.target.closest('.product-cart-btn')) {
      e.stopPropagation();
      const p = PRODUCTS_DATA.find(x => x.id == id);
      if (p) addToCart(p);
      return;
    }
    openProductModal(id);
  });

  // Product modal
  const productModalClose = document.getElementById('productModalClose');
  const productModalOverlay = document.getElementById('productModalOverlay');
  const modalAddCart = document.getElementById('modalAddCart');
  const modalBuyNow = document.getElementById('modalBuyNow');

  if (productModalClose) {
    productModalClose.addEventListener('click', closeProductModal);
    productModalOverlay?.addEventListener('click', (e) => {
      if (e.target === productModalOverlay) closeProductModal();
    });
    modalAddCart?.addEventListener('click', () => {
      if (!currentProduct) return;
      addToCart(currentProduct);
      closeProductModal();
    });
    modalBuyNow?.addEventListener('click', async () => {
      if (!currentProduct) return;
      await addToCart(currentProduct);
      closeProductModal();
      window.location.href = '/checkout';
    });
  }

  // Animate stats
  setTimeout(() => {
    animateCount(document.getElementById('stat1'), 2400, '+');
    animateCount(document.getElementById('stat2'), 18500, '+');
    animateCount(document.getElementById('stat3'), 340, '+');
  }, 300);
}
