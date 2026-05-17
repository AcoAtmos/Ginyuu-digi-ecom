const { db } = require('../src/config/database');

const createPaymentGatewayTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
            id SERIAL PRIMARY KEY,
            invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            gateway VARCHAR(50) NOT NULL DEFAULT 'klikqris',
            gateway_order_id VARCHAR(255),
            signature VARCHAR(255),
            qris_url TEXT,
            direct_url TEXT,
            amount INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            gateway_expired_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_pgt_invoice ON payment_gateway_transactions(invoice_id);
        CREATE INDEX IF NOT EXISTS idx_pgt_gateway_order ON payment_gateway_transactions(gateway_order_id);
    `;

    try {
        await db.query(query);
        console.log('✓ payment_gateway_transactions table created successfully');
    } catch (err) {
        console.error('✗ Failed to create payment_gateway_transactions table:', err.message);
    } finally {
        process.exit(0);
    }
};

createPaymentGatewayTable();
