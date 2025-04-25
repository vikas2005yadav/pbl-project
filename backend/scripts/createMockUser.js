require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { User } = require('../models');
const { sequelize } = require('../config/db');

async function createMockUser() {
    try {
        // Log connection attempt
        console.log('Attempting to connect to database:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME
        });

        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Sync models with database
        await sequelize.sync();
        console.log('Database models synchronized.');

        // Create mock user
        const mockUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123', // Will be hashed by model hooks
            phone: '1234567890',
            role: 'user'
        });

        console.log('Mock user created successfully:', {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone,
            role: mockUser.role
        });

    } catch (error) {
        console.error('Error:', error);
        if (error.original) {
            console.error('Database error:', {
                code: error.original.code,
                errno: error.original.errno,
                sqlMessage: error.original.sqlMessage
            });
        }
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('Database connection closed.');
    }
}

// Run the function
createMockUser(); 