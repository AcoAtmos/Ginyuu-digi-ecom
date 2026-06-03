const state = {
  search: '',
  status: '',
  page: 1,
  limit: 10,
  sort: 'desc',
};

async function loadOrders() {
  const tbody = document.getElementById('ordersBody');
  const pagination = document.getElementById('pagination');
  tbody.innerHTML = '<tr><td colspan="8" class="table-empty"><div class="loader"><div class="loader-spinner"></div></div></td></tr>';
  try {
    const params = new URLSearchParams({ search: state.search, status: state.status, sort: state.sort, page: state.page, limit: state.limit });
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (!data.data.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No orders found</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = data.data.map(o => `
      <tr>
        <td><a href="/admin/orders/detail/${o.order_id}" style="color:#fff">${o.invoice_number || '#' + o.order_id}</a></td>
        <td>${o.buyer_username || o.buyer_email}</td>
        <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
        <td>Rp ${(o.total_price || 0).toLocaleString('id-ID')}</td>
        <td>${statusBadge(o.order_status)}</td>
        <td>${statusBadge(o.status_payment)}</td>
        <td>${formatDate(o.purchase_date)}</td>
        <td class="col-actions">
          <a href="/admin/orders/detail/${o.order_id}" class="btn btn-ghost btn-xs">View</a>
          <a href="/admin/orders/edit/${o.order_id}" class="btn btn-ghost btn-xs">Edit</a>
        </td>
      </tr>
    `).join('');

    renderPagination(data.pagination);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Error loading orders</td></tr>';
  }
}

function renderPagination(pg) {
  const el = document.getElementById('pagination');
  if (pg.totalPages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn ${pg.page <= 1 ? 'disabled' : ''}" data-page="${pg.page - 1}" ${pg.page <= 1 ? 'disabled' : ''}>←</button>`;
  for (let i = 1; i <= pg.totalPages; i++) {
    if (i === 1 || i === pg.totalPages || Math.abs(i - pg.page) <= 1) {
      html += `<button class="page-btn ${i === pg.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === pg.page - 2 || i === pg.page + 2) {
      html += `<span class="page-btn disabled">…</span>`;
    }
  }
  html += `<button class="page-btn ${pg.page >= pg.totalPages ? 'disabled' : ''}" data-page="${pg.page + 1}" ${pg.page >= pg.totalPages ? 'disabled' : ''}>→</button>`;
  el.innerHTML = html;
  el.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { state.page = parseInt(btn.dataset.page); loadOrders(); });
  });
}

document.getElementById('searchInput')?.addEventListener('input', (e) => {
  state.search = e.target.value;
  state.page = 1;
  loadOrders();
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
  state.status = e.target.value;
  state.page = 1;
  loadOrders();
});

loadOrders();
