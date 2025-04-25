const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all settings
// Admin only
router.get('/', protect, adminOnly, settingsController.getAllSettings);

// Update a single setting
// Admin only
router.put(
    '/',
    protect,
    adminOnly,
    [
        check('key').notEmpty().withMessage('Setting key is required'),
        check('value').notEmpty().withMessage('Setting value is required')
    ],
    settingsController.updateSetting
);

// Update multiple settings at once
// Admin only
router.put('/batch', protect, adminOnly, settingsController.updateMultipleSettings);

module.exports = router;