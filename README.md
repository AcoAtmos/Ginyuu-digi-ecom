# Ginyuu — Digital Product Store

Full-stack e-commerce for digital products with guest checkout, multi-product cart, promo codes, invoice generation, automated email notifications, and user profile management.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│               Express 5 Server (Port 4100)                  │
│  EJS Templates + Vanilla JS + REST API + PostgreSQL         │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │  landing.ejs │ │ checkout.ejs │ │  main.js / cart.js│     │
│  │  landing.js  │ │ checkout.js  │ │  navbar.js (ESM) │     │
│  └─────────────┘ └──────────────┘ └──────────────────┘     │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Profile pages: profile.ejs / purchases.ejs      │       │
│  │  /settings.ejs / security.ejs / waiting-payment  │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Partials: navbar.ejs, auth-modal.ejs,           │       │
│  │            cart-sidebar.ejs                       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  Features (routes + controller + service per domain):       │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌───────┐ ┌───────┐        │
│  │ auth │ │ cart │ │checkout│ │ promo │ │payment│         │
│  └──────┘ └──────┘ └────────┘ └───────┘ └───────┘        │
│  ┌──────┐ ┌────────┐ ┌────────────┐ ┌──────────┐         │
│  │ user │ │product │ │notification│ │ whatsapp │          │
│  └──────┘ └────────┘ └────────────┘ └──────────┘         │
│                                                             │
│  Shared: auth middleware, email service, whatsapp service   │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
                 ┌──────────────────────┐
                 │   PostgreSQL Server   │
                 │  (users, product,     │
                 │   cart_items, orders, │
                 │   order_items,        │
                 │   invoices, promo_    │
                 │   codes, queue,       │
                 │   notifications,      │
                 │   payment_gateway)    │
                 └──────────────────────┘
```

---

## Quick Start

### Prerequisites
- **Runtime:** Bun (recommended) or Node.js ≥18
- **Database:** PostgreSQL 14+
- **Email:** Gmail account with App Password (for sending invoices)

### 1. Clone & Install
```bash
git clone <repo>
cd ginyuu
bun install
```

### 2. Database Setup
```bash
createdb ginyuu
cd scripts
node setup_users_table.js
node setup_product_table.js
node setup_cart_table.js
node setup_order_tables.js
node setup_queue_table.js
node setup_notifications_table.js
node setup_payment_gateway_table.js
node setup_product_indexes.js
```

### 3. Configure Environment
Edit `.env` at project root:
```env
PORT=4100
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ginyuu
JWT_SECRET=your_secret_key
FE_URL=http://localhost:4100
ACCOUNT_NUMBER=1234567890

# Email (Gmail SMTP)
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# WhatsApp API
API_URL=https://notifapi.com
API_KEY=your_key
```

### 4. Run
```bash
bun --watch src/app.js
```
**Access:** `http://localhost:4100`

---

## Frontend Routes

| Route | Template | Description |
|-------|----------|-------------|
| `/` | `landing.ejs` | Landing page — product grid, search, filters, auth modal, cart sidebar |
| `/checkout` | `checkout.ejs` | Checkout — account info, payment selection, promo, order summary |
| `/checkout/waiting-payment` | `waiting-payment.ejs` | Payment instructions page after checkout |
| `/reset-password` | `reset-password.ejs` | Password reset page (token-based) |
| `/profile` | `profile-user/profile.ejs` | User profile — avatar, name, email, username, phone |
| `/profile/purchases` | `profile-user/purchases.ejs` | Purchase history — search, filter, sort, pagination |
| `/profile/settings` | `profile-user/settings.ejs` | Account settings (placeholder) |
| `/profile/security` | `profile-user/security.ejs` | Security settings (placeholder) |

### JavaScript Modules

| File | Type | Purpose |
|------|------|---------|
| `common/main/main.js` | `<script>` | Shared utilities: `checkAuthStatus()`, `showToast()`, `logout()`, cookie helpers |
| `assets/js/navbar.js` | `<script type="module">` | Navbar init, auth modal (login/register/forgot), cart sidebar, sidebar active state |
| `assets/js/cart.js` | `<script>` | Global `Cart` object — guest localStorage + authenticated API |
| `assets/js/landing.js` | `<script>` | Product browsing, cart interactions |
| `assets/js/products.js` | `<script>` | Product detail display |
| `assets/js/checkout.js` | `<script>` | Checkout form, promo, order submission |
| `assets/js/profile.js` | `<script>` | Profile form, purchase history with search/filter/sort/pagination |
| `assets/js/waiting_for_payment.js` | `<script>` | Payment countdown & instructions |

---

