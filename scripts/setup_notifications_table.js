const { db } = require('../src/config/database');

const createNotificationsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            icon VARCHAR(10) DEFAULT '🔔',
            message TEXT NOT NULL,
            action_url VARCHAR(255),
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, is_read);
    `;

    try {
        await db.query(query);
        console.log('✓ notifications table created successfully');
    } catch (err) {
        console.error('✗ Failed to create notifications table:', err.message);
    } finally {
        process.exit(0);
    }
};

createNotificationsTable();
