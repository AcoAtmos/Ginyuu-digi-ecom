// Product Database mapping
const allProducts = [];
const productsMap = {};

let filteredProducts = [];
let currentFilters = {
    categories: [],
    minPrice: 0,
    maxPrice: 500,
    rating: null,
    search: ''
};
let currentProduct = null;

//=============document loaded======================
document.addEventListener('DOMContentLoaded', async function() {
    // Fetch products
    const data = await hit_api_get_product_category(); 
    console.log(data);
    
    if (data && data.length > 0) {
        allProducts.push(...data);
        data.forEach(p => productsMap[p.id] = p);
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
        setupModalListeners();
    }
    
    // Setup all event listeners
    setupFilterListeners();
    setupSearchListeners();
    setupSortListeners();
    setupMobileFilter();
    setupPriceRange();
    
    // Initialize price range display
    updatePriceRange();
});

//============Hit api=========================
async function hit_api_get_product_category() {
    try {
        const response = await fetch(`${window.BE_URL}/api/product/category/2/12`);
        const result = await response.json();
        console.log(result);
        return result.data;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// =============== Modal Functions ===============
function setupModalListeners() {
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const orderNowBtn = document.getElementById('order_now_btn');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', () => {
            if (currentProduct?.slug) {
                window.location.href = `/page/checkout/${currentProduct.slug}`;
            }
        });
    }
}