## API Endpoints

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/product` | No | All products |
| `GET` | `/api/product/home` | No | Homepage (new arrivals + top selling) |
| `GET` | `/api/product/category/:page/:limit` | No | Paginated by category |
| `GET` | `/api/get_product/:slug` | No | Single product by slug |

### Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/cart` | Yes | User's cart with product details |
| `POST` | `/api/cart` | Yes | Add item (duplicate protection) |
| `DELETE` | `/api/cart/:product_id` | Yes | Remove item |
| `POST` | `/api/cart/sync` | Yes | Sync guest localStorage cart to DB |

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register |
| `POST` | `/api/auth/login` | No | Login (sets HttpOnly cookie) |
| `POST` | `/api/auth/verify_token` | No | Verify JWT (returns null for guests) |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `POST` | `/api/auth/logout` | No | Clear cookie |
| `POST` | `/api/auth/forgot-password` | No | Send reset link (always 200) |
| `POST` | `/api/auth/reset-password` | No | Reset password (JWT token, 15-min expiry) |

### Checkout
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/checkout` | No* | Process checkout (guest auto-register or logged-in) |

\* Optional auth — cookie checked if present.

### Payment
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/get_invoice/:invoice_number` | No | Invoice details |
| `POST` | `/api/payment_process` | No | Confirm payment |
| `POST` | `/api/payment/create-transaction` | Yes | Create QRIS transaction (KlikQRIS) |
| `GET` | `/api/payment/check-status/:invoice` | Yes | Check payment status |

### Promo
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/promo/validate` | No | Validate code: `{code, subtotal}` |

### User / Profile
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/profile/me` | Yes | Profile details |
| `PUT` | `/api/profile/me` | Yes | Update username & phone |
| `GET` | `/api/purchases` | Yes | Purchase history with `?search=&status=&sort=&page=&limit=` |
| `GET` | `/api/admin/purchases` | Yes + Admin | All purchases |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/notification/register-token` | No | Register FCM push token |

### WhatsApp
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/check_whatsapp/:phone` | No | Check if phone is on WhatsApp |

---

## Database Schema

### users
`id (PK)`, `username`, `email (UQ)`, `password` (bcrypt), `phone`, `image_url`, `role` (default `'MEMBER'`), `terms`, `created_at`

### product
`id (PK)`, `name`, `slug (UQ)`, `price`, `discount`, `category`, `preview`, `description`, `sales_count`, `created_at`

### cart_items
`id (PK)`, `user_id (FK)`, `product_id (FK)`, `added_at` — Unique: `(user_id, product_id)`

### orders
`id (PK)`, `user_id (FK)`, `payment_method`, `subtotal`, `discount_amount`, `unique_num`, `total`, `status` (pending/completed/cancelled), `created_at`

### order_items
`id (PK)`, `order_id (FK)`, `product_id (FK)`, `price` (snapshot at purchase)

### invoices
`id (PK)`, `order_id (FK)`, `invoice_number (UQ)`, `discount_amount`, `total`, `issued_at`, `expires_at`, `unique_num`, `status` (pending/paid/expired), `created_at`

### promo_codes
`id (PK)`, `code (UQ)`, `discount_pct`, `max_usage`, `used_count`, `expires_at`, `is_active`, `created_at`
**Seed codes:** `DIGI20` (20%), `HEMAT20` (20%), `WELCOME10` (10%), `NEWYEAR` (15%)

### queue (Email queue)
`id (PK)`, `order_id (FK)`, `destination`, `tipe`, `pesan` (HTML), `status` (pending/sent), `created_at`

### notifications
`id (PK)`, `user_id (FK)`, `fcm_token`, `device_type`, `created_at`

### payment_gateway
`id (PK)`, `invoice_id (FK)`, `transaction_id`, `gateway`, `amount`, `status`, `raw_response` (JSON), `created_at`

---

## Key Flows

### Authentication
- **Register** → bcrypt hash → insert user → return success
- **Login** → verify password → create JWT (24h) → set HttpOnly cookie
- **Forgot Password** → generate JWT (15-min expiry) → send email with reset link → always return 200
- **Reset Password** → verify JWT token → update password in DB
- **Logout** → clear cookie → redirect

### Cart System
- **Guest:** localStorage key `ginyuu_guest_cart` stores `[{id, name, price, slug}]`
- **Logged-in:** `cart_items` table with unique constraint `(user_id, product_id)`
- **Sync:** On login, guest cart items are posted to API → duplicates skipped → guest cart cleared
- **Duplicate prevention:** Server-side `ON CONFLICT DO NOTHING`, frontend toast "Already in cart"

