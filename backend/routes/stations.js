const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

// Get all stations
router.get('/', async (req, res) => {
    try {
        const stations = await query('SELECT * FROM stations');
        res.json(stations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stations' });
    }
});

// Get station by ID
router.get('/:id', async (req, res) => {
    try {
        const stations = await query('SELECT * FROM stations WHERE id = ?', [req.params.id]);
        
        if (stations.length === 0) {
            return res.status(404).json({ message: 'Station not found' });
        }
        
        res.json(stations[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching station' });
    }
});

// Get available time slots for a station on a specific date
router.get('/:id/time-slots/:date', async (req, res) => {
    try {
        const { id, date } = req.params;

        // Get all time slots with booking counts
        const timeSlots = await query(`
            SELECT ts.*, 
                   (SELECT COUNT(*) 
                    FROM bookings 
                    WHERE station_id = ? 
                    AND booking_date = ? 
                    AND time_slot_id = ts.id) as booked_count
            FROM time_slots ts
        `, [id, date]);

        // Filter available slots
        const availableSlots = timeSlots.map(slot => ({
            ...slot,
            available: slot.max_bookings > slot.booked_count
        }));

        res.json(availableSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching time slots' });
    }
});

module.exports = router; 