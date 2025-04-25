const express = require('express');
const router = express.Router();
const {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    completeBooking,
    getAllBookings
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(protect);

// User routes
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

// Admin routes
router.use('/admin', adminOnly);
router.get('/admin/all', getAllBookings);
router.put('/admin/:id/complete', completeBooking);

module.exports = router; 