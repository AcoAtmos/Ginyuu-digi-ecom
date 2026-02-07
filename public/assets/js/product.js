
// ============ LOAD DOCUMENT ============
document.addEventListener('DOMContentLoaded', async () => {
    // get product from api
    const fetchedProducts = await hit_api_getproduct();
    // if product not found
    if (!fetchedProducts) return;
    // set product to DOM
    setProductDOM(fetchedProducts);
    // setup modal events
    setupModalEvents();
    // checkout
    setupCheckout();
});

// ============ HIT API  ====================
async function hit_api_getproduct() {
    try {
        const res = await fetch("http://localhost:4100/api/get_product/");
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ============ SET PRODUCT DOM ============
function setProductDOM(products) {
    const productGrid = document.getElementById('products-grid');
    // Clear existing content except the modal
    const modal = document.getElementById('productModal');
    productGrid.innerHTML = '';
    productGrid.appendChild(modal);

    Object.values(products).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Format price
        const priceFormatted = parseInt(product.price).toLocaleString('id-ID');

        productCard.innerHTML = `
            <div class="product-image">${product.category || 'Product'}</div>
            <div class="product-body">
                <h3 class="product-title">${product.name || product.title}</h3>
                <p class="product-desc">${product.description || 'No description available.'}</p>
                <div class="product-footer">
                  <div class="price">Rp ${priceFormatted}</div>
                  <button class="btn-buy" 
                    data-id="${product.id}"
                    data-slug="${product.slug}"
                    data-title="${product.name || product.title}"
                    data-price="${priceFormatted}"
                    data-desc="${product.description || ''}"
                    data-image="${product.image || ''}"
                    data-tags="${product.tags || ''}"
                  >Buy Now</button>
                </div>
            </div>    
        `;
        productGrid.insertBefore(productCard, modal);
    });

    // Attach event listeners to new buttons
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openModal(e.target.dataset);
        });
    });
}

// ============ MODAL LOGIC ============
function setupModalEvents(){
    const modal = document.getElementById('productModal');
    const closeButtons = document.querySelectorAll('.modal-close, #closeModalBtn');

    // Close modal actions
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    // Close when clicking overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });


}

function openModal(data) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDescription');
    const modalImage = document.getElementById('modalImage');
    const modalTags = document.getElementById('modalTags');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Populate data
    modalTitle.textContent = data.title || 'Untitled Product';
    modalPrice.textContent = `Rp ${data.price}`;
    modalDesc.textContent = data.desc || 'No description available.';
    
    // Store slug on checkout button
    if(checkoutBtn){
        checkoutBtn.dataset.slug = data.slug || '';
    }

    // Image fallback
    modalImage.src = data.image ? data.image : 'https://via.placeholder.com/720x280?text=Preview';

    // Tags
    modalTags.innerHTML = '';
    if (data.tags) {
        data.tags.split(',').forEach(tag => {
            if(tag.trim()){
                const span = document.createElement('span');
                span.className = 'modal-tag';
                span.textContent = tag.trim();
                modalTags.appendChild(span);
            }
        });
    }

    // Show modal
    modal.classList.add('active');
}

// ============ CHECKOUT LOGIC ============
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    checkoutBtn.addEventListener('click', () => {
        const slug = checkoutBtn.dataset.slug;
        if (slug) {
            window.location.href = `http://localhost:3100/page/checkout/${slug}`;
        } else {
            alert("No product selected");
        }
    });
}

