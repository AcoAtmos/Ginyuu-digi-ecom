# Ginyuu — Digital Product Store

Full-stack e-commerce application for digital products with guest checkout, multi-product cart, promo codes, invoice generation, and automated email notifications.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Port 3100)                  │
│  Express + EJS Templates + Vanilla JS (ES Modules)       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ landing.ejs │  │checkout.ejs │  │ cart.js / main.js│ │
│  │ landing.js  │  │ checkout.js │  │ (global Cart obj)│ │
│  └─────────────┘  └─────────────┘  └──────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / Fetch API
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend API (Port 4100)               │
│  Express + PostgreSQL + JWT Cookies                      │
│  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌───────┐ ┌───────┐│
│  │  auth   │ │ cart   │ │checkout │ │ promo │ │payment││
│  │service  │ │service │ │service  │ │service│ │service││
│  └─────────┘ └────────┘ └─────────┘ └───────┘ └───────┘│
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   PostgreSQL Server   │
              │  (users, product,     │
              │   cart_items, orders, │
              │   order_items,        │
              │   invoices, promo_    │
              │   codes, queue)       │
              └──────────────────────┘
```

---

## Quick Start

### Prerequisites
- **Runtime:** Bun (recommended) or Node.js
- **Database:** PostgreSQL
- **Email:** Gmail account with App Password (for sending invoices)

### 1. Database Setup
```bash
# Create database
createdb ginyuu

# Create tables
cd api
node setup_cart_table.js
node setup_order_tables.js
```

### 2. Configure Environment
Edit `api/.env`:
```env
PORT=4100
DB_HOST=localhost
DB_USER=postgres
DB_NAME=ginyuu
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
FE_URL=http://localhost:3100
ACCOUNT_NUMBER=1234567890
```

Edit `public/.env`:
```env
PORT=3100
BE_URL=http://localhost:4100
```

### 3. Install Dependencies
```bash
cd api && bun install
cd ../public && bun install
```

### 4. Run Servers
```bash
# Terminal 1 — Backend
cd api && bun --watch app.js

# Terminal 2 — Frontend
cd public && bun --watch app.js
```

**Access:** Frontend → `http://localhost:3100` | API → `http://localhost:4100/api`

---

## API Endpoints

### Health Check
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | Returns `"API is running"` |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/product` | No | Get all products |
| `GET` | `/api/product/home` | No | Get products for homepage (new arrivals + top selling) |
| `GET` | `/api/product/category/:page/:limit` | No | Paginated products by category |
| `GET` | `/api/get_product/:slug` | No | Get single product by slug |

### Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/cart` | Yes | Get user's cart items with product details |
| `POST` | `/api/cart` | Yes | Add item to cart (prevents duplicates) |
| `DELETE` | `/api/cart/:product_id` | Yes | Remove item from cart |
| `POST` | `/api/cart/sync` | Yes | Sync guest localStorage cart to database |

### Promo
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/promo/validate` | No | Validate promo code with `{code, subtotal}` |

### Checkout
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/checkout` | No* | Process checkout (guest auto-register or logged-in) |

\* Accepts both guest and authenticated users. Token is checked optionally.

### Payment
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/get_invoice/:invoice_number` | No | Get invoice details |
| `POST` | `/api/payment_process` | No | Process payment confirmation |

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login user (sets HttpOnly cookie) |
| `POST` | `/api/auth/verify_token` | No | Verify JWT token (returns null for guests) |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `POST` | `/api/auth/logout` | No | Logout (clears cookie) |

### User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/profile/me` | Yes | Get my profile |
| `GET` | `/api/purchases` | Yes | Get my purchase history |
| `GET` | `/api/admin/purchases` | Yes + Admin | Get all purchases |

