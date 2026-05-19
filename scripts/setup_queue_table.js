const { db } = require('../src/config/database');

const createQueueTable = async () => {
    const query = `
        DROP TABLE IF EXISTS queue CASCADE;
        
        CREATE TABLE queue (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id),
            destination VARCHAR,
            tipe VARCHAR,
            pesan TEXT,
            status VARCHAR,
            qris_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
        CREATE INDEX IF NOT EXISTS idx_queue_tipe ON queue(tipe);
    `;

    try {
        await db.query(query);
        console.log('✓ queue table created successfully');
    } catch (err) {
        console.error('✗ Failed to create queue table:', err.message);
    } finally {
        process.exit(0);
    }
};

createQueueTable();
