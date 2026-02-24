// home.js
import { isCookieSet,getCookie, setCookie } from "./main/main.js";

// ────────────────────────────────────────────────
// Global state
// ────────────────────────────────────────────────
const products_map = {};
let current_product = null;

// ────────────────────────────────────────────────
// DOM elements 
// ────────────────────────────────────────────────
const elements = {
    gridNewArrival: document.getElementById('grid_new_arrival_container'),
    gridTopSelling: document.getElementById('grid_top_selling_container'),
    modal: document.getElementById('productModal'),
    modalClose: document.getElementById('modalClose'),
    orderNowBtn: document.getElementById('order_now_btn'),
    scrollTop: document.getElementById('scrollTop'),
    newsletterForm: document.getElementById('newsletterForm'),
};

// ────────────────────────────────────────────────
// Initialization
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    // Load products
    const data = await fetchHomeProducts();
    if (data) {
        await renderHomeProducts(data);
    }

    // Check authentication & setup profile
    const isLoggedIn = await checkLogin();
    if (isLoggedIn) {
        await setupProfile();
    }
    setupDropdowns();

    // Attach all event listeners
    attachGlobalEventListeners();
    attachProductCardListeners();
}

// ────────────────────────────────────────────────
// calls API
// ────────────────────────────────────────────────
async function fetchHomeProducts() {
    try {
        const res = await fetch('http://localhost:4100/api/product/home');
        if (!res.ok) throw new Error('Failed to fetch products');
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.error('Error fetching home products:', err);
        return null;
    }
}

async function checkLogin() {
    const token = getCookie('token');
    if (!token) return false;

    try {
        const res = await fetch("http://localhost:4100/api/auth/verify_token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        return !!result; // assuming truthy = valid
    } catch (err) {
        console.error('Token verification failed:', err);
        return false;
    }
}

// ────────────────────────────────────────────────
// rendering
// ────────────────────────────────────────────────
async function renderHomeProducts(data) {
    const { new_arrival, top_selling } = data;

    // Clear map first
    Object.keys(products_map).forEach(key => delete products_map[key]);

    // Build HTML
    const newArrivalHTML = new_arrival
        .map(item => {
            products_map[item.id] = item;
            return createProductCardHTML(item, true);
        })
        .join('');

    const topSellingHTML = top_selling
        .map(item => {
            products_map[item.id] = item;
            return createProductCardHTML(item, false);
        })
        .join('');

    elements.gridNewArrival.innerHTML = newArrivalHTML;
    elements.gridTopSelling.innerHTML = topSellingHTML;
}

function createProductCardHTML(item, isNew = false) {
    const badge = isNew ? '<span class="product-badge">NEW</span>' : '';

    return `
        <div class="product-card" data-product="${item.id}">
            <div class="product-image">
                <span class="product-icon">
                    <img src="${item.gallery_images}" alt="${item.title}">
                </span>
                ${badge}
            </div>
            <div class="product-info">
                <div class="product-name">${item.title}</div>
                <div class="product-category">${item.category}</div>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span class="rating-text">${item.rating_avg}</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${item.currency}.${item.discount_price}</span>
                    <span class="original-price">${item.currency}.${item.price}</span>
                    <span class="discount">-${item.discount}%</span>
                </div>
            </div>
        </div>
    `;
}

// ────────────────────────────────────────────────
// profile & navigation
// ────────────────────────────────────────────────
async function setupProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.image_url) return;

    const profileEl = document.getElementById('profile-img');
    const profileLink = document.getElementById('profile-dropdown');

    if (profileEl) {
        profileEl.innerHTML = `
            <img class="profile-img" src="../../assets/img/profile/${user.image_url}" alt="Profile">
        `;
    }

    if (profileLink) {
        profileLink.setAttribute('data-menu', 'profile');
        profileLink.href = '#';
        profileLink.classList.add('dropdown-toggle');
    }
}

