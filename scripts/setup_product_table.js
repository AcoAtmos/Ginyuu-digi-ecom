const { db } = require('../src/config/database');

const createProductTable = async () => {
    const queries = [
        `DROP TABLE IF EXISTS product CASCADE;`,

        `CREATE TABLE product (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            slug VARCHAR NOT NULL UNIQUE,
            price INTEGER NOT NULL,
            discount DECIMAL,
            category VARCHAR,
            preview VARCHAR,
            description TEXT,
            sales_count INTEGER DEFAULT 0,
            tags TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_product_slug ON product(slug);
        CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);
        CREATE INDEX IF NOT EXISTS idx_product_tags_gin ON product USING GIN (tags);
        CREATE INDEX IF NOT EXISTS idx_product_tags_array ON product (tags);`
    ];

    try {
        for (const query of queries) {
            await db.query(query);
        }
        console.log('✓ product table created successfully (with GIN index on tags)');
    } catch (err) {
        console.error('✗ Failed to create product table:', err.message);
    } finally {
        process.exit(0);
    }
};

createProductTable();
