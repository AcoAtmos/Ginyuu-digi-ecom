const state = {
  search: '',
  page: 1,
  limit: 10,
  sort: 'desc',
};

async function loadUsers() {
  const tbody = document.getElementById('usersBody');
  const pagination = document.getElementById('pagination');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty"><div class="loader"><div class="loader-spinner"></div></div></td></tr>';
  try {
    const params = new URLSearchParams({ search: state.search, sort: state.sort, page: state.page, limit: state.limit });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (!data.data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No customers found</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    tbody.innerHTML = data.data.map(u => `
      <tr>
        <td><a href="/admin/users/detail/${u.id}" style="color:#fff">${u.username}</a></td>
        <td>${u.email}</td>
        <td>${u.phone || '—'}</td>
        <td>${statusBadge(u.role)}</td>
        <td>${statusBadge(u.status)}</td>
        <td>${formatDate(u.created_at)}</td>
        <td class="col-actions">
          <a href="/admin/users/edit/${u.id}" class="btn btn-ghost btn-xs">Edit</a>
          <button class="btn btn-ghost btn-xs" onclick="deleteUser(${u.id})" style="color:#ef4444">Delete</button>
        </td>
      </tr>
    `).join('');

    renderPagination(data.pagination);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading customers</td></tr>';
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
    btn.addEventListener('click', () => { state.page = parseInt(btn.dataset.page); loadUsers(); });
  });
}

async function deleteUser(id) {
  if (!confirm('Delete this customer? This cannot be undone.')) return;
  try {
    const res = await fetch(`/api/admin/users/delete/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Customer deleted'); loadUsers(); }
    else showToast(data.message, 'error');
  } catch { showToast('Delete failed', 'error'); }
}

document.getElementById('searchInput')?.addEventListener('input', (e) => {
  state.search = e.target.value;
  state.page = 1;
  loadUsers();
});

loadUsers();
