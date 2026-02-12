

document.addEventListener('DOMContentLoaded', async function() {
    const data = await hit_api_get_product_home();
    console.log(data.new_arrival);
    
    await set_dom_product_home(data);
})

// hit api get product home
async function hit_api_get_product_home(){
    try {
        const response = await fetch('http://localhost:4100/api/product/home');
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.log(error); 
        return [];
    }
}

// set DOM product home
async function set_dom_product_home(data){
    // item
    const new_arrival = data.new_arrival;
    const top_selling = data.top_selling;

    // container
    const container_new_arrival = document.getElementById('grid_new_arrival_container');
    const container_top_selling = document.getElementById('grid_top_selling_container');

    // inner HTML 
    let new_arrival_html = '';
    let top_selling_html = '';

    new_arrival.forEach(item => {
        new_arrival_html += `
        <div class="product-card" data-product="${item.id}">
                <div class="product-image">
                    <span class="product-icon"><img src="${item.gallery_images}" alt="Product Image"></span>
                    <span class="product-badge">NEW</span>
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
    });

    top_selling.forEach(item => { 
        top_selling_html += `
            <div class="product-card" data-product="5">
                <div class="product-image">
                    <span class="product-icon"><img src="${item.gallery_images}" alt="Product Image"></span>
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
    })



    container_new_arrival.innerHTML = new_arrival_html;
    container_top_selling.innerHTML = top_selling_html;
    
}