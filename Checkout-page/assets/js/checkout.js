// ================== GLOBAL STATE ==================
let products = {};
let discount = 0;

// ================== LOAD DATA ==================
document.addEventListener('DOMContentLoaded', async () => {
    // // Check user (cek token)
    const token = localStorage.getItem('token');
    if (token){
        const isValid = await verifyToken(token);
        if(!isValid){
            localStorage.removeItem('token');
            showUserForm();
        }else{
            hideUserForm();
            preLoaduserData();
        }
    }else{
        showUserForm();
    }
    // get products
    const fetchedProducts = await hit_api_getproduct();
    if (!fetchedProducts) return;

    // Transform array to object keyed by code
    products = fetchedProducts.reduce((acc, product) => {
        acc[product.code] = product;
        return acc;
    }, {});

    setProductDOM(products);

});

// ================== API ==================
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
async function hit_api_check_whatsapp() {
    const phoneError = document.getElementById("phone-error");
    try {
        const phone = document.getElementById("phone").value;
        if (!phone) return null;

        const phone_number = parseInt(phone);
        const result = await fetch (`http://localhost:4100/api/check_whatsapp/${phone_number}`)
        const json = await result.json();
        console.log(json);
        
        if(json.status === "success"){
            phoneError.style.display = "block";
            phoneError.textContent = "Number is on whatsapp";
            phoneError.style.color = "green";
            return true;
        }else{
            phoneError.style.display = "block";
            phoneError.textContent = "Number is not on whatsapp";
            phoneError.style.color = "red";
            return false;
        }
    }catch (error){
        console.error(error)
        return false;
    }
}
async function hit_api_submit() {
    try {
        const res = await fetch(`http://localhost:4100/api/submit/`);
        const json = await res.json();
        console.log(json);
        return json.data;
    } catch (err) {
        console.error(err);
        return null;
    }
}
// ================== VALIDATION & SUBMISSION ==================
async function validateForm() {
    
    const alerts = [];

    // 1. Product
    if (!selectProduct.value) alerts.push("Please select a product.");
    if (productAmountInput.value < 1) alerts.push("Product amount must be at least 1.");

    // 2. User Details
    if (!document.getElementById('username').value.trim()) alerts.push("Username is required.");
    if (!document.getElementById('email').value.trim()) alerts.push("Email is required.");
    
    // 3. Password
    const pass = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    if (!pass) alerts.push("Password is required.");
    if (pass !== confirmPass) alerts.push("Passwords do not match.");

    // 4. Phone & WhatsApp
    const phoneVal = document.getElementById('phone').value;
    if (!phoneVal) {
        alerts.push("Phone number is required.");
    } else {
        const isValidWA = await hit_api_check_whatsapp();
        if (!isValidWA) alerts.push("Phone number is not registered on WhatsApp.");
    }

    // 5. Payment Method
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
    if (!paymentMethod) {
        alerts.push("Please select a payment method.");
    } else {
        const method = paymentMethod.value;
        if (method === 'bank') {
            if (!document.getElementById('bank-name').value) alerts.push("Please select a bank.");
        } else if (method === 'ewallet') {
            if (!document.getElementById('ewallet-name').value) alerts.push("Please select an E-Wallet.");
        }
    }

    // 6. Terms
    if (!document.getElementById('terms').checked) alerts.push("You must agree to the Terms and Conditions.");

    // Result
    if (alerts.length > 0) {
        alert(alerts.join("\n"));
        return;
    }

    alert("Validation Success! Proceeding to payment...");
    // submit logic here...
}
// ================== DOM PRODUCT ==================
function setProductDOM(products) {
    const select = document.getElementById('product-selection');
    select.innerHTML = '<option value="">-- Pilih Produk --</option>';

    Object.values(products).forEach(product => {
        const opt = document.createElement('option');
        opt.value = product.code; //  eco1 / eco2 / eco3
        opt.textContent = `${product.name} - RP. ${product.price.toLocaleString('id-ID')}`;
        select.appendChild(opt);
    });
}

// ================== USER ==================
async function hideUserForm(){
    const userForm = document.getElementById('user-form');
    userForm.style.display = 'none';
}
async function showUserForm(){
    const userForm = document.getElementById('user-form');
    userForm.style.display = 'block';
}

