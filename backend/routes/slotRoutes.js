const express = require('express');
const router = express.Router();
const {
    getAllSlots,
    getAvailableSlotsByDate,
    createSlot,
    updateSlot,
    deleteSlot
} = require('../controllers/slotController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/date/:date', getAvailableSlotsByDate);

// Protected routes (require authentication)
router.use(protect);

// Regular user routes
// None for now

// Admin routes
router.use(adminOnly);
router.get('/', getAllSlots);
router.post('/', createSlot);
router.put('/:id', updateSlot);
router.delete('/:id', deleteSlot);

module.exports = router; 