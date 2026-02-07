// Get payment method from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const paymentMethod = urlParams.get('method') || 'qris';

// Show appropriate payment section
function initializePaymentMethod() {
    const qrisSection = document.getElementById('qris-section');
    const bankSection = document.getElementById('bank-section');
    const ewalletSection = document.getElementById('ewallet-section');
    const paymentBadge = document.getElementById('payment-badge');
    const instructionList = document.getElementById('instruction-list');

    // Hide all sections first
    qrisSection.classList.remove('active');
    bankSection.classList.remove('active');
    ewalletSection.classList.remove('active');

    if (paymentMethod === 'qris') {
        qrisSection.classList.add('active');
        paymentBadge.textContent = 'QRIS Payment';
        instructionList.innerHTML = `
            <li>Open your mobile banking or e-wallet app</li>
            <li>Select "Scan QR" or "QRIS" option</li>
            <li>Scan the QR code shown above</li>
            <li>Confirm the payment amount</li>
            <li>Complete the transaction</li>
        `;
    } else if (paymentMethod === 'bank') {
        bankSection.classList.add('active');
        paymentBadge.textContent = 'Bank Transfer';
        instructionList.innerHTML = `
            <li>Open your mobile banking or ATM</li>
            <li>Select "Transfer" menu</li>
            <li>Enter the bank account number shown above</li>
            <li>Enter the exact transfer amount</li>
            <li>Complete the transaction and save the receipt</li>
        `;
    } else if (paymentMethod === 'ewallet') {
        ewalletSection.classList.add('active');
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
initializePaymentMethod();

// Simulate payment check every 5 seconds
setInterval(() => {
    console.log('Auto-checking payment status...');
}, 5000);