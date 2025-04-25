const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Create a connection pool
let pool = null;

// Initialize the database connection pool
async function initializeDatabase() {
    try {
        // Ensure required environment variables are set
        const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Create connection pool
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Verify connection
        const connection = await pool.getConnection();
        console.log('MySQL Database connected successfully');
        connection.release();

        // Create tables if they don't exist
        await setupDatabase();
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Setup database tables based on PRD schema
async function setupDatabase() {
    try {
        // First, drop tables if they exist (in reverse order of creation to handle foreign keys)
        const dropQueries = [
            `DROP TABLE IF EXISTS bookings`,
            `DROP TABLE IF EXISTS time_slots`,
            `DROP TABLE IF EXISTS stations`,
            `DROP TABLE IF EXISTS slots`,
            `DROP TABLE IF EXISTS settings`,
            `DROP TABLE IF EXISTS users`
        ];

        // Execute drop queries
        for (const query of dropQueries) {
            await pool.query(query);
        }

        const createQueries = [
            // Users Table
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX unique_email (email),
                UNIQUE INDEX unique_name (name)
            )`,

            // Stations Table
            `CREATE TABLE IF NOT EXISTS stations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255) NOT NULL,
                rating DECIMAL(2,1) DEFAULT 0.0,
                avg_wait_time INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Time Slots Table
            `CREATE TABLE IF NOT EXISTS time_slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slot_time TIME NOT NULL,
                max_bookings INT DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX unique_slot_time (slot_time)
            )`,

            // Slots Table
            `CREATE TABLE IF NOT EXISTS slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Bookings Table
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                slot_id INT NOT NULL,
                station_id INT,
                time_slot_id INT,
                booking_date DATE,
                booking_reference VARCHAR(50) UNIQUE,
                vehicle_number VARCHAR(50) NOT NULL,
                status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
                FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
                FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE SET NULL
            )`,

            // Settings Table
            `CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(50) NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE INDEX unique_key (\`key\`)
            )`
        ];

        // Execute each query
        for (const query of createQueries) {
            await pool.query(query);
        }

        // Insert default settings
        const defaultSettings = [
            ['siteName', 'CNG Booking System'],
            ['bookingLeadTime', '1'],
            ['maxActiveBookings', '2'],
            ['maintenanceMode', '0']
        ];

        // Check if settings exist
        const [existingSettings] = await pool.query('SELECT COUNT(*) as count FROM settings');
        
        if (existingSettings[0].count === 0) {
            // Insert default settings
            for (const [key, value] of defaultSettings) {
                await pool.query('INSERT INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
            }
        }

        console.log('Database tables created/verified successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw error;
    }
}

// Execute a query
async function query(sql, params) {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Get a connection from the pool (for transactions)
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error getting connection:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    query,
    getConnection
};