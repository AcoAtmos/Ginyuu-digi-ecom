// ============== Profile Page ==================
import { isCookieSet, getCookie } from "/assets/js/main/main.js"; 

let userRole = 'MEMBER';

document.addEventListener("DOMContentLoaded", async function() {
    await loadProfile();
    await loadPurchases();
});

async function loadProfile() {
    try {
        const res = await fetch(`${window.BE_URL}/api/profile/me`, {
            credentials: "include"
        });
        const data = await res.json();
        
        if (data.success) {
            userRole = data.data.role || 'MEMBER';
            const user = data.data;
            document.getElementById('profileUsername').textContent = user.username;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profilePhone').textContent = user.phone || '-';
            document.getElementById('profileRole').textContent = user.role;
            document.getElementById('profileCreated').textContent = new Date(user.created_at).toLocaleDateString('id-ID');
            // Set first letter as avatar
            const avatar = document.getElementById('profileAvatar');
            if (avatar) avatar.textContent = user.username?.charAt(0).toUpperCase() || 'X';
        }
    } catch (err) {
        console.error('Error loading profile:', err);
        window.location.href = "/page/login";
    }
}

async function loadPurchases() {
    try {
        const res = await fetch(`${window.BE_URL}/api/purchases`, {
            credentials: "include"
        });
        const data = await res.json();
        console.log('Purchases response:', data);
        
        if (data.success) {
            renderPurchaseList(data.data);
        } else {
            document.getElementById('purchaseTableBody').innerHTML = `<tr><td colspan="7" style="text-align:center;">${data.message || 'Error loading purchases'}</td></tr>`;
        }
    } catch (err) {
        console.error('Error loading purchases:', err);
    }
}

function renderPurchaseList(purchases) {
    const tbody = document.getElementById('purchaseTableBody');
    const thead = document.getElementById('purchaseTableHeader');
    if (!tbody) return;
    
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada purchases</td></tr>';
        return;
    }
    
    const isAdmin = userRole === 'admin';
    
    // Update header based on role
    if (thead) {
        thead.innerHTML = isAdmin 
            ? '<th>Buyer</th><th>Product</th><th>Date</th><th>Total</th><th>Invoice</th><th>Payment</th><th>Status</th>'
            : '<th>Product</th><th>Date</th><th>Total</th><th>Invoice</th><th>Payment</th><th>Status</th>';
    }
    
    tbody.innerHTML = purchases.map(p => `
        <tr>
            ${isAdmin ? `<td>${p.buyer || '-'}</td>` : ''}
            <td>${p.product_name}</td>
            <td>${new Date(p.purchase_date).toLocaleDateString('id-ID')}</td>
            <td>${formatCurrency(p.total_price || p.subtotal)}</td>
            <td>${p.invoice_number || '-'}</td>
            <td>${p.payment_method || '-'}</td>
            <td><span class="status-badge status-${p.payment_status || 'pending'}">${p.payment_status || 'pending'}</span></td>
        </tr>
    `).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}