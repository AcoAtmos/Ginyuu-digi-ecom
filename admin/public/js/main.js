// Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
      }
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Modal
function showModal({ title, body, footer = '' }) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Sidebar
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', document.getElementById('sidebar').classList.contains('collapsed'));
});
document.getElementById('mobileToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  document.getElementById('sidebar')?.classList.add('collapsed');
}

// Auth check
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify');
    const data = await res.json();
    if (data.data?.user) {
      const user = data.data.user;
      document.getElementById('adminName').textContent = user.username || 'Admin';
      document.getElementById('adminRole').textContent = user.role || 'Administrator';
      document.getElementById('adminAvatar').textContent = (user.username || 'A')[0].toUpperCase();
      return user;
    }
    if (!window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    return null;
  } catch {
    if (!window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    return null;
  }
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/auth/login';
    }
  } catch {
    window.location.href = '/auth/login';
  }
});

// Fetch wrapper
async function api(path, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const res = await fetch(path, {
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// Confirm dialog
function confirmAction(message) {
  return new Promise((resolve) => {
    showModal({
      title: 'Confirm',
      body: `<p style="color:#999;font-size:14px">${message}</p>`,
      footer: `
        <button class="btn btn-ghost" onclick="closeModal(); resolve(false)">Cancel</button>
        <button class="btn btn-danger" onclick="closeModal(); resolve(true)">Delete</button>
      `
    });
    window.resolve = resolve;
  });
}

// Format helpers
function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function statusBadge(status) {
  const s = (status || '').toLowerCase();
  const cls = s === 'admin' ? 'badge-admin'
    : s === 'member' ? 'badge-member'
    : s === 'active' ? 'badge-active'
    : s === 'inactive' ? 'badge-inactive'
    : s === 'pending' ? 'badge-pending'
    : s === 'paid' || s === 'completed' ? 'badge-paid'
    : 'badge-cancelled';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
}
