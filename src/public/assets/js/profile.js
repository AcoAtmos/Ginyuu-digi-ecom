// ─────────────────────────────────────────────
// PURCHASES — state management
// ─────────────────────────────────────────────
const ps = { search: "", status: "", sort: "desc", page: 1, limit: 10 };

// PROFILE

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || "Failed to load profile");
      return;
    }

    const user = result.data;
    const nameEl = document.getElementById("profileDisplayName");
    const emailEl = document.getElementById("profileDisplayEmail");
    const sinceEl = document.getElementById("profileDisplaySince");
    const avatarEl = document.getElementById("avatarInitial");
    const usernameInput = document.getElementById("inputUsername");
    const phoneInput = document.getElementById("inputPhone");
    const emailAddrEl = document.getElementById("profileEmailAddr");

    if (nameEl) nameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;
    if (emailAddrEl) emailAddrEl.textContent = user.email;
    if (avatarEl)
      avatarEl.textContent = (user.username || "?").charAt(0).toUpperCase();
    if (usernameInput) usernameInput.value = user.username || "";
    if (phoneInput) phoneInput.value = user.phone || "";

    if (sinceEl && user.createdAt) {
      const d = new Date(user.createdAt);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      sinceEl.textContent = `Member since ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to load profile");
  }
}

function validatePhoneInput(phone) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

async function saveProfile() {
  const username = document.getElementById("inputUsername")?.value.trim();
  const phone = document.getElementById("inputPhone")?.value.trim();

  if (!username) {
    showToast("Username is required");
    return;
  }

  if (phone && !validatePhoneInput(phone)) {
    showToast("Invalid phone number (10-15 digits expected)");
    return;
  }

  try {
    const res = await fetch("/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone }),
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || "Failed to save profile");
      return;
    }

    const user = result.data;
    const nameEl = document.getElementById("profileDisplayName");
    const emailEl = document.getElementById("profileDisplayEmail");
    const avatarEl = document.getElementById("avatarInitial");

    if (nameEl) nameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl)
      avatarEl.textContent = (user.username || "?").charAt(0).toUpperCase();

    localStorage.username = user.username;
    localStorage.email = user.email;
    if (window.updateCurrentUser) {
      window.updateCurrentUser(user.username, user.email);
    }

    showToast("Profile saved successfully");
  } catch (err) {
    console.error(err);
    showToast("Failed to save profile");
  }
}

function resetProfileForm() {
  loadProfile();
  showToast("Changes discarded");
}

function showConfirmModal() {
  document.getElementById("confirmModal")?.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeConfirmModal() {
  document.getElementById("confirmModal")?.classList.remove("show");
  document.body.style.overflow = "";
}

// PURCHASES

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPrice(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function buildOrderCard(o) {
  const s = (o.order_status || "").toLowerCase();
  let statusClass = "status-failed", statusText = "Cancelled";
  if (s === "completed") { statusClass = "status-completed"; statusText = "Completed"; }
  else if (s === "pending") { statusClass = "status-pending"; statusText = "Pending"; }

  let actionsHtml = "";
  if (s === "completed") {
    actionsHtml = `
      <button class="order-action-btn" onclick="showToast('Invoice feature coming soon')">Invoice</button>
      <button class="order-action-btn primary" onclick="showToast('Download coming soon')">⬇ Download</button>`;
  } else {
    const invNum = o.invoice_number || "";
    actionsHtml = `
      <button class="order-action-btn primary" onclick="window.location.href='/checkout/waiting-payment?invoice=${invNum}'">Payment Info</button>`;
  }

  const itemsHtml = (o.items || [])
    .map(item => `
      <div class="order-detail-row">
        <span class="order-detail-name">• ${item.product_name || "Product"}</span>
        <span class="order-detail-price">${formatPrice(item.price || 0)}</span>
      </div>`)
    .join("");

  return `
    <div class="order-card" data-status="${s}">
      <div class="order-card-header">
        <div class="order-thumb">📦</div>
        <div class="order-info">
          <div class="order-title">${o.invoice_number || "Invoice"}</div>
          <div class="order-type">${formatDate(o.purchase_date)} · ${o.payment_method || ""}</div>
          <span class="status-badge ${statusClass}" style="margin-top:6px;display:inline-block">${statusText}</span>
        </div>
        <div class="order-price-col">
          <div class="order-price">${formatPrice(o.total_price)}</div>
          <button class="order-toggle" aria-label="Toggle details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>
      <div class="order-expand">
        <div class="order-details-body">
          ${itemsHtml}
          <div class="order-detail-separator"></div>
          <div class="order-detail-row order-detail-totals">
            <span class="order-detail-name">Subtotal</span>
            <span class="order-detail-price">${formatPrice(o.subtotal || 0)}</span>
          </div>
          ${o.discount_amount ? `
          <div class="order-detail-row order-detail-totals">
            <span class="order-detail-name">Discount</span>
            <span class="order-detail-price order-detail-discount">-${formatPrice(o.discount_amount)}</span>
          </div>` : ""}
          ${o.unique_num ? `
          <div class="order-detail-row order-detail-totals">
            <span class="order-detail-name">Unique Number</span>
            <span class="order-detail-price">-${formatPrice(o.unique_num)}</span>
          </div>` : ""}
          <div class="order-detail-row order-detail-totals order-detail-total-final">
            <span class="order-detail-name">Total</span>
            <span class="order-detail-price">${formatPrice(o.total_price)}</span>
          </div>
          <div class="order-expand-actions">
            ${actionsHtml}
          </div>
        </div>
      </div>
    </div>`;
}

function renderPagination(pg) {
  const el = document.getElementById("purchasesPagination");
  if (!el) return;
  if (!pg || pg.totalPages <= 1) { el.innerHTML = ""; return; }

  let html = '<div class="pagination-inner">';
  if (pg.page > 1) {
    html += `<button class="page-btn" data-page="${pg.page - 1}">‹ Prev</button>`;
  }
  for (let i = 1; i <= pg.totalPages; i++) {
    if (i === pg.page) {
      html += `<span class="page-btn active">${i}</span>`;
    } else if (i === 1 || i === pg.totalPages || Math.abs(i - pg.page) <= 2) {
      html += `<button class="page-btn" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - pg.page) === 3) {
      html += `<span class="page-dots">…</span>`;
    }
  }
  if (pg.page < pg.totalPages) {
    html += `<button class="page-btn" data-page="${pg.page + 1}">Next ›</button>`;
  }
  html += "</div>";
  el.innerHTML = html;
}

