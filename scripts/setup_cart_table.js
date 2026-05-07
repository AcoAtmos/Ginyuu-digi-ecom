const { db } = require('./common/helper');

const createCartTable = async () => {
    const query = `
        DROP TABLE IF EXISTS cart_items CASCADE;
        
        CREATE TABLE cart_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id)
        );

        CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart_items(product_id);
    `;

    try {
        await db.query(query);
        console.log('✓ cart_items table created successfully (no quantity, digital products only)');
    } catch (err) {
        console.error('✗ Failed to create cart_items table:', err.message);
    } finally {
        process.exit(0);
    }
};

createCartTable();