### WhatsApp
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/check_whatsapp/:phone` | No | Check if phone number is on WhatsApp |

---

## Frontend Routes

| Route | Template | Description |
|-------|----------|-------------|
| `/` | `modules/landing_page/landing_page.ejs` | Landing page with product grid, search, filters, auth modal, cart sidebar |
| `/checkout` | `modules/checkout/checkout.ejs` | Checkout page with account info, payment selection, promo input, order summary |

### Frontend JavaScript Modules

| File | Purpose |
|------|---------|
| `assets/js/landing.js` | Product browsing, cart badge updates, auth modal (login/register), product modal |
| `assets/js/checkout.js` | Checkout form validation, payment selection, promo application, order submission |
| `assets/js/cart.js` | Global `Cart` object — handles guest localStorage and authenticated API cart with sync |
| `common/main/main.js` | Shared utilities: `checkAuthStatus()`, `showToast()`, `logout()`, `setCookie()`, `getCookie()`, `deleteCookie()` |

---

## Database Schema

### users
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `username` | VARCHAR | |
| `email` | VARCHAR | UNIQUE |
| `password` | VARCHAR | Bcrypt hashed |
| `phone` | VARCHAR | |
| `image_url` | VARCHAR | |
| `role` | VARCHAR | Default: `'MEMBER'` |
| `terms` | BOOLEAN | |
| `created_at` | TIMESTAMP | Default: `CURRENT_TIMESTAMP` |

### product
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | |
| `slug` | VARCHAR | UNIQUE |
| `price` | INTEGER | |
| `discount` | DECIMAL | |
| `category` | VARCHAR | |
| `preview` | VARCHAR | Image URL |
| `description` | TEXT | |
| `sales_count` | INTEGER | |
| `created_at` | TIMESTAMP | |

### cart_items
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `user_id` | INTEGER | FK → `users(id)` CASCADE |
| `product_id` | INTEGER | FK → `product(id)` CASCADE |
| `added_at` | TIMESTAMP | Default: `CURRENT_TIMESTAMP` |
| **Unique:** `(user_id, product_id)` | | |

### orders
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `user_id` | INTEGER | FK → `users(id)` CASCADE |
| `payment_method` | VARCHAR(50) | NOT NULL |
| `subtotal` | INTEGER | NOT NULL |
| `discount_amount` | INTEGER | Default: 0 |
| `unique_num` | INTEGER | Default: 0 |
| `total` | INTEGER | NOT NULL |
| `status` | VARCHAR(20) | Default: `'pending'` |
| `created_at` | TIMESTAMP | Default: `CURRENT_TIMESTAMP` |

### order_items
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `order_id` | INTEGER | FK → `orders(id)` CASCADE |
| `product_id` | INTEGER | FK → `product(id)` CASCADE |
| `price` | INTEGER | NOT NULL |

### invoices
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `order_id` | INTEGER | FK → `orders(id)` CASCADE |
| `invoice_number` | VARCHAR(100) | UNIQUE |
| `discount_amount` | INTEGER | Default: 0 |
| `total` | INTEGER | NOT NULL |
| `issued_at` | TIMESTAMP | NOT NULL |
| `unique_num` | INTEGER | Default: 0 |
| `status` | VARCHAR(20) | Default: `'pending'` |
| `created_at` | TIMESTAMP | Default: `CURRENT_TIMESTAMP` |

### promo_codes
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `code` | VARCHAR(50) | UNIQUE |
| `discount_pct` | DECIMAL(5,2) | Default: 0 |
| `max_usage` | INTEGER | NULL = unlimited |
| `used_count` | INTEGER | Default: 0 |
| `expires_at` | TIMESTAMP | NULL = no expiry |
| `is_active` | BOOLEAN | Default: true |
| `created_at` | TIMESTAMP | Default: `CURRENT_TIMESTAMP` |

**Seed Codes:** `DIGI20` (20%), `HEMAT20` (20%), `WELCOME10` (10%), `NEWYEAR` (15%)

### queue (Email queue)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `order_id` | INTEGER | FK → `orders(id)` |
| `destination` | VARCHAR | Email address |
| `tipe` | VARCHAR | `'email'` |
| `pesan` | TEXT | HTML message |
| `status` | VARCHAR | `'pending'` / `'sent'` |
| `created_at` | TIMESTAMP | |

---

## How It Works

### Authentication Flow

```
REGISTER                          LOGIN
  │                                 │
  ▼                                 ▼
