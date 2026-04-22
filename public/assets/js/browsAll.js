const allProducts = [];
const productsMap = {};

let filteredProducts = [];
let currentFilters = {
    categories: [],
    minPrice: 0,
    maxPrice: 999999,
    rating: null,
    search: ''
};
let currentProduct = null;

// Pagination
let currentPage = 1;
let itemsPerPage = 12;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async function() {
    const data = await hit_api_get_product_category();
    
    if (data && data.length > 0) {
        allProducts.push(...data);
        data.forEach(p => productsMap[p.id] = p);
        filteredProducts = [...allProducts];
        totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
        renderProducts();
        renderPagination();
        setupModalListeners();
    }
    
    setupFilterListeners();
    setupSortListeners();
    setupMobileFilter();
    setupPriceInputs();
});

async function hit_api_get_product_category() {
    try {
        const response = await fetch(`${window.BE_URL}/api/product/category/1/1000`);
        const result = await response.json();
        const data = result.data;
        return (data && data.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

// =============== Modal ===============
function setupModalListeners() {
    const modal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const orderNowBtn = document.getElementById('order_now_btn');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    
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
            : '<span class="product-icon">📱</span>';
    }
    
    document.getElementById('modalCategory').textContent = product.category || 'Product';
    document.getElementById('modalTitle').textContent = product.title || 'Untitled';
    document.getElementById('modalRating').textContent = `${parseFloat(product.rating_avg || 0).toFixed(1)}/5 (${product.rating_count || 0} reviews)`;
    document.getElementById('modalDescription').textContent = product.description || 'No description available.';
    
    const price = product.discount_price || product.price;
    document.getElementById('modalPrice').textContent = `Rp ${parseInt(price).toLocaleString('id-ID')}`;
    
    const originalEl = document.getElementById('modalOriginalPrice');
    const discountEl = document.getElementById('modalDiscount');
    
    if (product.discount_price && product.discount_price < product.price) {
        originalEl.textContent = `Rp ${parseInt(product.price).toLocaleString('id-ID')}`;
        originalEl.style.display = 'inline';
        const discountPct = Math.round((1 - product.discount_price / product.price) * 100);
        discountEl.textContent = `-${discountPct}%`;
        discountEl.style.display = 'inline-block';
    } else {
        originalEl.style.display = 'none';
        discountEl.style.display = 'none';
    }
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// =============== Render Products (with pagination) ===============
function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const productCount = document.getElementById('productCount');
    const paginationWrapper = document.getElementById('paginationWrapper');
    
    if (!productGrid) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (filteredProducts.length === 0) {
        productGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (productCount) productCount.textContent = '0';
        if (paginationWrapper) paginationWrapper.style.display = 'none';
        return;
    }
    
    productGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (productCount) productCount.textContent = filteredProducts.length;
    if (paginationWrapper) paginationWrapper.style.display = 'flex';
    
    productGrid.innerHTML = pageProducts.map(product => {
        const imgContent = product.preview_image_url 
            ? `<img src="${product.preview_image_url}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;">` 
            : '📱';
        
        const stars = '★'.repeat(Math.floor(parseFloat(product.rating_avg) || 0)) + '☆'.repeat(5 - Math.floor(parseFloat(product.rating_avg) || 0));
        const originalPrice = parseInt(product.price).toLocaleString('id-ID');
        const currentPrice = parseInt(product.discount_price || product.price).toLocaleString('id-ID');
        const discount = product.discount_price && product.discount_price < product.price
            ? `<span class="discount">-${Math.round((1 - parseFloat(product.discount_price) / parseFloat(product.price)) * 100)}%</span>`
            : '';
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <span class="product-icon">${imgContent}</span>
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.title || 'Untitled'}</div>
                    <div class="product-category">${product.category || 'Product'}</div>
                    <div class="product-rating">
                        <span class="stars">${stars}</span>
                        <span class="rating-text">${parseFloat(product.rating_avg || 0).toFixed(1)}/5</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">Rp ${currentPrice}</span>
                        ${discount}
                        ${product.discount_price ? `<span class="original-price">Rp ${originalPrice}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.product-card').forEach((card) => {
        card.addEventListener('click', () => {
            const productId = card.dataset.id;
            const product = productsMap[productId];
            if (product) openModal(product);
        });
    });
}

// =============== Pagination ===============
function renderPagination() {
    const paginationNumbers = document.getElementById('paginationNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const wrapper = document.getElementById('paginationWrapper');
    
    if (!paginationNumbers) return;
    
    totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    
    let html = '';
    
    if (totalPages <= 1) {
        if (wrapper) wrapper.style.display = 'none';
        return;
    }
    
    if (wrapper) wrapper.style.display = 'flex';
    
    // Always show page 1
    html += `<button class="page-btn ${currentPage === 1 ? 'active' : ''}" data-page="1">1</button>`;
    
    // Show ellipsis at start if needed
    if (currentPage > 3) {
        html += `<button class="ellipsis">...</button>`;
    }
    
    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // Show ellipsis at end if needed
    if (currentPage < totalPages - 2 && totalPages > 3) {
        html += `<button class="ellipsis">...</button>`;
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
        html += `<button class="page-btn ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    paginationNumbers.innerHTML = html;
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    
    paginationNumbers.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderProducts();
            renderPagination();
            window.scrollTo({ top: 200, behavior: 'smooth' });
        });
    });
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                renderPagination();
                window.scrollTo({ top: 200, behavior: 'smooth' });
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                renderPagination();
                window.scrollTo({ top: 200, behavior: 'smooth' });
            }
        };
    }
}

