// home.js
import { isCookieSet,getCookie, setCookie } from "./main/main.js";
//==================== Global state ==============================
const products_map = {};
let current_product = null;

//============= Initialization ========================

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

//================= calls API =======================

async function fetchHomeProducts() {
    try {
        const res = await fetch(`${window.BE_URL}/api/product/home`);
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
        const res = await fetch(`${window.BE_URL}/api/auth/verify_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("cek token", res);
        const result = await res.json();
        console.log("cek token", result);
        return !!result; // assuming truthy = valid
    } catch (err) {
        console.error('Token verification failed:', err);
        return false;
    }
}

// 
//================= rendering ====================
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

    const gridNewArrival = document.getElementById('grid_new_arrival_container');
    const gridTopSelling = document.getElementById('grid_top_selling_container');
    if (gridNewArrival) gridNewArrival.innerHTML = newArrivalHTML;
    if (gridTopSelling) gridTopSelling.innerHTML = topSellingHTML;
    console.log("new arrival :", products_map)
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
                    <span class="original-price">${item.currency}.${item.price}</span>
                    <span class="current-price">${item.currency}.${item.discount_price}</span>
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
        { name: "Browse All", href: "/page/browsAll" },
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

function setupSearch() {
    try {
        const searchContainer = document.querySelector('.search-wrapper');
        if (!searchContainer) {
            console.log('Search container not found');
            return;
        }
        
        const searchButton = searchContainer.querySelector('button');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                searchContainer.classList.toggle('active');
            });
        }
    } catch (err) {
        console.error('setupSearch error:', err);
    }
}

// ────────────────────────────────────────────────
// event listeners
// ────────────────────────────────────────────────
function attachGlobalEventListeners() {
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const scrollTop = document.getElementById('scrollTop');
    const newsletterForm = document.getElementById('newsletterForm');

    // Modal close
    modalClose?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Scroll to top
    window.addEventListener('scroll', () => {
        scrollTop?.classList.toggle('visible', window.pageYOffset > 300);
    });

    scrollTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Newsletter
    newsletterForm?.addEventListener('submit', (e) => {
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
            heroImage.style.transform = `translateY(${window.pageYOffset * 0.3 / 16}rem)`;
        }
    });

    setupSearch()
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
    const orderNowBtn = document.getElementById('order_now_btn');
    orderNowBtn?.addEventListener('click', () => {
        if (current_product?.slug) {
            window.location.href = `/page/checkout/${current_product.slug}`;
        }
    });
}

// ────────────────────────────────────────────────
// modal
// ────────────────────────────────────────────────
function openModal(item) {
    current_product = item;
    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Image
    const modalImageContainer = document.getElementById('modalImageContainer');
    if (modalImageContainer) {
        modalImageContainer.innerHTML = item.gallery_images 
            ? `<img src="${item.gallery_images}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">`
            : '<span class="modal-image-icon">📱</span>';
    }

    // Text fields
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const ratingText = document.getElementById('modalRatingText');
    
    if (modalCategory) modalCategory.textContent = item.category || 'Product';
    if (modalTitle) modalTitle.textContent = item.title || 'Untitled';
    if (modalDescription) modalDescription.textContent = item.description || 'No description available.';
    
    const price = item.discount_price || item.price;
    if (modalPrice) modalPrice.textContent = `Rp ${parseInt(price).toLocaleString('id-ID')}`;

    // Rating
    if (ratingText) {
        const count = item.rating_count ?? 0;
        ratingText.textContent = `${item.rating_avg || 0}/5 (${count} reviews)`;
    }

    // Price & discount visibility
    const originalPrice = document.getElementById('modalOriginalPrice');
    const discountEl = document.getElementById('modalDiscount');

    if (item.discount > 0) {
        if (originalPrice) {
            originalPrice.textContent = `Rp ${parseInt(item.price).toLocaleString('id-ID')}`;
            originalPrice.style.display = 'inline';
        }
        if (discountEl) {
            discountEl.textContent = `-${item.discount}%`;
            discountEl.style.display = 'inline-block';
        }
    } else {
        if (originalPrice) originalPrice.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
    }

    // Show
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    current_product = null;
}