POST /api/auth/register          POST /api/auth/login
  │                                 │
  ├─ Hash password (bcrypt)         ├─ Find user by email
  ├─ INSERT INTO users              ├─ Compare password
  └─ Return success                 └─ Create JWT token
                                      ├─ Set HttpOnly cookie (24h)
                                      └─ Return user data

TOKEN VERIFICATION                  LOGOUT
  │                                 │
  ▼                                 ▼
POST /api/auth/verify_token       POST /api/auth/logout
  │                                 │
  ├─ Read cookie `token`            ├─ Clear cookie
  ├─ Verify JWT                     └─ Frontend clears localStorage
  ├─ Return user data               └─ Redirect to /
  └─ Or return null (guest)
```

**Key points:**
- JWT payload: `{ id, role, username, email, phone, image_url }`
- Cookie name: `token`, HttpOnly, secure, sameSite: `lax`, maxAge: 24h
- `checkAuthStatus()` calls `verify_token` → returns user or null (never throws for 401)
- Frontend stores `username` and `email` in localStorage for display purposes only

### Cart System

```
┌──────────────────────────────────────────────────────────────┐
│                        GUEST MODE                             │
│  localStorage key: "ginyuu_guest_cart"                        │
│  Format: [{id: 1}, {id: 5}, {id: 12}]                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Cart.add(productId)                                  │     │
│  │   ├─ Check if exists in localStorage                │     │
│  │   ├─ If duplicate → fire onDuplicate callback       │     │
│  │   └─ If new → push to array, save to localStorage   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Cart.getAll()                                                │
│  └─ Return JSON.parse(localStorage.getItem(key)) || []       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     AUTHENTICATED MODE                        │
│  Database: cart_items table                                   │
│  Unique constraint: (user_id, product_id)                    │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Cart.add(productId)                                  │     │
│  │   ├─ POST /api/cart {product_id}                    │     │
│  │   ├─ ON CONFLICT DO NOTHING                         │     │
│  │   ├─ If duplicate → fire onDuplicate callback       │     │
│  │   └─ If success → fire cart badge update            │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Cart.getAll()                                                │
│  └─ GET /api/cart → returns items with product details       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      CART SYNC (on Login)                     │
│  1. User logs in                                              │
│  2. Frontend calls Cart.sync()                                │
│  3. POST /api/cart/sync { cart: localStorage items }          │
│  4. Backend iterates → addItem() for each                     │
│  5. Duplicates skipped silently (ON CONFLICT DO NOTHING)       │
│  6. On success → Cart.clearLocal()                            │
└──────────────────────────────────────────────────────────────┘
```

### Checkout Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                     │
│                                                                       │
│  1. Load page → checkAuthStatus()                                     │
│     ├─ Logged in → setupLoggedInUI(), Cart.setLoggedIn(true)          │
│     └─ Guest → setupGuestUI(), Cart.setLoggedIn(false)                │
│                                                                       │
│  2. Load cart items                                                   │
│     ├─ Logged in → Cart.getAll() → API returns full data              │
│     └─ Guest → Cart.getAll() → localStorage ids → fetch /api/product  │
│        to enrich with name, price, etc.                               │
│                                                                       │
│  3. User selects payment method                                       │
│  4. User enters promo code (optional) → POST /api/promo/validate      │
│  5. User fills form + accepts terms                                   │
│  6. Click "Bayar Sekarang" → submitOrder()                            │
│     └─ POST /api/checkout { cart_items, payment_method, ... }         │
│                                                                       │
│  7. Handle response                                                   │
│     ├─ EMAIL_ALREADY_REGISTERED → toast + redirect /login             │
│     ├─ Success → clear guest cart → show success overlay              │
│     └─ Error → show error toast                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          BACKEND                                      │
│                                                                       │
│  POST /api/checkout                                                  │
│                                                                       │
│  1. Optional auth check                                              │
│     ├─ Read token from cookie                                        │
│     ├─ Verify JWT → get userId                                       │
│     └─ Fetch user details (username, email, phone)                   │
│                                                                       │
│  2. Pipeline (each step can fail and return early)                    │
│     ├─ capturePayload()        → Extract + structure request data    │
│     ├─ validatePayload()       → Required fields check               │
│     ├─ getPrices()             → Single query: WHERE id = ANY($1)    │
│     ├─ applyPromo()            → Validate code, check expiry/usage   │
│     ├─ checkout_add_unique_num() → Random 1-999                      │
│     └─ countTotal()            → subtotal - discount - unique_num    │
│                                                                       │
│  3. Transaction (BEGIN ... COMMIT)                                    │
│     ├─ checkout_add_user()                                             │
│     │   ├─ Logged in → use existing userId                            │
│     │   ├─ Guest + email exists → EMAIL_ALREADY_REGISTERED (fail)    │
│     │   └─ Guest + new email → INSERT user → new userId               │
│     ├─ checkout_create_order()                                         │
│     │   ├─ INSERT INTO orders (header)                                │
│     │   └─ INSERT INTO order_items (N rows, one per product)          │
│     ├─ checkout_create_invoice()                                       │
│     │   ├─ invoice_number = "INV-" + timestamp + userId + orderId     │
│     │   ├─ issued_at = now                                            │
│     │   └─ expires_at = now + 3 days                                  │
│     ├─ checkout_clear_cart() → DELETE FROM cart_items                 │
│     └─ checkout_add_queue() → INSERT email into queue table           │
│                                                                       │
│  4. Response                                                          │
│     { status: "success", data: { invoice_number, total, ... } }       │
│                                                                       │
│  5. Email Worker (runs every 10s, if enabled)                         │
│     ├─ SELECT pending email from queue                                │
│     ├─ Send via Nodemailer (Gmail SMTP)                               │
│     └─ UPDATE queue SET status = 'sent'                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Promo Code System

**Validation checks:**
1. Code exists in `promo_codes` table
2. `is_active = true`
3. `expires_at` is in the future (if set)
4. `used_count < max_usage` (if max_usage is set)

**Discount calculation:**
```javascript
discount_amount = Math.floor(subtotal * discount_pct)
// Example: subtotal=500000, discount_pct=0.20 → discount=100000
```

**Two validation points:**
- **Pre-check:** `POST /api/promo/validate` (frontend button) — shows discount before submit
- **Checkout:** `applyPromo()` in checkout pipeline — validates again during order creation

**Usage tracking:**
- `used_count` increments on successful checkout (handled in checkout pipeline)
- `max_usage = NULL` means unlimited uses

### Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    INVOICE GENERATION                         │
│                                                               │
│  After checkout:                                              │
│  ├─ invoice_number: INV-{timestamp}{userId}-{orderId}         │
│  ├─ unique_num: Random 1-999 (deducted from total)            │
│  ├─ total: subtotal - discount - unique_num                   │
│  ├─ status: 'pending'                                         │
│  └─ expires_at: 3 days from now                               │
│                                                               │
│  Email sent to user with:                                     │
│  ├─ List of purchased products                                │
│  ├─ Subtotal, discount, unique number, total                  │
│  ├─ Bank account (from ACCOUNT_NUMBER env var)                │
│  └─ WhatsApp contact for confirmation                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT VERIFICATION                       │
│                                                               │
│  Method A: IMAP Email Monitoring (Automatic)                  │
│  ├─ Monitor inbox for bank notification emails                │
│  ├─ Parse subject: "BNI Merchant - [Date] [Amount]"           │
│  ├─ Match amount to pending invoices (within 3 days)          │
│  ├─ If match found:                                           │
│  │   ├─ UPDATE invoices SET status = 'paid'                   │
│  │   ├─ UPDATE orders SET status = 'completed'                │
│  │   └─ Send WhatsApp + email to user                         │
│                                                               │
│  Method B: API Callback (Manual/Gateway)                      │
│  ├─ POST /api/payment_process                                 │
│  └─ Currently returns placeholder responses                   │
└──────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
ginyuu/
├── api/                          # Backend API server
│   ├── app.js                    # Express app entry point
│   ├── package.json              # Dependencies
│   ├── .env                      # Environment variables
│   ├── setup_cart_table.js       # Creates cart_items table
│   ├── setup_order_tables.js     # Creates orders, order_items, invoices, promo_codes
│   ├── common/
│   │   ├── helper.js             # Database connection pool (pg)
│   │   └── routes.js             # All API route definitions
│   └── modules/
│       ├── auth/
│       │   ├── auth_controller.js    # register, login, verifyToken, getMe, logout
│       │   ├── auth_service.js       # Business logic for auth
│       │   └── auth_middleware.js    # authMiddleware, adminMiddleware
│       ├── product/
│       │   ├── product_controller.js # get_all_product, get_product, etc.
│       │   └── product_service.js    # Database queries for products
│       ├── cart/
│       │   ├── cart_controller.js    # getCart, addItem, removeItem, syncCart
│       │   └── cart_service.js       # Cart DB operations with duplicate prevention
│       ├── checkout/
│       │   ├── checkout_controller.js    # checkout() with JWT parsing + transaction
│       │   └── checkout_service.js       # Pipeline: capture, validate, prices, promo, user, order, invoice, queue
│       ├── promo/
│       │   ├── promo_controller.js   # validatePromo endpoint
│       │   └── promo_service.js      # validatePromo, incrementPromoUsage
│       ├── payment/
│       │   ├── payment_controller.js # getInvoice, paymentProcess
│       │   └── payment_service.js    # Invoice lookup, payment matching
│       ├── user/
│       │   └── member/
│       │       └── member_controller.js  # get_my_profile, get_my_purchases, get_all_purchases
│       ├── email/
│       │   └── email_service.js    # send_email (Nodemailer), IMAP monitoring
│       └── whatsapp/
│           └── whatsapp_controller.js  # check_whatsapp
│
├── public/                       # Frontend web server
│   ├── app.js                    # Express app entry point (EJS + static)
│   ├── package.json              # Dependencies
│   ├── .env                      # Environment variables
│   ├── common/
│   │   ├── routes.js             # Frontend routes (/ → landing, /checkout → checkout)
│   │   └── main/
│   │       └── main.js           # Shared: checkAuthStatus, showToast, logout, cookie utils
│   ├── modules/
│   │   ├── views_controller.js   # landing(), checkout() render functions
│   │   ├── landing_page/
│   │   │   └── landing_page.ejs  # Landing page template
│   │   └── checkout/
│   │       └── checkout.ejs      # Checkout page template
│   └── assets/
│       ├── css/
│       │   ├── checkout.css      # Checkout page styles
│       │   └── main.css          # Landing page styles (shared)
│       └── js/
│           ├── landing.js        # Product browsing, cart badge, auth modal
│           ├── checkout.js       # Checkout form, payment, promo, order submission
│           └── cart.js           # Global Cart object (localStorage + API sync)
│
└── README.md
```

