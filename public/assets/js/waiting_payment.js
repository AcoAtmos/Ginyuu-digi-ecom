// Get invoice number from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const invoiceNumber = urlParams.get('invoice');
let paymentMethod = 'qris';
let invoiceData = null;

// Fetch invoice data from API
async function fetchInvoiceData() {
    if (!invoiceNumber) {
        console.error('No invoice number provided');
        return null;
    }

    try {
        const response = await fetch(`${window.BE_URL}/api/get_invoice/${encodeURIComponent(invoiceNumber)}`);
        const result = await response.json();
        console.log('Invoice data:', result);
        
        if (result.status === 'success' && result.data) {
            invoiceData = result.data;
            paymentMethod = result.data.payment_method || 'qris';
            return result.data;
        } else {
            console.error('Invoice not found:', result.message);
            return null;
        }
    } catch (err) {
        console.error('Error fetching invoice:', err);
        return null;
    }
}

// Display invoice data on page
function displayInvoiceData(data) {
    if (!data) return;

    // Payment method badge
    const paymentBadge = document.getElementById('payment-badge');
    const methodLabels = {
        'qris': 'QRIS Payment',
        'bank': 'Bank Transfer',
        'ewallet': 'E-Wallet'
    };
    paymentBadge.textContent = methodLabels[paymentMethod] || 'QRIS Payment';

    // Invoice Number
    const invoiceNumEl = document.getElementById('invoice-number');
    if (invoiceNumEl) invoiceNumEl.textContent = data.invoice_number || '-';

    // Buyer Name
    const buyerNameEl = document.getElementById('buyer-name');
    if (buyerNameEl) buyerNameEl.textContent = data.username || '-';

    // Product name
    const productNameEl = document.getElementById('product-name');
    if (productNameEl) productNameEl.textContent = data.product_title || 'Product';

    // Quantity
    const quantityEl = document.getElementById('quantity');
    if (quantityEl) quantityEl.textContent = `${data.amount || 1}x`;

    // Discount
    const discountEl = document.getElementById('discount-value');
    if (discountEl) {
        const discountAmount = data.discount_amount || 0;
        if (discountAmount > 0) {
            discountEl.textContent = `Rp. ${parseInt(discountAmount).toLocaleString('id-ID')}`;
        } else {
            discountEl.textContent = 'RP. 0';
        }
    }

    // Total amount
    const totalEl = document.getElementById('total-amount');
    if (totalEl) totalEl.textContent = `Rp. ${parseInt(data.total).toLocaleString('id-ID')}`;

    // Transfer amount (for bank section)
    const transferAmountEl = document.getElementById('transfer-amount');
    if (transferAmountEl) transferAmountEl.textContent = `Rp. ${parseInt(data.total).toLocaleString('id-ID')}`;
}

// Show appropriate payment section
function initializePaymentMethod() {
    const qrisSection = document.getElementById('qris-section');
    const bankSection = document.getElementById('bank-section');
    const ewalletSection = document.getElementById('ewallet-section');
    const paymentBadge = document.getElementById('payment-badge');
    const instructionList = document.getElementById('instruction-list');

    if (paymentMethod === 'qris') {
        qrisSection.style.display = 'block';
        bankSection.style.display = 'none';
        ewalletSection.style.display = 'none';
        paymentBadge.textContent = 'QRIS Payment';
        instructionList.innerHTML = `
            <li>Open your mobile banking or e-wallet app</li>
            <li>Select "Scan QR" or "QRIS" option</li>
            <li>Scan the QR code shown above</li>
            <li>Confirm the payment amount</li>
            <li>Complete the transaction</li>
        `;
    } else if (paymentMethod === 'bank') {
        qrisSection.style.display = 'none';
        bankSection.style.display = 'block';
        ewalletSection.style.display = 'none';
        paymentBadge.textContent = 'Bank Transfer';
        instructionList.innerHTML = `
            <li>Open your mobile banking or ATM</li>
            <li>Select "Transfer" menu</li>
            <li>Enter the bank account number shown above</li>
            <li>Enter the exact transfer amount</li>
            <li>Complete the transaction and save the receipt</li>
        `;
    } else if (paymentMethod === 'ewallet') {
        qrisSection.style.display = 'none';
        bankSection.style.display = 'none';
        ewalletSection.style.display = 'block';
        paymentBadge.textContent = 'E-Wallet Payment';
        instructionList.innerHTML = `
            <li>Select your e-wallet provider above</li>
            <li>Open your e-wallet app</li>
            <li>Select "Transfer" or "Send Money"</li>
            <li>Enter the phone number shown</li>
            <li>Enter the amount and complete the transaction</li>
        `;
    }
}

// Select e-wallet
function selectEwallet(wallet) {
    const cards = document.querySelectorAll('.ewallet-card');
    cards.forEach(card => card.classList.remove('selected'));
    event.target.closest('.ewallet-card').classList.add('selected');

    const ewalletNumberBox = document.getElementById('ewallet-number-box');
    const ewalletNumber = document.getElementById('ewallet-number');
    
    // Show phone number based on wallet
    const walletNumbers = {
        'gopay': '0812-3456-7890',
        'ovo': '0812-3456-7891',
        'dana': '0812-3456-7892',
        'shopeepay': '0812-3456-7893',
        'linkaja': '0812-3456-7894',
        'jenius': '0812-3456-7895'
    };

    ewalletNumber.textContent = walletNumbers[wallet];
    ewalletNumberBox.style.display = 'block';
}

// Copy text to clipboard
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#667eea';
        }, 2000);
    });
}

// Countdown timer
let timeLeft = 900; // 15 minutes in seconds

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('countdown').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft > 0) {
        timeLeft--;
    } else {
        clearInterval(timerInterval);
        alert('Payment time has expired. Please create a new order.');
    }
}

const timerInterval = setInterval(updateTimer, 1000);
updateTimer();

// Check payment status
function checkPayment() {
    alert('Checking payment status...\n\nThis is a demo. In production, this would verify with the payment gateway.');
}

// Initialize on load
async function init() {
    // Fetch invoice data first
    const data = await fetchInvoiceData();
    displayInvoiceData(data);
    
    // Then initialize payment method display
    initializePaymentMethod();
}

init();

// Simulate payment check every 5 seconds
setInterval(() => {
    console.log('Auto-checking payment status...');
}, 5000);