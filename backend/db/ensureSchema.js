const db = require('../config/db');

async function ensureSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            company VARCHAR(255),
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            service VARCHAR(255) NOT NULL,
            message TEXT,
            status VARCHAR(50) DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS company VARCHAR(255)
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        INSERT INTO admins (email, password_hash)
        VALUES ('admin@chop.ru', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa')
        ON CONFLICT (email) DO NOTHING
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_companies (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            normalized_name VARCHAR(255) UNIQUE NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC)
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_blacklisted_companies_normalized_name
        ON blacklisted_companies(normalized_name)
    `);
}

module.exports = ensureSchema;
