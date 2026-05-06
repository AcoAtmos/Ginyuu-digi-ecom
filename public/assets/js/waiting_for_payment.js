import { showToast } from '../../common/main/main.js';

const BE_URL = 'http://localhost:4100';

let orderData = null;
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const invoiceNumber = params.get('invoice');

  if (!invoiceNumber) {
    showToast('⚠️ Invoice tidak ditemukan');
    setTimeout(() => { window.location.href = '/'; }, 2000);
    return;
  }

  await loadOrderData(invoiceNumber);
  setupButtons();
});

async function loadOrderData(invoiceNumber) {
  try {
    const res = await fetch(`${BE_URL}/api/get_invoice/${encodeURIComponent(invoiceNumber)}`);
    const json = await res.json();

    if (json.status === 'failed' || !json.data) {
      showToast('❌ Invoice tidak ditemukan');
      setTimeout(() => { window.location.href = '/'; }, 2000);
      return;
    }

    orderData = json.data;

    if (orderData.status === 'paid') {
      showPaidOverlay();
      return;
    }

    renderPage();
    startCountdown();
  } catch (err) {
    console.error('Load order error:', err);
    showToast('❌ Gagal memuat data pesanan');
    setTimeout(() => { window.location.href = '/'; }, 2000);
  }
}

