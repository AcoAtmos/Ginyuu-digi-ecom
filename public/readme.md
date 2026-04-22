# Ginyuu Frontend - Common Components Documentation

## Overview

Project ini menggunakan shared/common components untuk menghindari code duplication. Semua reusable components ada di folder `common/view/`.

---

## Common Components

| Component | Location | CSS Location |
|-----------|----------|--------------|
| **Navbar** | `common/view/navbar.ejs` | `shared.css` |
| **Footer** | `common/view/footer.ejs` | `shared.css` |
| **Pagination** | `common/view/pagination.ejs` | `shared.css` |

---

## 1. NAVBAR

### Cara Include
```ejs
<%- include('../../common/view/navbar.ejs') %>
```

### Required Setup di Page
Tambahkan `data-page` attribute di `<body>` untuk dynamic navbar behavior:
```ejs
<body data-page="home">      <!-- Categories & Reviews visible -->
<body data-page="browsAll">  <!-- Categories & Reviews hidden -->
<body data-page="profile">   <!-- Categories & Reviews hidden -->
```

### CSS Classes (shared.css)
| Class | Description |
|-------|-------------|
| `.main-header` | Header container (fixed, blur background) |
| `.header-container` | Inner wrapper with max-width |
| `.logo` | Logo text (GINY<span>UU</span>) |
| `.main-nav` | Desktop navigation links |
| `.nav-link` | Individual nav links |
| `.header-actions` | Right side (search, cart, profile) |
| `.search-wrapper` | Search input container |
| `.search-input` | Search input field |
| `.icon-btn` | Icon buttons (cart, etc) |
| `.cart-badge` | Cart item count badge |
| `.profile-dropdown` | Profile dropdown container |
| `.profile-btn` | Profile avatar button |
| `.dropdown-menu` | Profile dropdown menu |
| `.mobile-menu-btn` | Hamburger menu button |
| `.mobile-menu-overlay` | Full screen overlay |
| `.mobile-menu` | Slide-in menu panel |
| `.mobile-nav` | Mobile navigation links |

### Dynamic Features
- **Categories/Reviews links**: Automatically hidden di page selain home
- **Login state**: Shows Login/Register atau My Profile/Logout
- **Mobile responsive**: Hamburger menu untuk < 768px

### JS Logic (inline di navbar.ejs)
- Auth token verification via `/api/auth/verify_token`
- Profile dropdown toggle
- Mobile menu open/close
- Logout functionality

---

## 2. FOOTER

### Cara Include
```ejs
<%- include('../../common/view/footer.ejs') %>
```

### CSS Classes (shared.css)
| Class | Description |
|-------|-------------|
| `.main-footer` | Footer container |
| `.footer-content` | Inner wrapper |
| `.footer-main` | Brand + links container |
| `.footer-brand` | Brand logo & description |
| `.footer-links` | Links grid container |
| `.footer-column` | Individual link column |
| `.social-links` | Social media icons container |
| `.social-link` | Individual social icon |
| `.footer-bottom` | Copyright & payment section |
| `.payment-methods` | Payment method badges |
| `.payment-icon` | Individual payment icon |

### Responsive Grid
| Screen | Layout |
|--------|--------|
| Desktop (>1024px) | 2 columns: brand (1.5fr) + 4 link columns |
| Tablet (1024px) | 2 columns: brand + 2 link columns |
| Mobile (768px) | 2 columns: brand + 2 link columns |
| Small Mobile (480px) | 1 column, stacked |
| Extra Small (375px) | 1 column, compact spacing |

---

## 3. PAGINATION

### Cara Include
Tambahkan HTML ini di dalam `<section>` atau container produk:

```html
<div class="pagination-wrapper" id="paginationWrapper">
    <div class="pagination">
        <button class="pagination-btn pagination-prev" id="prevBtn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
            Prev
        </button>
        <div class="pagination-numbers" id="paginationNumbers"></div>
        <button class="pagination-btn pagination-next" id="nextBtn">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
    </div>
</div>
```

### CSS Classes (shared.css)
| Class | Description |
|-------|-------------|
| `.pagination-wrapper` | Container wrapper |
| `.pagination` | Inner pagination container |
| `.pagination-btn` | Prev/Next buttons |
| `.pagination-prev` | Previous button |
| `.pagination-next` | Next button |
| `.pagination-numbers` | Page numbers container |
| `.page-btn` | Individual page number |
| `.active` | Current page indicator |
| `.ellipsis` | "..." dots for gaps |

### JS Setup

```javascript
// 1. Declare variables at top
let currentPage = 1;
let itemsPerPage = 12;  // Ubah sesuai kebutuhan
let totalPages = 1;
let filteredProducts = [];

// 2. On page load
filteredProducts = allProducts;
renderProducts();      // Render products for current page
renderPagination();    // Render pagination buttons

// 3. On filter/sort change
currentPage = 1;  // Reset ke page 1
renderProducts();
renderPagination();

// 4. After API fetch
allProducts.push(...data);
filteredProducts = [...allProducts];
totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
renderProducts();
renderPagination();
```

