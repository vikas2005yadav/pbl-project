const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentBookings,
    getRecentUsers,
    exportToCSV,
    exportToPDF,
    getSystemSettings,
    updateSystemSettings
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/bookings/recent', getRecentBookings);
router.get('/users/recent', getRecentUsers);

// Export routes
router.get('/export/csv', exportToCSV);
router.get('/export/pdf', exportToPDF);

// Settings routes
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router; 