function renderPage() {
  const d = orderData;

  document.getElementById('orderIdBadge').textContent = '#' + d.invoice_number;
  document.getElementById('cancelOrderId').textContent = '#' + d.invoice_number;
  document.getElementById('paidOrderId').textContent = '#' + d.invoice_number;

  document.getElementById('custName').textContent = d.username || '—';
  document.getElementById('custEmail').textContent = d.email || '—';

  const expireAt = new Date(d.issued_at);
  expireAt.setDate(expireAt.getDate() + 3);
  document.getElementById('expireTime').textContent =
    expireAt.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const createdStr = new Date(d.order_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  document.getElementById('tlOrderCreated').textContent = createdStr;
  document.getElementById('tlCheckoutDone').textContent = createdStr;

  const items = d.items || [];
  document.getElementById('orderItemsList').innerHTML = items.map(item => `
    <div class="order-item">
      <div class="order-item-icon">📦</div>
      <div class="order-item-info">
        <div class="order-item-name">${item.product_name}</div>
        <div class="order-item-cat">${item.product_slug}</div>
      </div>
      <div class="order-item-price">${formatRp(item.price)}</div>
    </div>
  `).join('');

  document.getElementById('priceBreakdown').innerHTML = `
    <div class="price-row"><span class="label">Subtotal</span><span class="value">${formatRp(d.subtotal)}</span></div>
    ${d.discount_amount > 0 ? `<div class="price-row discount"><span class="label">Diskon</span><span class="value">- ${formatRp(d.discount_amount)}</span></div>` : ''}
    <div class="price-row total"><span class="label">Total</span><span class="value">${formatRp(d.total)}</span></div>
  `;

  renderPaymentDetail();
}

function renderPaymentDetail() {
  const d = orderData;
  const body = document.getElementById('paymentDetailBody');
  const title = document.getElementById('pmTitle');
  const icon = document.getElementById('pmTitleIcon');
  const badge = document.getElementById('pmProviderBadge');

  const method = d.payment_method?.toLowerCase() || '';

  if (['bca', 'mandiri', 'bni', 'bri'].includes(method)) {
    const vaNumber = '8277 0041 9982 3341';
    const providerName = method.charAt(0).toUpperCase() + method.slice(1);
    icon.textContent = '🏦';
    title.textContent = `Transfer Bank — ${providerName}`;
    badge.textContent = 'Virtual Account';

    body.innerHTML = `
      <div class="payment-method-row">
        <div class="pm-left">
          <div class="pm-icon-box">🏦</div>
          <div><div class="pm-info-label">Bank Tujuan</div><div class="pm-info-value">${providerName}</div></div>
        </div>
      </div>
      <div class="payment-method-row" style="border-bottom:none;padding-bottom:0;">
        <div style="width:100%">
          <div class="pm-info-label" style="margin-bottom:10px;">Nomor Virtual Account</div>
          <div class="va-box">
            <div class="va-number-row">
              <span class="va-number">${vaNumber}</span>
              <button class="btn-copy" id="copyVABtn" onclick="copyText('${vaNumber}', 'copyVABtn')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Salin
              </button>
            </div>
            <div class="va-note">⚠️ Pembayaran hanya berlaku 1x.</div>
          </div>
          <div style="margin-top:16px;">
            <div class="pm-info-label" style="margin-bottom:10px;">Cara Bayar</div>
            <div class="ewallet-steps">
              <div class="ewallet-step"><div class="ew-num">1</div><div class="ew-text">Buka aplikasi <strong>M-Banking ${providerName}</strong> atau ATM terdekat</div></div>
              <div class="ewallet-step"><div class="ew-num">2</div><div class="ew-text">Pilih menu <strong>Transfer</strong> → <strong>Virtual Account</strong></div></div>
              <div class="ewallet-step"><div class="ew-num">3</div><div class="ew-text">Masukkan nomor VA: <strong>${vaNumber.replace(/\s/g, '')}</strong></div></div>
              <div class="ewallet-step"><div class="ew-num">4</div><div class="ew-text">Pastikan nama dan nominal sesuai, lalu <strong>Konfirmasi</strong></div></div>
            </div>
          </div>
        </div>
      </div>`;

  } else if (['gopay', 'ovo', 'dana', 'shopeepay'].includes(method)) {
    const providerName = method.charAt(0).toUpperCase() + method.slice(1);
    const payCode = 'DGS' + Math.random().toString(36).substr(2, 8).toUpperCase();
    icon.textContent = '📲';
    title.textContent = `E-Wallet — ${providerName}`;
    badge.textContent = providerName;

    body.innerHTML = `
      <div class="payment-method-row">
        <div class="pm-left">
          <div class="pm-icon-box">📲</div>
          <div><div class="pm-info-label">E-Wallet</div><div class="pm-info-value">${providerName}</div></div>
        </div>
      </div>
      <div class="payment-method-row" style="border-bottom:none;padding-bottom:0;">
        <div style="width:100%">
          <div class="pm-info-label" style="margin-bottom:10px;">Kode Pembayaran</div>
          <div class="va-box">
            <div class="va-number-row">
              <span class="va-number" style="font-size:18px;letter-spacing:3px">${payCode}</span>
              <button class="btn-copy" id="copyEWBtn" onclick="copyText('${payCode}', 'copyEWBtn')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Salin
              </button>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div class="pm-info-label" style="margin-bottom:10px;">Cara Bayar via ${providerName}</div>
            <div class="ewallet-steps">
              <div class="ewallet-step"><div class="ew-num">1</div><div class="ew-text">Buka aplikasi <strong>${providerName}</strong> di ponsel Anda</div></div>
              <div class="ewallet-step"><div class="ew-num">2</div><div class="ew-text">Pilih <strong>Bayar</strong> → <strong>Kode Pembayaran</strong></div></div>
              <div class="ewallet-step"><div class="ew-num">3</div><div class="ew-text">Masukkan kode: <strong>${payCode}</strong></div></div>
              <div class="ewallet-step"><div class="ew-num">4</div><div class="ew-text">Pastikan nominal <strong>${formatRp(d.total)}</strong> dan selesaikan pembayaran</div></div>
            </div>
          </div>
        </div>
      </div>`;

  } else {
    icon.textContent = '⬛';
    title.textContent = 'QRIS';
    badge.textContent = 'Universal';

    const expireAt = new Date(d.issued_at);
    expireAt.setDate(expireAt.getDate() + 3);
    const expireStr = expireAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    body.innerHTML = `
      <div class="qris-box">
        <div class="qris-frame">
          <div class="qris-inner"></div>
          <div class="qris-logo">⬛</div>
        </div>
        <div class="qris-note">Scan QR Code ini menggunakan aplikasi e-wallet apapun. GoPay, OVO, DANA, ShopeePay, dan lainnya.</div>
        <div class="qris-expire">
          QR Code berlaku hingga: <strong style="color:var(--warning)">${expireStr}</strong>
        </div>
        <button class="btn-download-qr" onclick="showToast('⬇️ Mengunduh QR Code…')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download QR Code
        </button>
      </div>`;
  }
}

function startCountdown() {
  const issuedAt = new Date(orderData.issued_at);
  const expireAt = new Date(issuedAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  countdownInterval = setInterval(() => {
    const now = new Date();
    const diff = expireAt - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('cdHour').textContent = '00';
      document.getElementById('cdMin').textContent = '00';
      document.getElementById('cdSec').textContent = '00';
      setTimeout(() => document.getElementById('expiredOverlay').classList.add('show'), 500);
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    setCD('cdHour', pad(h));
    setCD('cdMin', pad(m));
    setCD('cdSec', pad(s));
  }, 1000);
}

function setCD(id, val) {
  const el = document.getElementById(id);
  if (el && el.textContent !== val) {
    el.textContent = val;
    el.classList.add('tick');
    setTimeout(() => el.classList.remove('tick'), 120);
  }
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function setupButtons() {
  document.querySelector('.btn-primary')?.addEventListener('click', checkPaymentStatus);
  document.querySelector('.btn-outline')?.addEventListener('click', checkPaymentStatus);
}

async function checkPaymentStatus() {
  if (!orderData?.invoice_number) return;

  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon) refreshIcon.classList.add('spinning');

  try {
    const res = await fetch(`${BE_URL}/api/get_invoice/${encodeURIComponent(orderData.invoice_number)}`);
    const json = await res.json();

    if (json.data?.status === 'paid') {
      orderData = json.data;
      clearInterval(countdownInterval);
      showPaidOverlay();
    } else {
      showToast('🔄 Status: Menunggu pembayaran');
    }
  } catch (err) {
    showToast('❌ Gagal mengecek status');
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('spinning');
  }
}

function showPaidOverlay() {
  clearInterval(countdownInterval);
  const overlay = document.getElementById('paidOverlay');
  if (overlay) overlay.classList.add('show');
}

window.cancelOrder = async function () {
  if (!orderData?.invoice_number) return;

  clearInterval(countdownInterval);
  document.getElementById('cancelModal').classList.remove('show');

  try {
    const res = await fetch(`${BE_URL}/api/checkout/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: orderData.invoice_number })
    });
    const json = await res.json();

    if (json.status === 'success') {
      showToast('🗑️ Pesanan berhasil dibatalkan');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } else {
      showToast(`❌ ${json.message}`, 'error');
      startCountdown(); // restart if cancel failed
    }
  } catch (err) {
    console.error('Cancel error:', err);
    showToast('❌ Gagal membatalkan pesanan');
    startCountdown();
  }
};

window.copyText = function (text, btnId) {
  navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Tersalin`;
    showToast('✓ Nomor berhasil disalin');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin`;
    }, 2500);
  }).catch(() => showToast('⚠️ Gagal menyalin, coba manual'));
};

function formatRp(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

window.showToast = showToast;
window.cancelOrder = cancelOrder;
window.copyText = copyText;
