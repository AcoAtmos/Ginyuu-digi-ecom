// Product Database maping
const allProducts = [];

let filteredProducts = [];
let currentFilters = {
    categories: [],
    minPrice: 0,
    maxPrice: 500,
    rating: null,
    search: ''
};

//=============document loaded======================
document.addEventListener('DOMContentLoaded', async function(){
    const data = await hit_api_get_product_category(); 
    console.log(data);
    if (data && data.length > 0) {
        allProducts.push(...data);
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
    }
})
//============Hit api=========================
async function hit_api_get_product_category(){
    try {
        const response = await fetch('http://localhost:4100/api/product/category/2/12');
        const result = await response.json();
        console.log(result);
        return result.data;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// Render Products
function renderProducts(data) {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const productCount = document.getElementById('productCount');

    if (data.length === 0) {
        productGrid.style.display = 'none';
        emptyState.style.display = 'block';
        productCount.textContent = '0';
        return;
    }

    productGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    productCount.textContent = data.length;

    productGrid.innerHTML = data.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <span class="product-icon">
                    <img sty = "objectFit:cover;" src="${product.preview_image_url}" alt="">
                </span>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.title}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(parseFloat(product.rating_avg) || 0))}${'☆'.repeat(5 - Math.floor(parseFloat(product.rating_avg) || 0))}</span>
                    <span class="rating-text">${product.rating_avg}/5</span>
                </div>
                <div class="product-price">
                    <span class="current-price">Rp. ${product.discount_price || product.price}</span>
                    ${product.discount_price ? `
                        <span class="original-price">Rp. ${product.price}</span>
                        <span class="discount">-${Math.round((1 - parseFloat(product.discount_price) / parseFloat(product.price)) * 100)}%</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers to product cards
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            const productId = card.dataset.id;
            addToCart(productId);
        });
    });
}

// Filter Products
function filterProducts(data) {
    filteredProducts = data.filter(product => {
        // Category filter
        if (currentFilters.categories.length > 0) {
            if (!currentFilters.categories.includes(product.category)) return false;
        }

        // Price filter
        const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.price);
        if (price < currentFilters.minPrice || price > currentFilters.maxPrice) {
            return false;
        }

        // Color filter
        if (currentFilters.colors && currentFilters.colors.length > 0) {
            if (!currentFilters.colors.includes(product.color)) return false;
        }

        // Rating filter
        if (currentFilters.rating !== null) {
            const rating = parseFloat(product.rating_avg) || 0;
            if (rating < currentFilters.rating) return false;
        }

        // Search filter
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const nameMatch = product.title && product.title.toLowerCase().includes(searchLower);
            const categoryMatch = product.category && product.category.toLowerCase().includes(searchLower);
            if (!nameMatch && !categoryMatch) return false;
        }

        return true;
    });

    renderProducts(filteredProducts);
}

// Sort Products
function sortProducts(sortBy) {
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => {
                const priceA = a.discount_price ? parseFloat(a.discount_price) : parseFloat(a.price);
                const priceB = b.discount_price ? parseFloat(b.discount_price) : parseFloat(b.price);
                return priceA - priceB;
            });
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => {
                const priceA = a.discount_price ? parseFloat(a.discount_price) : parseFloat(a.price);
                const priceB = b.discount_price ? parseFloat(b.discount_price) : parseFloat(b.price);
                return priceB - priceA;
            });
            break;
        case 'rating':
            filteredProducts.sort((a, b) => (parseFloat(b.rating_avg) || 0) - (parseFloat(a.rating_avg) || 0));
            break;
        case 'newest':
            filteredProducts.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            break;
        default:
            // featured - keep original order
            filteredProducts = [...filteredProducts];
    }
    renderProducts(filteredProducts);
}

// Category Filter Event Listeners
document.querySelectorAll('.category-filter').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
            .map(cb => cb.value);
    });
});

// Price Range Sliders
const minPriceSlider = document.getElementById('minPriceSlider');
const maxPriceSlider = document.getElementById('maxPriceSlider');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const priceRange = document.getElementById('priceRange');

function updatePriceRange() {
    const minVal = parseInt(minPriceSlider.value);
    const maxVal = parseInt(maxPriceSlider.value);

    if (minVal >= maxVal) {
        minPriceSlider.value = maxVal - 10;
    }

    const percent1 = (minPriceSlider.value / 500) * 100;
    const percent2 = (maxPriceSlider.value / 500) * 100;
    
    priceRange.style.left = percent1 + '%';
    priceRange.style.width = (percent2 - percent1) + '%';

    minPriceInput.value = minPriceSlider.value;
    maxPriceInput.value = maxPriceSlider.value;

    currentFilters.minPrice = parseInt(minPriceSlider.value);
    currentFilters.maxPrice = parseInt(maxPriceSlider.value);
}

minPriceSlider.addEventListener('input', updatePriceRange);
maxPriceSlider.addEventListener('input', updatePriceRange);

minPriceInput.addEventListener('change', () => {
    minPriceSlider.value = minPriceInput.value;
    updatePriceRange();
});

maxPriceInput.addEventListener('change', () => {
    maxPriceSlider.value = maxPriceInput.value;
    updatePriceRange();
});

// Color Filter
document.querySelectorAll('.color-option').forEach(colorBtn => {
    colorBtn.addEventListener('click', () => {
        colorBtn.classList.toggle('active');
        currentFilters.colors = Array.from(document.querySelectorAll('.color-option.active'))
            .map(btn => btn.dataset.color);
    });
});

// Rating Filter
document.querySelectorAll('.rating-filter').forEach(radio => {
    radio.addEventListener('change', () => {
        currentFilters.rating = parseFloat(radio.value);
    });
});

// Search
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function performSearch() {
    currentFilters.search = searchInput.value;
    filterProducts();
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Debounced search
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentFilters.search = searchInput.value;
        filterProducts();
    }, 500);
});
// search input on mobile dissapare
searchBtn.addEventListener('click', (e)=>{
    if(window.innerWidth <= 425){
        if(!searchInput.classList.contains('show')){
            searchInput.classList.add('show')
            searchInput.focus();
            e.stopPropagation(); // supaya tidak langsung ketutup
            return
        }
    }
    //keyword
    const keyword = searchInput.value;
    console.log('tekrlik')
    // add function search here
});
// Apply Filters Button
document.getElementById('applyFilters').addEventListener('click', filterProducts);

// Sort Select
document.getElementById('sortSelect').addEventListener('change', (e) => {
    sortProducts(e.target.value);
});

// Clear Filters
document.querySelectorAll('.filter-clear').forEach(btn => {
    btn.addEventListener('click', () => {
        const filterType = btn.dataset.clear;
        
        switch(filterType) {
            case 'category':
                document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
                currentFilters.categories = [];
                break;
            case 'price':
                minPriceSlider.value = 0;
                maxPriceSlider.value = 500;
                updatePriceRange();
                break;
            case 'color':
                document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
                currentFilters.colors = [];
                break;
            case 'rating':
                document.querySelectorAll('.rating-filter').forEach(radio => radio.checked = false);
                currentFilters.rating = null;
                break;
        }
        
        filterProducts();
    });
});

// Clear All Filters
document.getElementById('clearAllFilters').addEventListener('click', () => {
    // Reset all filters
    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.rating-filter').forEach(radio => radio.checked = false);
    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
    minPriceSlider.value = 0;
    maxPriceSlider.value = 500;
    updatePriceRange();
    searchInput.value = '';

    currentFilters = {
        categories: [],
        minPrice: 0,
        maxPrice: 500,
        colors: [],
        rating: null,
        search: ''
    };

    filterProducts();
});

// Mobile Filter
const filterMobileBtn = document.getElementById('filterMobileBtn');
const filterOverlay = document.getElementById('filterOverlay');
const filterMobile = document.getElementById('filterMobile');
const filterClose = document.getElementById('filterClose');
const mobileFiltersContent = document.getElementById('mobileFiltersContent');

// Clone filters to mobile
const filtersSidebar = document.querySelector('.filters-sidebar');
mobileFiltersContent.innerHTML = filtersSidebar.innerHTML;

// Sync mobile filter event listeners
mobileFiltersContent.querySelectorAll('.category-filter').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const desktopCheckbox = document.querySelector(`.filters-sidebar #${checkbox.id}`);
        if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
        
        currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
            .map(cb => cb.value);
    });
});

filterMobileBtn.addEventListener('click', () => {
    filterOverlay.classList.add('active');
    filterMobile.classList.add('active');
    document.body.style.overflow = 'hidden';
});

filterClose.addEventListener('click', closeMobileFilter);
filterOverlay.addEventListener('click', closeMobileFilter);

function closeMobileFilter() {
    filterOverlay.classList.remove('active');
    filterMobile.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Cart functionality
function addToCart() {
    const cartCount = document.querySelector('.cart-count');
    const currentCount = parseInt(cartCount.textContent);
    cartCount.textContent = currentCount + 1;
    
    // Optional: Show notification
    alert('Product added to cart!');
}

// Initialize
updatePriceRange();
// renderProducts(allProducts);

console.log('Product browse page loaded! 🎨');
