const { db } = require('../src/config/database');

const createUsersTable = async () => {
    const query = `
        DROP TABLE IF EXISTS users CASCADE;
        
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR NOT NULL,
            email VARCHAR NOT NULL UNIQUE,
            password VARCHAR NOT NULL,
            phone VARCHAR,
            image_url VARCHAR,
            role VARCHAR DEFAULT 'MEMBER',
            terms BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `;

    try {
        await db.query(query);
        console.log('✓ users table created successfully');
    } catch (err) {
        console.error('✗ Failed to create users table:', err.message);
    } finally {
        process.exit(0);
    }
};

createUsersTable();
