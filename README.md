# Ginyuu — Digital Product Store

Full-stack e-commerce for digital products with guest checkout, multi-product cart, promo codes, invoice generation, automated email/WhatsApp notifications, email verification, and user profile management.

---

## Architecture

Express 5 server (Port 4100) with EJS templates, vanilla JavaScript frontend, REST API, and PostgreSQL database managed via Drizzle ORM.

**Frontend layers:**
- Views: landing.ejs, checkout.ejs, waiting-payment.ejs, reset-password.ejs, verify-email.ejs
- Profile pages: profile.ejs, purchases.ejs, settings.ejs, security.ejs
- Partials: navbar.ejs (includes auth modal with verify tab), cart-sidebar.ejs
- JavaScript: main.js (shared utilities), navbar.js, cart.js, landing.js, products.js, checkout.js, profile.js, waiting_for_payment.js

**Backend features (route + controller + service per domain):**
auth, cart, checkout, promo, payment, user, product, notification, whatsapp

**Shared layer:**
auth middleware, email + WhatsApp queue worker (single worker handles both), whatsapp service

**Database layer (Drizzle ORM):**
db/schema/ directory with 10 table definitions, Drizzle query builder for all CRUD operations, automated migration support via drizzle-kit.

PostgreSQL tables: users, product, cart_items, orders, order_items, invoices, promo_codes, queue, notifications, payment_gateway_transactions

---

## Quick Start

### Prerequisites
- **Runtime:** Bun (recommended) or Node.js ≥18
- **Database:** PostgreSQL 14+
- **Email:** Gmail account with App Password (for sending invoices)
- **WhatsApp API:** Woowa API endpoint + API key (optional)

### 1. Clone & Install
```bash
git clone <repo>
cd ginyuu
bun install
```

### 2. Database Setup
```bash
createdb ginyuu
bun run db:push
```

### 3. Configure Environment
Copy `.env.example` to `.env` and fill in:
```env
# ── Server ──
PORT=4100
NODE_ENV=development

# ── Database (PostgreSQL) ──
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ginyuu
DATABASE_URL=postgres://postgres:your_password@localhost:5432/ginyuu

# ── JWT (Auth) ──
JWT_SECRET=your_secret_key

# ── URLs ──
LOCAL_URL=http://localhost:4100
PUBLIC_URL=http://localhost:4100

# ── Bank Transfer ──
ACCOUNT_NUMBER=1234567890

# ── Email (Gmail SMTP) ──
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# ── WhatsApp API ──
API_URL=https://notifapi.com
API_KEY_WOOWA=your_key

# ── QRIS Gateway (KlikQRIS) ──
BASE_URL_SANDBOX_API=https://klikqris.com/api/sandbox/qris/create
X_API_KEY=sk_sandbox_your_key
ID_MERCHANT=your_merchant_id

# ── Admin Panel ──
ADMIN_PORT=3100
ADMIN_LOCAL_URL=http://localhost:3100
ADMIN_PUBLIC_URL=http://localhost:3100
ADMIN_JWT_SECRET=your_admin_secret
```

### 4. Run
```bash
bun run dev           # Main store (Port 4100)
bun run admin         # Admin panel (Port 3100)
```
**Access:** Store at `http://localhost:4100`, Admin at `http://localhost:3100`

---

## Frontend Routes

| Route | Template | Description |
|-------|----------|-------------|
| `/` | `landing.ejs` | Landing page — product grid, search, filters, auth modal, cart sidebar |
| `/checkout` | `checkout.ejs` | Checkout — account info, payment selection, promo, order summary |
| `/checkout/waiting-payment` | `waiting-payment.ejs` | Payment instructions page after checkout |
| `/verify-email` | `verify-email.ejs` | Email verification result page (success/error) |
| `/reset-password` | `reset-password.ejs` | Password reset page (token-based) |
| `/profile` | `profile-user/profile.ejs` | User profile — avatar, name, email, username, phone |
| `/profile/purchases` | `profile-user/purchases.ejs` | Purchase history — search, filter, sort, pagination |
| `/profile/settings` | `profile-user/settings.ejs` | Account settings (placeholder) |
| `/profile/security` | `profile-user/security.ejs` | Security settings (placeholder) |

### JavaScript Modules

| File | Type | Purpose |
|------|------|---------|
| `common/main/main.js` | `<script type="module">` | Shared utilities: `checkAuthStatus()`, `showToast()`, `logout()`, `resendVerification()`, cookie helpers |
| `assets/js/navbar.js` | `<script type="module">` | Navbar init, auth modal (login/register/forgot/verify), cart sidebar, sidebar active state |
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
| `POST` | `/api/auth/register` | No | Register (creates user as `inactive`, sends verification email) |
| `POST` | `/api/auth/login` | No | Login — rejects `inactive` users with `canResend: true` |
| `POST` | `/api/auth/verify_token` | No | Verify JWT (returns null for guests) |
| `GET` | `/api/auth/verify-email` | No | Verify email via JWT token (`?token=`) |
| `POST` | `/api/auth/resend-verification` | No | Resend verification email for inactive users |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `POST` | `/api/auth/logout` | No | Clear cookie |
| `POST` | `/api/auth/forgot-password` | No | Send reset link (always 200) |
| `POST` | `/api/auth/reset-password` | No | Reset password (JWT token, 15-min expiry) |