const menus = {
    profile: [
        { name: "profile", href: "/page/profile" },
        { name: "orders",   href: "/page/orders" },
        { name: "logout",   href: "#" }
    ],
    shop: [
        { name: "New Arrivals", href: "#new-arrivals" },
        { name: "Top Selling",  href: "#top-selling" },
        { name: "All Categories", href: "#categories" },
        { name: "On Sale",      href: "#sale" }
    ]
};

function setupDropdowns() { 
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();

            const menuName = toggle.dataset.menu;
            if (!menus[menuName]) return;

            // Remove any existing menu in this dropdown first (prevents duplicates)
            const existingMenu = toggle.parentElement.querySelector('.dropdown-menu');
            if (existingMenu) {
                existingMenu.remove();
            }

            // Create fresh menu
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu';

            // Build items
            menu.innerHTML = menus[menuName]
                .map(item => `<a href="${item.href}">${item.name}</a>`)
                .join('');

            // Append to the .dropdown container (not directly to toggle)
            toggle.parentElement.appendChild(menu);

            // Special case: logout
            const logoutLink = menu.querySelector('a[href="#"]');
            if (logoutLink && menuName === 'profile') {
                logoutLink.textContent = 'Logout'; // make it clearer
                logoutLink.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    logout();
                }, { once: true });
            }

            // Close others
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m !== menu) m.classList.remove('active');
            });


            // close dropdown when click outside
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    menu.classList.remove('active');
                }
            });
            // Toggle this one
            menu.classList.toggle('active');
        });
    });
}

function createDropdownMenu() {
    const div = document.createElement('div');
    div.className = 'dropdown-menu';
    return div;
}

function logout() {
    setCookie('token', '', 1);
    localStorage.removeItem('user');
    window.location.href = '/page/home';
}

// ────────────────────────────────────────────────
// event listeners
// ────────────────────────────────────────────────
function attachGlobalEventListeners() {
    // Modal close
    elements.modalClose?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // Scroll to top
    window.addEventListener('scroll', () => {
        elements.scrollTop?.classList.toggle('visible', window.pageYOffset > 300);
    });

    elements.scrollTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Newsletter
    elements.newsletterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input')?.value;
        if (email) {
            alert(`Thank you for subscribing with: ${email}`);
            e.target.reset();
        }
    });

    // Parallax (optional – small performance impact)
    window.addEventListener('scroll', () => {
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.transform = `translateY(${window.pageYOffset * 0.3}px)`;
        }
    });
}

function attachProductCardListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.product;
            const product = products_map[id];
            if (product) openModal(product);
        });
    });

    // Order now
    elements.orderNowBtn?.addEventListener('click', () => {
        if (current_product?.slug) {
            window.location.href = `http://localhost:3100/page/checkout/${current_product.slug}`;
        }
    });
}

// ────────────────────────────────────────────────
// modal
// ────────────────────────────────────────────────
function openModal(item) {
    current_product = item;

    // Image
    const modalImage = document.querySelector('.modal-image');
    if (modalImage) {
        modalImage.innerHTML = `<img src="${item.gallery_images}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">`;
    }

    // Text fields
    const set = (id, val) => document.getElementById(id)?.setAttribute('textContent', val ?? '');
    set("modalCategory", item.category || 'Product');
    set("modalTitle", item.title);
    set("modalDescription", item.description);
    set("modalPrice", `${item.currency}.${item.discount_price}`);

    // Rating
    const ratingEl = document.querySelector('.modal-rating .rating-text');
    if (ratingEl) {
        const count = item.rating_count ?? 0;
        ratingEl.textContent = `${item.rating_avg}/5 (${count} reviews)`;
    }

    // Price & discount visibility
    const originalPrice = document.getElementById('modalOriginalPrice');
    const discountEl = document.querySelector('.modal-price .discount');

    if (item.discount > 0) {
        originalPrice.textContent = `${item.currency}.${item.price}`;
        originalPrice.style.display = 'inline';
        discountEl.textContent = `-${item.discount}%`;
        discountEl.style.display = 'inline-block';
    } else {
        originalPrice.style.display = 'none';
        discountEl.style.display = 'none';
    }

    // Show
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    current_product = null;
}