---

## Key Concepts

### Digital Products Model
- **No quantity:** Each product can only be purchased once per user (1 license = 1 purchase)
- **Duplicate prevention:** At API level via `ON CONFLICT DO NOTHING`, at frontend level via localStorage check
- **Toast notification:** "Already in cart" when user tries to add duplicate

### Guest Auto-Registration
- Guests can checkout without an account
- Account is created automatically during checkout
- If email already exists → error + redirect to login
- Guest cart is stored in `localStorage` until login/checkout

### Price Validation
- Frontend prices are **estimates only**
- Backend fetches prices directly from `product` table during checkout
- Prevents tampering with client-side price manipulation

### Multi-Product Orders
- Single `orders` header row per checkout
- Multiple `order_items` rows (one per product)
- Each item stores price snapshot at time of purchase
- Single invoice covers all items in the order

### Unique Payment Number
- Random number 1-999 subtracted from total
- Helps match incoming bank transfers to specific invoices
- Format: `total = subtotal - discount - unique_num`

---

## Environment Variables

### Backend (`api/.env`)
| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Backend server port | `4100` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_NAME` | Database name | `ginyuu` |
| `DB_PASSWORD` | Database password | `1231436` |
| `JWT_SECRET` | JWT signing key | `your_secret` |
| `FE_URL` | Frontend URL (CORS) | `http://localhost:3100` |
| `API_URL` | WhatsApp API base | `https://notifapi.com` |
| `API_KEY` | WhatsApp API key | `f538a366...` |
| `EMAIL_SENDER` | Gmail sender address | `user@gmail.com` |
| `EMAIL_PASSWORD` | Gmail App Password | `abcd efgh ijkl mnop` |
| `ACCOUNT_NUMBER` | Bank account number | `1234567890` |
| `IMAP_USER` | IMAP email (optional) | `user@gmail.com` |
| `IMAP_PASS` | IMAP password (optional) | `app_password` |

