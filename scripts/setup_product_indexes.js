const { db } = require('../src/config/database');

const createProductIndexes = async () => {
    const queries = [
        `CREATE INDEX IF NOT EXISTS idx_product_tags_gin ON product USING GIN (tags);`,
        `CREATE INDEX IF NOT EXISTS idx_product_tags_array ON product (tags);`,
    ];

    try {
        for (const query of queries) {
            await db.query(query);
        }
        console.log('✓ product GIN indexes created successfully');
    } catch (err) {
        console.error('✗ Failed to create product indexes:', err.message);
    } finally {
        process.exit(0);
    }
};

createProductIndexes();