### Checkout
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/checkout` | No* | Process checkout (guest auto-register or logged-in) |

\* Optional auth — cookie checked if present. Logged-in users with `status !== 'active'` are rejected.

### Payment
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/get_invoice/:invoice_number` | No | Invoice details |
| `POST` | `/api/payment_process` | No | Confirm payment |
| `POST` | `/api/payment/create-transaction` | Yes | Create QRIS transaction (KlikQRIS) |
| `GET` | `/api/payment/check-status/:invoice` | Yes | Check payment status |
| `POST` | `/api/payment/webhook` | No | KlikQRIS webhook — updates payment & enqueues success email |

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
| `GET` | `/api/notifications` | Yes | Get all notifications |
| `PATCH` | `/api/notifications/:id/read` | Yes | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Yes | Mark all as read |

### WhatsApp
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/check_whatsapp/:phone` | No | Check if phone is on WhatsApp |

---

## Database Schema

### users
`id (PK)`, `username`, `email (UQ)`, `password` (bcrypt), `phone`, `image_url`, `role` (default `'MEMBER'`), `status` (default `'inactive'`, set to `'active'` on email verification), `terms`, `created_at`

### product
`id (PK)`, `name`, `slug (UQ)`, `price`, `discount`, `category`, `preview`, `description`, `sales_count`, `created_at`

### cart_items
`id (PK)`, `user_id (FK)`, `product_id (FK)`, `added_at` — Unique: `(user_id, product_id)`

### orders
`id (PK)`, `user_id (FK)`, `payment_method`, `subtotal`, `discount_amount`, `unique_num`, `total`, `status` (pending/completed/cancelled), `created_at`

### order_items
`id (PK)`, `order_id (FK)`, `product_id (FK)`, `price` (snapshot at purchase)

### invoices
`id (PK)`, `order_id (FK)`, `invoice_number (UQ)`, `discount_amount`, `total`, `expires_at`, `status_payment` (pending/paid/cancelled), `created_at`

### promo_codes
`id (PK)`, `code (UQ)`, `discount_pct`, `max_usage`, `used_count`, `expires_at`, `is_active`, `created_at`
**Seed codes:** `DIGI20` (20%), `HEMAT20` (20%), `WELCOME10` (10%), `NEWYEAR` (15%)

### queue (Message queue — email & WhatsApp)
`id (PK)`, `order_id (FK)`, `destination` (email address or phone), `tipe` (email/whatsapp), `pesan` (HTML or plain text), `qris_url`, `status` (pending/sent/failed), `created_at`

### notifications
`id (PK)`, `user_id (FK)`, `icon`, `message`, `action_url`, `is_read`, `created_at`

### payment_gateway_transactions
`id (PK)`, `invoice_id (FK)`, `gateway`, `gateway_order_id`, `signature`, `qris_url`, `direct_url`, `amount`, `status`, `gateway_expired_at`, `created_at`, `updated_at`

---

## Key Flows

### Authentication
- **Register** → bcrypt hash → insert user with `status: 'inactive'` → generate JWT `type: 'email_verification'` (24h) → send verification email
- **Verify Email** → `GET /verify-email?token=` → verify JWT → set `status: 'active'` → redirect to success page
- **Login** → verify password → reject if `status !== 'active'` (returns `canResend: true`) → create JWT (24h) → set HttpOnly cookie
- **Resend Verification** → find inactive user → generate new JWT → resend email
- **Forgot Password** → generate JWT (15-min expiry, `type: 'password_reset'`) → send email with reset link → always return 200
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
   - Find or create user (guest auto-registration creates user as `active`)
   - Create order + order_items
   - Create invoice (`INV-{ts}{userId}-{orderId}`, expires 3 days)
   - Clear cart_items
   - Insert payment-instruction email & WhatsApp (if phone provided) into queue
6. Return invoice details
7. Background worker polls queue every 10s → sends via Nodemailer or Woowa API

### Payment
- **QRIS:** `POST /api/payment/create-transaction` creates KlikQRIS transaction → queue payment email + WhatsApp
- **Webhook:** KlikQRIS notifies `/api/payment/webhook` → `updateInvoiceToPaid()` → send success email → create in-app notification
- **Bank transfer:** User transfers to `ACCOUNT_NUMBER` (manual verification)

### Profile & Purchases
- `/profile` loads user data via `GET /api/profile/me`, allows updating username/phone
- `/profile/purchases` loads paginated data via `GET /api/purchases` with:
  - **Search:** matches `invoice_number` OR item `product_name` (server-side `ILIKE`)
  - **Filter:** by `order_status` (All / Completed / Pending / Cancelled)
  - **Sort:** newest-first or oldest-first
  - **Pagination:** page controls with smart ellipsis

---

## File Structure

**Root level:**
- .env - Environment variables (DB, JWT, Email, Payment gateway)
- .env.example - Template for environment variables with all required keys
- package.json - Dependencies with scripts
- drizzle.config.ts - Drizzle Kit configuration for migrations
- db/ - Database layer (Drizzle ORM)
  - schema/ - 10 table definitions (users, product, cartItems, orders, etc.)
  - index.js - Drizzle client initialization
  - migrations/ - Auto-generated SQL migration files + meta/ (journal, snapshots)
- admin/ - Admin panel (Express on Port 3100)
  - app.js, seed.js
  - config/, features/ (auth, dashboard, orders, profile, users), views/, public/
  - middleware/auth-admin.middleware.js - Admin auth with role + status check
- src/ - Main store application (Express on Port 4100)
  - app.js - Express entry point (sets up res.locals.PUBLIC_URL, queue worker)
  - config/database.js - Database connection (re-exports Drizzle client)
  - controllers/web.controller.js - Page render handlers
  - features/ - Feature modules (route + controller + service per domain)
    - auth, cart, checkout, notification, payment, product, promo, user, whatsapp
  - shared/ - Shared middleware (auth.middleware.js) and services (email + whatsapp queue worker, whatsapp service)
  - public/common/ - Shared JS modules (main.js with auth, toast, cookie utilities)
  - public/assets/ - CSS and JavaScript files for frontend
  - views/ - EJS templates (landing, checkout, waiting-payment, verify-email, profile pages, partials)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 4100) |
| `NODE_ENV` | Environment (development/production) |
| `DB_HOST` | PostgreSQL host |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | Database name |
| `DATABASE_URL` | Connection string for Drizzle Kit |
| `JWT_SECRET` | JWT signing key (user auth) |
| `ACCOUNT_NUMBER` | Bank account number for transfers |
| `PUBLIC_URL` | Public-facing URL for email links (verification, reset) |
| `LOCAL_URL` | Internal server URL (default http://localhost:4100) |
| `EMAIL_SENDER` | Gmail address for sending emails |
| `EMAIL_PASSWORD` | Gmail App Password |
| `API_URL` | Woowa API endpoint |
| `API_KEY_WOOWA` | Woowa API key |
| `BASE_URL_SANDBOX_API` | KlikQRIS API endpoint |
| `X_API_KEY` | KlikQRIS API key |
| `ID_MERCHANT` | KlikQRIS merchant ID |
| `ADMIN_PORT` | Admin panel port (default 3100) |
| `ADMIN_PUBLIC_URL` | Public URL for admin email links |
| `ADMIN_LOCAL_URL` | Internal admin server URL |
| `ADMIN_JWT_SECRET` | JWT signing key (admin auth) |

---

## Development

### Adding a feature
1. Create a directory under `src/features/{name}/`
2. Create `{name}.routes.js`, `{name}.controller.js`, `{name}.service.js`
3. Import routes in `src/app.js`

### Database changes
- Edit table definitions in `db/schema/` directory
- Generate migration: `bun run db:generate` (creates `.sql` in `db/migrations/`)
- Apply migration: `bun run db:migrate`
- Or push directly to database (dev only): `bun run db:push`
- Browse database via Drizzle Studio: `bun run db:studio`
- All foreign keys use `ON DELETE CASCADE`
- **Migration workflow:** change schema → `db:generate` → `db:migrate` → commit both `.sql` and `meta/` changes
- **⚠️ Never** delete or manually edit migration files after they've been applied

### Email Verification Flow
1. User registers → created as `status: 'inactive'` → verification email sent
2. User clicks link → JWT verified → `status` set to `'active'`
3. Login checks `status === 'active'` — inactive users see a "verify email" prompt
4. Guest checkout and register-by-checkout users are created as `active` (no verification needed)

### Message Queue
- Single queue worker runs every 10s in `src/app.js`
- Processes both `email` and `whatsapp` queue entries via `send_queue_worker()`
- Email sent via Nodemailer (Gmail SMTP)
- WhatsApp sent via Woowa API
- Failed entries are marked `'failed'` and skipped

### Security
- Passwords: bcrypt (10 rounds)
- Auth: JWT in HttpOnly cookie (not JS-accessible)
- SQL injection: Drizzle ORM parameterized queries (auto-escaped)
- Prices: server-side only (fetched from DB during checkout)
- Admin: JWT signed with separate `ADMIN_JWT_SECRET`, middleware checks both `role` and `status`