### Frontend (`public/.env`)
| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Frontend server port | `3100` |
| `BE_URL` | Backend API URL | `http://localhost:4100` |

---

## Global Objects

### `window.Cart`
Available on all pages via `cart.js` script tag.

| Method | Returns | Description |
|--------|---------|-------------|
| `Cart.getAll()` | `Promise<Item[]>` | Get cart items (from API or localStorage) |
| `Cart.add(productId)` | `Promise<{status}>` | Add product (handles duplicate detection) |
| `Cart.remove(productId)` | `Promise<{status}>` | Remove product |
| `Cart.sync()` | `Promise<{status}>` | Sync guest cart to database (on login) |
| `Cart.setLoggedIn(bool)` | `void` | Set authentication state |
| `Cart.onExpired(callback)` | `void` | Set handler for session expiry |
| `Cart.onDuplicate(callback)` | `void` | Set handler for duplicate add |
| `Cart.clearLocal()` | `void` | Clear guest localStorage cart |
| `Cart.getLocalItems()` | `Item[]` | Get raw localStorage cart items |

### Shared Utilities (`main.js`)
| Function | Returns | Description |
|----------|---------|-------------|
| `checkAuthStatus()` | `Promise<User\|null>` | Verify token, return user or null |
| `showToast(msg, type)` | `void` | Show toast notification |
| `logout()` | `void` | Call API logout + clear localStorage + redirect |
| `setCookie(name, value)` | `void` | Set browser cookie |
| `getCookie(name)` | `string\|null` | Get cookie value |
| `deleteCookie(name)` | `void` | Delete cookie |
| `getCookieAgeHours()` | `number` | Get hours since cookie was set |
| `logoutIfCookieOlder(hours)` | `void` | Auto-logout if cookie older than N hours |

---

## Development Notes

### Adding New API Endpoint
1. Create controller in `api/modules/{name}/{name}_controller.js`
2. Create service in `api/modules/{name}/{name}_service.js`
3. Import and register route in `api/common/routes.js`

### Adding New Frontend Page
1. Create EJS template in `public/modules/{name}/`
2. Add render function in `public/modules/views_controller.js`
3. Add route in `public/common/routes.js`
4. Add static assets in `public/assets/js/` and `public/assets/css/`

### Database Changes
- Run setup scripts: `node setup_{name}.js`
- Use `DROP TABLE IF EXISTS ... CASCADE` in setup scripts for idempotency
- All foreign keys use `ON DELETE CASCADE`

---

## Security

- **Password hashing:** bcrypt with 10 rounds
- **JWT tokens:** HttpOnly cookies (not accessible via JavaScript)
- **CORS:** Restricted to `FE_URL` origin with `credentials: true`
- **Price validation:** Server-side only (fetches from DB during checkout)
- **SQL injection prevention:** Parameterized queries (`$1, $2, ...`)
- **Terms acceptance:** Required for both guest and logged-in checkout