// ================== ELEMENTS GLOBAL ==================
const selectProduct = document.getElementById('product-selection');
const productAmountInput = document.getElementById('product-amount');
const discountInput = document.getElementById('discount-input');

const subTotalEl = document.querySelector('#summary .subtotal span:last-child');
const discountEl = document.querySelector('#summary .discount span:last-child');
const totalEl = document.querySelector('#summary .total span:last-child');

const reviewName = document.querySelector('.product-name');
const reviewQty = document.querySelector('.product-qty');
const reviewPrice = document.querySelector('.product-price');

const bonusNotification = document.getElementById('bonus-notification');
const discountAppliedNotice = document.getElementById('discount-applied-notice');
const upgradeBtn = document.getElementById('upgrade-btn');


// ================== BONUS DISCOUNT LOGIC ==================
function checkBonusEligibility() {
    const selectedProduct = selectProduct.value;

    // reset
    bonusNotification.style.display = 'none';
    discountAppliedNotice.style.display = 'none';
    discount = 0;

    // eco1 → tawarkan upgrade
    if (selectedProduct === 'eco1') {
        bonusNotification.style.display = 'block';
    }

    // eco2 → tawarkan upgrade
    if (selectedProduct === 'eco2') {
        bonusNotification.style.display = 'block';
    }

    // eco3 → auto diskon
    if (selectedProduct === 'eco3') {
        discountAppliedNotice.style.display = 'block';
        discount = 0.3;
        countTotal();
    }
}

// ================== REVIEW ==================
function updateReviewCart() {
    const key = selectProduct.value;
    const qty = parseInt(productAmountInput.value) || 1;

    if (!key || !products[key]) {
        reviewName.textContent = 'No product selected';
        reviewQty.textContent = '0x';
        reviewPrice.textContent = 'RP. 0';
        return;
    }

    const product = products[key];
    const total = product.price * qty;

    reviewName.textContent = product.name;
    reviewQty.textContent = `${qty}x`;
    reviewPrice.textContent = `RP. ${total.toLocaleString('id-ID')}`;
}

// ================== TOTAL ==================
function countTotal() {
    const key = selectProduct.value;
    const qty = parseInt(productAmountInput.value) || 1;

    if (!key || !products[key]) {
        subTotalEl.textContent = 'RP. 0';
        discountEl.textContent = '-RP. 0';
        totalEl.textContent = 'RP. 0';
        return;
    }

    const sub = products[key].price * qty;
    const cut = sub * discount;

    subTotalEl.textContent = `RP. ${sub.toLocaleString('id-ID')}`;
    discountEl.textContent = `-RP. ${cut.toLocaleString('id-ID')}`;
    totalEl.textContent = `RP. ${(sub - cut).toLocaleString('id-ID')}`;
}

// ================== EVENTS ==================
selectProduct.addEventListener('change', () => {
    if (!productAmountInput.value || productAmountInput.value < 1) {
        productAmountInput.value = 1;
    }
    checkBonusEligibility();
    updateReviewCart();
    countTotal();
});

productAmountInput.addEventListener('input', () => {
    if (productAmountInput.value < 1) productAmountInput.value = 1;
    updateReviewCart();
    countTotal();
});

upgradeBtn.addEventListener('click', () => {
    selectProduct.value = 'eco3';
    discount = 0.3;

    bonusNotification.style.display = 'none';
    discountAppliedNotice.style.display = 'block';

    updateReviewCart();
    countTotal();
});


// =========== PAYMENT METHOD TOGGLE ==========
const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
const bankInput = document.getElementById('bank-input');
const ewalletInput = document.getElementById('ewallet-input');

function togglePaymentInputs() {
    const method = document.querySelector('input[name="payment_method"]:checked')?.value;

    // Reset both to hidden
    if(bankInput) bankInput.style.display = 'none';
    if(ewalletInput) ewalletInput.style.display = 'none';

    if (method === 'bank' && bankInput) {
        bankInput.style.display = 'flex';
    } else if (method === 'ewallet' && ewalletInput) {
        ewalletInput.style.display = 'flex';
    }
}

paymentRadios.forEach(radio => {
    radio.addEventListener('change', togglePaymentInputs);
});

// Initialize payment inputs state
togglePaymentInputs();