async function loadPurchases() {
  const grid = document.getElementById("purchasesGrid");
  const empty = document.getElementById("purchasesEmpty");
  const pagination = document.getElementById("purchasesPagination");
  if (!grid) return;

  try {
    const params = new URLSearchParams({
      search: ps.search,
      status: ps.status,
      sort: ps.sort,
      page: ps.page,
      limit: ps.limit,
    });
    const res = await fetch(`/api/purchases?${params}`);
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || "Failed to load purchases");
      return;
    }

    const orders = result.data;
    const pg = result.pagination;

    // Update sidebar badge (total count)
    const badge = document.querySelector(".nav-badge");
    if (badge && pg) badge.textContent = pg.total;

    if (!orders || orders.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "flex";
      if (pagination) pagination.innerHTML = "";
      return;
    }

    if (empty) empty.style.display = "none";

    grid.innerHTML = orders.map(buildOrderCard).join("");

    // Expand/collapse toggle
    document.querySelectorAll(".order-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".order-card");
        const expand = card.querySelector(".order-expand");
        if (expand) {
          expand.classList.toggle("open");
          btn.classList.toggle("open");
        }
      });
    });

    renderPagination(pg);
  } catch (err) {
    console.error(err);
    showToast("Failed to load purchases");
  }
}

// LOAD CONTENT
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/profile") {
    loadProfile();

    document
      .getElementById("btnSave")
      ?.addEventListener("click", showConfirmModal);
    document
      .getElementById("btnCancel")
      ?.addEventListener("click", resetProfileForm);
    document.getElementById("btnAvatarEdit")?.addEventListener("click", () => {
      showToast("Photo upload coming soon");
    });

    document.getElementById("modalConfirm")?.addEventListener("click", () => {
      closeConfirmModal();
      saveProfile();
    });
    document
      .getElementById("modalCancel")
      ?.addEventListener("click", closeConfirmModal);
    document.getElementById("confirmModal")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("confirmModal"))
        closeConfirmModal();
    });
  }

  if (path === "/profile/purchases") {
    loadPurchases();

    // Filter pills
    document.getElementById("purchaseFilters")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      ps.status = btn.dataset.filter;
      ps.page = 1;
      loadPurchases();
    });

    // Search with debounce
    let searchTimer;
    document.getElementById("purchasesSearch")?.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        ps.search = e.target.value.trim();
        ps.page = 1;
        loadPurchases();
      }, 300);
    });

    // Sort toggle
    document.getElementById("purchasesSort")?.addEventListener("click", () => {
      const btn = document.getElementById("purchasesSort");
      ps.sort = ps.sort === "desc" ? "asc" : "desc";
      ps.page = 1;
      btn.dataset.sort = ps.sort;
      btn.innerHTML = ps.sort === "desc"
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> Newest`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> Oldest`;
      loadPurchases();
    });

    // Pagination clicks (event delegation)
    document.getElementById("purchasesPagination")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".page-btn[data-page]");
      if (!btn) return;
      ps.page = parseInt(btn.dataset.page);
      loadPurchases();
    });
  }
});
