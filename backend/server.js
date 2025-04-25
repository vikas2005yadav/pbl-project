// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/db');
const { initializeDatabase } = require('./config/database');

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : 'http://localhost:4000', // Restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settingsRoutes');

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CNG Booking API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database connection
console.log('Connecting to MySQL database...');

// First initialize tables with our custom database.js
initializeDatabase()
    .then(() => {
        console.log('Database tables created successfully');
        // Then connect with Sequelize for ORM functionality
        return connectDB();
    })
    .then(() => {
        console.log('MySQL database connection successful');
        
        // Start server after database is ready
        const PORT = process.env.PORT || 4000;
        
        // Start server with error handling
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Test the API at: http://localhost:${PORT}/test`);
        }).on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try a different port.`);
            } else {
                console.error('Error starting server:', error);
            }
        });
        
        // Handle process termination
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    })
    .catch(error => {
        console.error('Database connection error:', error);
        process.exit(1); // Exit if database connection fails
    }); 