function openModal(product) {
    currentProduct = product;
    
    const modal = document.getElementById('productModal');
    const imageContainer = document.getElementById('modalImageContainer');
    
    if (imageContainer) {
        imageContainer.innerHTML = product.preview_image_url 
            ? `<img src="${product.preview_image_url}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;">`
            : '<span class="modal-image-icon">📱</span>';
    }
    
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalRating = document.getElementById('modalRating');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    
    if (modalCategory) modalCategory.textContent = product.category || 'Product';
    if (modalTitle) modalTitle.textContent = product.title || 'Untitled';
    if (modalRating) modalRating.textContent = `${product.rating_avg || 0}/5 (${product.rating_count || 0} reviews)`;
    if (modalDescription) modalDescription.textContent = product.description || 'No description available.';
    
    const price = product.discount_price || product.price;
    if (modalPrice) modalPrice.textContent = `Rp ${parseInt(price).toLocaleString('id-ID')}`;
    
    const originalEl = document.getElementById('modalOriginalPrice');
    const discountEl = document.getElementById('modalDiscount');
    
    if (product.discount_price && product.discount_price < product.price) {
        if (originalEl) {
            originalEl.textContent = `Rp ${parseInt(product.price).toLocaleString('id-ID')}`;
            originalEl.style.display = 'inline';
        }
        const discountPct = Math.round((1 - product.discount_price / product.price) * 100);
        if (discountEl) {
            discountEl.textContent = `-${discountPct}%`;
            discountEl.style.display = 'inline-block';
        }
    } else {
        if (originalEl) originalEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
    }
    
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// =============== Render Products ===============
function renderProducts(data) {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const productCount = document.getElementById('productCount');
    
    if (!productGrid) return;
    
    if (data.length === 0) {
        productGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (productCount) productCount.textContent = '0';
        return;
    }
    
    productGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (productCount) productCount.textContent = data.length;
    
    productGrid.innerHTML = data.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <span class="product-icon">
                    ${product.preview_image_url ? `<img src="${product.preview_image_url}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;">` : '📱'}
                </span>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.title || 'Untitled'}</div>
                <div class="product-category">${product.category || 'Product'}</div>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(parseFloat(product.rating_avg) || 0))}${'☆'.repeat(5 - Math.floor(parseFloat(product.rating_avg) || 0))}</span>
                    <span class="rating-text">${product.rating_avg || 0}/5</span>
                </div>
                <div class="product-price">
                    <span class="current-price">Rp ${parseInt(product.discount_price || product.price).toLocaleString('id-ID')}</span>
                    ${product.discount_price ? `
                        <span class="original-price">Rp ${parseInt(product.price).toLocaleString('id-ID')}</span>
                        <span class="discount">-${Math.round((1 - parseFloat(product.discount_price) / parseFloat(product.price)) * 100)}%</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers to product cards - open modal
    document.querySelectorAll('.product-card').forEach((card) => {
        card.addEventListener('click', () => {
            const productId = card.dataset.id;
            const product = productsMap[productId];
            if (product) {
                openModal(product);
            }
        });
    });
}

// =============== Filter Functions ===============
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (currentFilters.categories.length > 0) {
            if (!currentFilters.categories.includes(product.category)) return false;
        }

        // Price filter
        const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.price);
        if (price < currentFilters.minPrice || price > currentFilters.maxPrice) {
            return false;
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

// =============== Sort Functions ===============
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
            filteredProducts = [...filteredProducts];
    }
    renderProducts(filteredProducts);
}

// =============== Setup Event Listeners ===============
function setupFilterListeners() {
    // Category filters
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
                .map(cb => cb.value);
        });
    });

    // Rating filters
    document.querySelectorAll('.rating-filter').forEach(radio => {
        radio.addEventListener('change', () => {
            currentFilters.rating = parseFloat(radio.value);
        });
    });

    // Apply filters button
    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', filterProducts);
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }

    // Clear filter buttons
    document.querySelectorAll('.filter-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.clear;
            
            switch(filterType) {
                case 'category':
                    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
                    currentFilters.categories = [];
                    break;
                case 'price':
                    const minSlider = document.getElementById('minPriceSlider');
                    const maxSlider = document.getElementById('maxPriceSlider');
                    if (minSlider) minSlider.value = 0;
                    if (maxSlider) maxSlider.value = 500;
                    updatePriceRange();
                    break;
                case 'rating':
                    document.querySelectorAll('.rating-filter').forEach(radio => radio.checked = false);
                    currentFilters.rating = null;
                    break;
            }
            
            filterProducts();
        });
    });

    // Clear all filters
    const clearAllBtn = document.getElementById('clearAllFilters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
            document.querySelectorAll('.rating-filter').forEach(radio => radio.checked = false);
            
            const minSlider = document.getElementById('minPriceSlider');
            const maxSlider = document.getElementById('maxPriceSlider');
            if (minSlider) minSlider.value = 0;
            if (maxSlider) maxSlider.value = 500;
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            
            updatePriceRange();

            currentFilters = {
                categories: [],
                minPrice: 0,
                maxPrice: 500,
                rating: null,
                search: ''
            };

            filterProducts();
        });
    }
}

function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (window.innerWidth <= 425 && searchInput) {
                searchInput.classList.add('show');
                searchInput.focus();
            } else if (searchInput) {
                performSearch();
            }
        });
    }

    if (searchInput) {
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
                performSearch();
            }, 500);
        });
    }

    function performSearch() {
        if (searchInput) {
            currentFilters.search = searchInput.value;
            filterProducts();
        }
    }
}

function setupSortListeners() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }
}

function setupPriceRange() {
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');

    if (minSlider) {
        minSlider.addEventListener('input', updatePriceRange);
    }
    if (maxSlider) {
        maxSlider.addEventListener('input', updatePriceRange);
    }
}

function updatePriceRange() {
    const minSlider = document.getElementById('minPriceSlider');
    const maxSlider = document.getElementById('maxPriceSlider');
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    const priceRange = document.getElementById('priceRange');

    if (!minSlider || !maxSlider) return;

    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);

    if (minVal >= maxVal) {
        minSlider.value = maxVal - 10;
        minVal = maxVal - 10;
    }

    const percent1 = (minSlider.value / 500) * 100;
    const percent2 = (maxSlider.value / 500) * 100;
    
    if (priceRange) {
        priceRange.style.left = percent1 + '%';
        priceRange.style.width = (percent2 - percent1) + '%';
    }

    if (minInput) minInput.value = minSlider.value;
    if (maxInput) maxInput.value = maxSlider.value;

    currentFilters.minPrice = parseInt(minSlider.value);
    currentFilters.maxPrice = parseInt(maxSlider.value);
}

function setupMobileFilter() {
    const filterMobileBtn = document.getElementById('filterMobileBtn');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterMobile = document.getElementById('filterMobile');
    const filterClose = document.getElementById('filterClose');
    const mobileFiltersContent = document.getElementById('mobileFiltersContent');
    const filtersSidebar = document.querySelector('.filters-sidebar');

    // Clone filters to mobile
    if (filtersSidebar && mobileFiltersContent) {
        mobileFiltersContent.innerHTML = filtersSidebar.innerHTML;
    }

    // Sync mobile filter event listeners
    if (mobileFiltersContent) {
        mobileFiltersContent.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const desktopCheckbox = document.querySelector(`.filters-sidebar #${checkbox.id}`);
                if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
                
                currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
                    .map(cb => cb.value);
            });
        });
    }

    if (filterMobileBtn && filterOverlay && filterMobile) {
        filterMobileBtn.addEventListener('click', () => {
            filterOverlay.classList.add('active');
            filterMobile.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (filterClose && filterOverlay && filterMobile) {
        filterClose.addEventListener('click', () => {
            filterOverlay.classList.remove('active');
            filterMobile.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (filterOverlay) {
        filterOverlay.addEventListener('click', (e) => {
            if (e.target === filterOverlay && filterMobile) {
                filterOverlay.classList.remove('active');
                filterMobile.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

console.log('Product browse page loaded! 🎨');