### Checkout Pipeline
1. Capture & validate payload
2. Fetch prices from DB (server-side, never trust client prices)
3. Apply promo code (validate expiry, usage, active flag)
4. Add unique payment number (random 1–999, subtracted from total)
5. Begin transaction:
   - Find or create user (guest auto-registration)
   - Create order + order_items
   - Create invoice (`INV-{ts}{userId}-{orderId}`, expires 3 days)
   - Clear cart_items
   - Insert email into queue
6. Return invoice details
7. Background worker polls queue every 10s → sends via Nodemailer

### Payment
- **Bank transfer:** User transfers to `ACCOUNT_NUMBER` minus `unique_num` (e.g., Rp 50,000 − 123 = Rp 49,877)
- **QRIS:** `POST /api/payment/create-transaction` creates KlikQRIS transaction
- **Verification:** Manual via `/checkout/waiting-payment?invoice=INV-xxx` or IMAP email monitoring

### Profile & Purchases
- `/profile` loads user data via `GET /api/profile/me`, allows updating username/phone
- `/profile/purchases` loads paginated data via `GET /api/purchases` with:
  - **Search:** matches `invoice_number` OR item `product_name` (server-side `ILIKE`)
  - **Filter:** by `order_status` (All / Completed / Pending / Cancelled)
  - **Sort:** newest-first or oldest-first
  - **Pagination:** page controls with smart ellipsis

---

## File Structure

```
ginyuu/
├── .env                          # Environment variables
├── package.json                  # Dependencies (Express 5, pg, etc.)
├── scripts/                      # Database setup scripts
│   ├── setup_users_table.js
│   ├── setup_product_table.js
│   ├── setup_cart_table.js
│   ├── setup_order_tables.js
│   ├── setup_queue_table.js
│   ├── setup_notifications_table.js
│   ├── setup_payment_gateway_table.js
│   └── setup_product_indexes.js
│
└── src/
    ├── app.js                    # Express entry point
    ├── config/
    │   └── database.js           # pg Pool connection
    ├── controllers/
    │   └── web.controller.js     # Page render handlers
    ├── features/                 # Feature modules (route + controller + service)
    │   ├── auth/                 # Register, login, logout, forgot/reset password
    │   ├── cart/                 # Cart CRUD + sync
    │   ├── checkout/             # Checkout pipeline
    │   ├── notification/         # FCM push token registration
    │   ├── payment/              # Invoices, QRIS gateway integration
    │   ├── product/              # Product CRUD
    │   ├── promo/                # Promo code validation
    │   ├── user/                 # Profile, purchases
    │   └── whatsapp/             # WhatsApp number check
    ├── shared/
    │   ├── middleware/
    │   │   └── auth.middleware.js # authMiddleware, adminMiddleware
    │   └── services/
    │       ├── email.service.js  # Nodemailer + queue worker
    │       └── whatsapp.service.js
    ├── public/
    │   ├── assets/
    │   │   ├── css/              # landing.css, checkout.css, profile.css, etc.
    │   │   └── js/               # landing.js, cart.js, navbar.js, profile.js, etc.
    │   └── common/
    │       └── main/main.js      # Shared frontend utilities
    └── views/
        ├── landing.ejs, checkout.ejs, waiting-payment.ejs, reset-password.ejs
        ├── partials/             # navbar.ejs, auth-modal.ejs, cart-sidebar.ejs
        └── profile-user/         # profile.ejs, purchases.ejs, settings.ejs, security.ejs, header.ejs, sidebar.ejs
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 4100) |
| `DB_HOST` | PostgreSQL host |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing key |
| `FE_URL` | Frontend URL (CORS origin) |
| `BASE_URL` | Base URL for email links |
| `ACCOUNT_NUMBER` | Bank account for transfers |
| `EMAIL_SENDER` | Gmail address |
| `EMAIL_PASSWORD` | Gmail App Password |
| `API_URL` / `API_KEY` | WhatsApp API credentials |
| `BASE_URL_SANDBOX_API` / `X_API_KEY` / `ID_MERCHANT` | KlikQRIS gateway credentials |

---

## Development

### Adding a feature
1. Create a directory under `src/features/{name}/`
2. Create `{name}.routes.js`, `{name}.controller.js`, `{name}.service.js`
3. Import routes in `src/app.js`

### Database changes
- Scripts in `scripts/` are idempotent (`DROP TABLE IF EXISTS ... CASCADE`)
- All foreign keys use `ON DELETE CASCADE`

### Security
- Passwords: bcrypt (10 rounds)
- Auth: JWT in HttpOnly cookie (not JS-accessible)
- SQL injection: parameterized queries (`$1, $2, ...`)
- Prices: server-side only (fetched from DB during checkout)
- CORS: restricted to `FE_URL`