// =============== Filter ===============
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        // Category
        if (currentFilters.categories.length > 0) {
            if (!currentFilters.categories.includes(product.category)) return false;
        }
        
        // Price
        const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.price);
        if (currentFilters.minPrice > 0 && price < currentFilters.minPrice) return false;
        if (currentFilters.maxPrice < 999999 && price > currentFilters.maxPrice) return false;
        
        // Rating
        if (currentFilters.rating !== null) {
            const rating = parseFloat(product.rating_avg) || 0;
            if (rating < currentFilters.rating) return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    renderProducts();
    renderPagination();
}

// =============== Sort ===============
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
    }
    currentPage = 1;
    renderProducts();
    renderPagination();
}

// =============== Event Listeners ===============
function setupFilterListeners() {
    // Category
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
                .map(cb => cb.value);
        });
    });
    
    // Rating
    document.querySelectorAll('.rating-filter').forEach(radio => {
        radio.addEventListener('change', () => {
            currentFilters.rating = parseFloat(radio.value);
        });
    });
    
    // Apply button
    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', filterProducts);
    }
    
    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortProducts(e.target.value));
    }
    
    // Clear buttons
    document.querySelectorAll('.filter-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.clear;
            
            if (type === 'category') {
                document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
                currentFilters.categories = [];
            } else if (type === 'price') {
                document.getElementById('minPrice').value = '';
                document.getElementById('maxPrice').value = '';
                currentFilters.minPrice = 0;
                currentFilters.maxPrice = 999999;
            } else if (type === 'rating') {
                document.querySelectorAll('.rating-filter').forEach(r => r.checked = false);
                currentFilters.rating = null;
            }
            
            filterProducts();
        });
    });
    
    // Clear all
    const clearAllBtn = document.getElementById('clearAllFilters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
            document.querySelectorAll('.rating-filter').forEach(r => r.checked = false);
            document.getElementById('minPrice').value = '';
            document.getElementById('maxPrice').value = '';
            
            currentFilters = {
                categories: [],
                minPrice: 0,
                maxPrice: 999999,
                rating: null,
                search: ''
            };
            
            filterProducts();
        });
    }
}

function setupPriceInputs() {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    
    if (minInput) {
        minInput.addEventListener('change', () => {
            currentFilters.minPrice = parseInt(minInput.value) || 0;
        });
    }
    
    if (maxInput) {
        maxInput.addEventListener('change', () => {
            currentFilters.maxPrice = parseInt(maxInput.value) || 999999;
        });
    }
}

function setupSortListeners() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortProducts(e.target.value));
    }
}

// =============== Mobile Filter ===============
function setupMobileFilter() {
    const filterMobileBtn = document.getElementById('filterMobileBtn');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterMobile = document.getElementById('filterMobile');
    const filterClose = document.getElementById('filterClose');
    const mobileFiltersContent = document.getElementById('mobileFiltersContent');
    const filtersSidebar = document.querySelector('.filters-sidebar');
    
    if (filtersSidebar && mobileFiltersContent) {
        mobileFiltersContent.innerHTML = filtersSidebar.innerHTML;
        mobileFiltersContent.querySelectorAll('.apply-filters')[0]?.remove();
        
        mobileFiltersContent.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const desktopCheckbox = document.querySelector(`.filters-sidebar #${checkbox.id}`);
                if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
                
                currentFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
                    .map(cb => cb.value);
            });
        });
        
        mobileFiltersContent.querySelectorAll('.rating-filter').forEach(radio => {
            radio.addEventListener('change', () => {
                currentFilters.rating = parseFloat(radio.value);
            });
        });
        
        const applyBtn = document.createElement('button');
        applyBtn.className = 'apply-filters';
        applyBtn.textContent = 'Apply Filters';
        applyBtn.addEventListener('click', () => {
            filterProducts();
            closeMobileFilter();
        });
        mobileFiltersContent.appendChild(applyBtn);
    }
    
    if (filterMobileBtn && filterOverlay && filterMobile && filterClose) {
        filterMobileBtn.addEventListener('click', () => {
            filterOverlay.classList.add('active');
            filterMobile.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        filterClose.addEventListener('click', closeMobileFilter);
        
        filterOverlay.addEventListener('click', (e) => {
            if (e.target === filterOverlay) closeMobileFilter();
        });
    }
    
    function closeMobileFilter() {
        filterOverlay?.classList.remove('active');
        filterMobile?.classList.remove('active');
        document.body.style.overflow = '';
    }
}

console.log('Browse page loaded!');