### Cara Kerja
```
Page Load → fetchProducts() → renderProducts() → renderPagination()
User Click Page → currentPage = X → renderProducts() → renderPagination()
User Filter → filteredProducts = [...] → currentPage = 1 → renderProducts() → renderPagination()
```

### Pagination Display Format
- Shows first page always
- Shows last page always
- Shows pages around current page
- Shows ellipsis (...) for gaps

---

## CSS Location

**Semua styles untuk common components ada di:**

```
D:\Coding\Project\ginyuu\public\assets\css\shared.css
```

### CSS Variables (for theming)
```css
:root {
    /* Colors */
    --primary: #3b82f6;
    --secondary: #6366f1;
    --bg-primary: #0a0a0f;
    --bg-secondary: #0f0f18;
    --text-primary: #ffffff;
    --text-muted: rgba(255,255,255,0.5);
    
    /* Effects */
    --border-subtle: rgba(255,255,255,0.08);
    --shadow-lg: 0 10px 40px rgba(0,0,0,0.5);
    --gradient-primary: linear-gradient(135deg, #3b82f6, #6366f1);
    
    /* Spacing */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}
```

### Responsive Breakpoints
| Breakpoint | Width | Description |
|------------|-------|-------------|
| Desktop | >1024px | Full layout |
| Tablet | 768-1024px | 2-3 columns |
| Mobile | 480-768px | 2 columns, hamburger menu |
| Small Mobile | <480px | 1 column, compact |
| Extra Small | <375px | Minimal spacing |

---

## Maintenance Guide

### 1. Ganti Logo/Nama Brand
Edit di 2 tempat:
- `common/view/navbar.ejs` → `.logo`
- `common/view/footer.ejs` → `.footer-brand h3`

### 2. Tambah Link di Footer
Edit `common/view/footer.ejs`:
```ejs
<div class="footer-column">
    <h4>NEW SECTION</h4>
    <ul>
        <li><a href="#">Link 1</a></li>
        <li><a href="#">Link 2</a></li>
    </ul>
</div>
```

### 3. Ubah Tema Warna
Edit CSS variables di `shared.css`:
```css
:root {
    --primary: #YOUR_COLOR;
    --bg-primary: #YOUR_BG;
    --text-primary: #YOUR_TEXT;
}
```

### 4. Ubah Items Per Page
Edit di JS:
```javascript
let itemsPerPage = 24;  // atau berapa pun
```

### 5. Tambah Social Media Icon
Edit `footer.ejs`:
```ejs
<a href="#" class="social-link" title="New Platform">
    <svg>...</svg>
</a>
```

### 6. Responsive Debugging
Check responsive di browser dev tools:
1. Press F12 → Toggle device toolbar
2. Test breakpoints: 1024px, 768px, 480px, 375px
3. Check mobile menu works on <768px

---

## Page Checklist

Saat menambah page baru:

### Wajib untuk semua page:
- [ ] Include navbar: `<%- include('../../common/view/navbar.ejs') %>`
- [ ] Include footer: `<%- include('../../common/view/footer.ejs') %>`
- [ ] Set `data-page="nama"` di body
- [ ] Load CSS: `shared.css` + page-specific CSS
- [ ] Load Google Fonts di head

### Contoh Template Page:
```ejs
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <link rel="stylesheet" href="/assets/css/shared.css">
    <link rel="stylesheet" href="/assets/css/page-specific.css">
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
</head>
<body data-page="pageName">
    <%- include('../../common/view/navbar.ejs') %>
    
    <!-- Page Content -->
    <main>
        ...
    </main>
    
    <%- include('../../common/view/footer.ejs') %>
    
    <script src="/assets/js/page-specific.js"></script>
</body>
</html>
```

---

## File Structure

```
public/
├── README.md                    # This file
├── assets/
│   ├── css/
│   │   ├── shared.css          # All common styles + CSS variables
│   │   ├── home.css
│   │   ├── browsAll.css
│   │   ├── checkout.css
│   │   ├── profile.css
│   │   ├── auth-travel.css
│   │   └── waiting_payment.css
│   ├── js/
│   │   ├── home.js
│   │   ├── browsAll.js        # Contains pagination logic
│   │   ├── checkout.js
│   │   ├── profile.js
│   │   ├── login.js
│   │   └── register.js
│   └── img/
│       └── ...
└── common/
    └── view/
        ├── navbar.ejs          # Navbar component
        ├── footer.ejs          # Footer component
        └── pagination.ejs       # Pagination component (optional)
```

---

## Quick Reference

| Need | Where to Edit |
|------|---------------|
| Navbar links | `navbar.ejs` |
| Footer links | `footer.ejs` |
| Colors/theme | `shared.css` :root |
| Page-specific styles | `page-name.css` |
| Pagination logic | `browsAll.js` |
| Responsive breakpoints | `shared.css` @media queries |