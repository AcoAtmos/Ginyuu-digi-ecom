//====================== main.js =======================
import { isCookieSet, getCookie } from "./main/main.js";
// ================== GLOBAL STATE ==================
let discount = 0; //example discount
let qty = 1;
let currentProduct = null;
let currentSlug = window.location.pathname.split("/")[3];

const username = document.getElementById('username');
const password = document.getElementById('password');
const confirmPass = document.getElementById('confirm-password');
const email = document.getElementById('email');
const phone = document.getElementById('phone');

// ================== LOAD DATA ==================
document.addEventListener("DOMContentLoaded", async () => {
    // Check user (cek token)
    const token = getCookie('token');
    // console.log(token);
    if (!token){
        emptyUserForm();
    }else{
        const isValid = await hit_api_verify_token(token);
        if(!isValid){
            emptyUserForm();
        }else{
            fillUserform();
        }
    }

    // get products
    const product = await hit_api_getproduct(currentSlug);
    // set product
    if(product){
        currentProduct = product;
        cartProduct(product);
        countTotal(product, qty);
    }
    
    // Add submit event to form
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', validateAndSubmit);
    }
});

// ================== API ==================
async function hit_api_getproduct(slug) {
    try {
        const res = await fetch(`${window.BE_URL}/api/get_product/${slug}`);
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
        const result = await fetch (`${window.BE_URL}/api/check_whatsapp/${phone_number}`)
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

async function hit_api_verify_token() {
    try {
        const token = getCookie('token');
        if (!token) return null;
        
        const result = await fetch (`${window.BE_URL}/api/auth/verify_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        const json = await result.json();
        console.log(json);
        
        if(json.status === "success"){
            return true;
        }else{
            return false;
        }
    }catch (error){
        console.error(error)
        return false;
    }
}
async function hit_api_submit() {
        try {
                const res = await fetch(`${window.BE_URL}/api/submit/`);
                const json = await res.json();
                console.log(json);
                return json.data;
            } catch (err) {
                    console.error(err);
                    return null;
                }
            }

// ================== VALIDATION & SUBMISSION ================== 
async function validateAndSubmit(event) {
    event.preventDefault();
    const alerts = [];

    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const confirmPassEl = document.getElementById('confirm-password');
    const phoneEl = document.getElementById('phone');

    // 1. User Details
    if (!usernameEl || !usernameEl.value.trim()) alerts.push("Username is required.");
    if (!emailEl || !emailEl.value.trim()) alerts.push("Email is required.");

    // 2. Password (only for new users)
    const pass = passwordEl ? passwordEl.value : '';
    const confirmPass = confirmPassEl ? confirmPassEl.value : '';
    const token = getCookie('token');
    const isExistingUser = token && await hit_api_verify_token(token);
    
    if (!isExistingUser) {
        if (!pass) {
            alerts.push("Password is required for new users.");
        } else if (pass !== confirmPass) {
            alerts.push("Passwords do not match.");
        }
    }

    // 3. Phone & WhatsApp
    const phoneVal = phoneEl ? phoneEl.value : '';
    if (!phoneVal) {
        alerts.push("Phone number is required.");
    }

    // 4. Payment Method
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
    if (!paymentMethod) {
        alerts.push("Please select a payment method.");
    } else {
        const method = paymentMethod.value;
        if (method === 'bank') {
            const bankName = document.getElementById('bank-name')?.value;
            if (!bankName) alerts.push("Please select a bank.");
        } else if (method === 'ewallet') {
            const ewalletName = document.getElementById('ewallet-name')?.value;
            if (!ewalletName) alerts.push("Please select an E-Wallet.");
        }
    }
                    
    // 5. Terms
    const termsEl = document.getElementById('terms');
    if (termsEl && !termsEl.checked) alerts.push("You must agree to the Terms and Conditions.");
                    
    // Result
    if (alerts.length > 0) {
        alert(alerts.join("\n"));
        return;
    }

    // Submit form
    await submitForm();
}

async function submitForm(){
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
    
    const payload = {
        username: document.getElementById('username')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        password: document.getElementById('password')?.value || null,
        phone: document.getElementById('phone')?.value.trim() || '',
        payment_method: paymentMethod,
        productId: currentProduct?.id,
        amount: qty,
        discount: discount,
        terms: document.getElementById('terms')?.checked || true
    };
    
    console.log("Submitting payload:", payload);

    try {
        const response = await fetch(`${window.BE_URL}/api/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Checkout response:", result);

        // Handle email already registered - redirect to login
        if (result.status === 'failed' && result.message === 'EMAIL_ALREADY_REGISTERED') {
            showToast('Email ini sudah terdaftar. Silakan login terlebih dahulu.', 'error');
            setTimeout(() => {
                window.location.href = '/page/login';
            }, 2000);
            return;
        }

        if (result.status === 'success' && result.data && result.data.payload) {
            const invoiceNumber = result.data.payload.invoice_number;
            // Redirect to waiting payment page with invoice number
            window.location.href = `/page/checkout/waiting-payment?invoice=${invoiceNumber}`;
        } else {
            alert(result.message || 'Checkout failed. Please try again.');
        }
    } catch (err) {
        console.error("Checkout error:", err);
        alert('An error occurred during checkout. Please try again.');
    }
}

// ================== TOAST NOTIFICATION ==================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    
    const btn = toast.querySelector('button');
    btn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.8;
    `;
    btn.onmouseover = () => btn.style.opacity = '1';
    btn.onmouseout = () => btn.style.opacity = '0.8';
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 4000);
}

// ================== USER ==================
async function fillUserform(){
    const user = JSON.parse(localStorage.getItem('user'));
    username.value = user.username;
    // password.value = user.password;
    // confirmPass.value = user.password;
    email.value = user.email;
    phone.value = user.phone;

    // disable input
    username.disabled = true;
    email.disabled = true;
    phone.disabled = true;

    // remove passowrd input
    const paswordForm = document.querySelectorAll('.dataNeeded')
    paswordForm.forEach((form) => {
        form.remove();
    })
}
async function emptyUserForm(){
    if (username) username.value = "";
    if (password) password.value = "";
    if (confirmPass) confirmPass.value = "";
    if (email) email.value = "";
    if (phone) phone.value = "";
}
// ================== BONUS DISCOUNT LOGIC ==================
// function checkBonusEligibility() {
//     const selectedProduct = selectProduct.value;

//     // reset
//     bonusNotification.style.display = 'none';
//     discountAppliedNotice.style.display = 'none';
//     discount = 0;

//     // eco1 → tawarkan upgrade
//     if (selectedProduct === 'eco1') {
//         bonusNotification.style.display = 'block';
//     }

//     // eco2 → tawarkan upgrade
//     if (selectedProduct === 'eco2') {
//         bonusNotification.style.display = 'block';
//     }

//     // eco3 → auto diskon
//     if (selectedProduct === 'eco3') {
//         discountAppliedNotice.style.display = 'block';
//         discount = 0.3;
//         countTotal();
//     }
// }

// ================== REVIEW ==================
function cartProduct(product) {
    // review cart
    const productItem = document.getElementById('product-item');
    productItem.innerHTML = `
        <div class="product-info">
            <div class="product-name"> ${product.title} </div>
        </div>
        <div class="product-price">RP. ${product.price} </div>`
    ;
}

function countTotal(product, qty) {
    const subTotalEl = document.querySelector('#summary .subtotal span:last-child');
    const discountEl = document.querySelector('#summary .discount span:last-child');
    const totalEl = document.querySelector('#summary .total span:last-child');

    if (!product) {
        subTotalEl.textContent = 'RP. 0';
        discountEl.textContent = '-RP. 0';
        totalEl.textContent = 'RP. 0';
        return;
    }

    const sub = product.price * qty;
    const cut = sub * discount;

    subTotalEl.textContent = `RP. ${sub.toLocaleString('id-ID')}`;
    discountEl.textContent = `-RP. ${cut.toLocaleString('id-ID')}`;
    totalEl.textContent = `RP. ${(sub - cut).toLocaleString('id-ID')}`;
}

// // ================== EVENTS ==================
// upgradeBtn.addEventListener('click', () => {
//     selectProduct.value = 'eco3';
//     discount = 0.3;

//     bonusNotification.style.display = 'none';
//     discountAppliedNotice.style.display = 'block';

//     updateReviewCart();
//     countTotal();
// });


// // =========== PAYMENT METHOD TOGGLE ==========
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



