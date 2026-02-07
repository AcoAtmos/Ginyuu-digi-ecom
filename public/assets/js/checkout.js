// ================== GLOBAL STATE ==================
let discount = 0.2; //example discount
let qty = 1;
// ================== LOAD DATA ==================
document.addEventListener('DOMContentLoaded', async () => {
    // Check user (cek token)
    const token = localStorage.getItem('token');
    if (token){
        const isValid = await verifyToken(token);
        if(!isValid){
            localStorage.removeItem('token');
            showUserForm();
        }else{
            hideUserForm();
        }
    }else{
        showUserForm();
    }

    // get products
    const slug = window.location.pathname.split("/")[3];
    const product = await hit_api_getproduct(slug);
    console.log(product);
    // set product
    if(product){
        cartProduct(product);
        countTotal(product, qty);
    }
    
});

// ================== API ==================
async function hit_api_getproduct(slug) {
    try {
        const res = await fetch(`http://localhost:4100/api/get_product/${slug}`);
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

// // async function hit_api_submit() {
    // //     try {
        // //         const res = await fetch(`http://localhost:4100/api/submit/`);
        // //         const json = await res.json();
        // //         console.log(json);
        // //         return json.data;
        // //     } catch (err) {
            // //         console.error(err);
            // //         return null;
            // //     }
            // // }

// ================== VALIDATION & SUBMISSION ================== 
async function validateForm(event) {
    event.preventDefault();
    const alerts = [];

    // 2. User Details
    if (!document.getElementById('username').value.trim()) alerts.push("Username is required.");
    if (!document.getElementById('email').value.trim()) alerts.push("Email is required.");

    // 3. Password
    const pass = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    if (!pass) alerts.push("Password is required.");
    if (pass !== confirmPass) alerts.push("Passwords do not match.");

    // 4. Phone & WhatsApp
    const phone = document.getElementById('phone').value;
    if (!phone) {
            alerts.push("Phone number is required.");
    } else {
            await hit_api_check_whatsapp();
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
async function submitForm(event){
    event.preventDefault();
    const payload = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        payment_method: document.querySelector('input[name="payment_method"]:checked').value,
        bank_name: document.getElementById('bank-name').value,
        ewallet_name: document.getElementById('ewallet-name').value,
        terms: document.getElementById('terms').checked,
    };
    console.log(payload);
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



