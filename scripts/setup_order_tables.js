const { db } = require('../src/config/database');

const setupOrderTables = async () => {
    const queries = [
        `-- Drop existing tables in correct order
        DROP TABLE IF EXISTS invoices CASCADE;
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS promo_codes CASCADE;`,

        `-- ORDER HEADER (without product_id, supports multi-product)
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            payment_method VARCHAR(50) NOT NULL,
            subtotal INTEGER NOT NULL DEFAULT 0,
            discount_amount INTEGER NOT NULL DEFAULT 0,
            unique_num INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_orders_user_id ON orders(user_id);
        CREATE INDEX idx_orders_status ON orders(status);`,

        `-- ORDER LINE ITEMS (1 row per product)
        CREATE TABLE order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
            price INTEGER NOT NULL
        );

        CREATE INDEX idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX idx_order_items_product_id ON order_items(product_id);`,

        `-- INVOICES (1 per order)
        CREATE TABLE invoices (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            invoice_number VARCHAR(100) NOT NULL UNIQUE,
            discount_amount INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL DEFAULT 0,
            expires_at TIMESTAMP NOT NULL,
            unique_num INTEGER NOT NULL DEFAULT 0,
            status_payment VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_invoices_order_id ON invoices(order_id);
        CREATE INDEX idx_invoices_number ON invoices(invoice_number);`,

        `-- PROMO CODES
        CREATE TABLE promo_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
            max_usage INTEGER,
            used_count INTEGER NOT NULL DEFAULT 0,
            expires_at TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_promo_codes_code ON promo_codes(code);
        CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);`,

        `-- Seed promo codes
        INSERT INTO promo_codes (code, discount_pct, max_usage, expires_at, is_active) VALUES
            ('DIGI20', 0.20, 100, NOW() + INTERVAL '30 days', true),
            ('HEMAT20', 0.20, NULL, NOW() + INTERVAL '60 days', true),
            ('WELCOME10', 0.10, 50, NOW() + INTERVAL '90 days', true),
            ('NEWYEAR', 0.15, NULL, NOW() + INTERVAL '120 days', true)
        ON CONFLICT (code) DO NOTHING;`
    ];

    try {
        for (const query of queries) {
            await db.query(query);
        }
        console.log('\n✅ All tables created successfully:');
        console.log('   - orders (header, multi-product support)');
        console.log('   - order_items (1 row per product)');
        console.log('   - invoices (1 per order, expires in 3 days)');
        console.log('   - promo_codes (with 4 seed codes)');
        console.log('\n✅ Promo codes seeded: DIGI20 (20%), HEMAT20 (20%), WELCOME10 (10%), NEWYEAR (15%)');
    } catch (err) {
        console.error('\n✗ Failed to create tables:', err.message);
    } finally {
        process.exit(0);
    }
};

setupOrderTables();
