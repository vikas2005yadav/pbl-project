const { query, getConnection } = require('../config/database');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// Get all slots
const getAllSlots = asyncHandler(async (req, res) => {
    try {
        const slots = await query('SELECT * FROM slots ORDER BY date, start_time');
        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (error) {
        logger.error('Error fetching slots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch slots'
        });
    }
});

// Get available slots for a specific date
const getAvailableSlotsByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;

    try {
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const slots = await query(
            'SELECT * FROM slots WHERE date = ? AND status = "available" ORDER BY start_time',
            [date]
        );

        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (error) {
        logger.error(`Error fetching slots for date ${date}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch slots for the specified date'
        });
    }
});

// Create a new slot
const createSlot = asyncHandler(async (req, res) => {
    const { date, start_time, end_time } = req.body;

    try {
        // Validate required fields
        if (!date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Please provide date, start_time, and end_time'
            });
        }

        // Check for slot overlap
        const overlappingSlots = await query(
            'SELECT * FROM slots WHERE date = ? AND ' +
            '((start_time <= ? AND end_time >= ?) OR ' +
            '(start_time <= ? AND end_time >= ?) OR ' +
            '(start_time >= ? AND end_time <= ?))',
            [date, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (overlappingSlots.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Slot overlaps with existing slots'
            });
        }

        // Create new slot
        const result = await query(
            'INSERT INTO slots (date, start_time, end_time, status) VALUES (?, ?, ?, "available")',
            [date, start_time, end_time]
        );

        const newSlot = await query('SELECT * FROM slots WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            data: newSlot[0]
        });
    } catch (error) {
        logger.error('Error creating slot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create slot'
        });
    }
});

// Update a slot
const updateSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, start_time, end_time, status } = req.body;

    try {
        // Check if slot exists
        const slotExists = await query('SELECT * FROM slots WHERE id = ?', [id]);
        
        if (slotExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check if slot has bookings before allowing status change
        if (status && status !== slotExists[0].status) {
            const bookings = await query('SELECT * FROM bookings WHERE slot_id = ?', [id]);
            
            if (bookings.length > 0 && status !== 'available') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update slot status because it has active bookings'
                });
            }
        }

        // Update slot
        let updateQuery = 'UPDATE slots SET ';
        const updateValues = [];
        
        if (date) {
            updateQuery += 'date = ?, ';
            updateValues.push(date);
        }
        
        if (start_time) {
            updateQuery += 'start_time = ?, ';
            updateValues.push(start_time);
        }
        
        if (end_time) {
            updateQuery += 'end_time = ?, ';
            updateValues.push(end_time);
        }
        
        if (status) {
            updateQuery += 'status = ?, ';
            updateValues.push(status);
        }
        
        // Add updated_at timestamp
        updateQuery += 'updated_at = NOW() WHERE id = ?';
        updateValues.push(id);
        
        await query(updateQuery, updateValues);
        
        const updatedSlot = await query('SELECT * FROM slots WHERE id = ?', [id]);
        
        res.status(200).json({
            success: true,
            data: updatedSlot[0]
        });
    } catch (error) {
        logger.error(`Error updating slot ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to update slot'
        });
    }
});

// Delete a slot
const deleteSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Check if slot exists
        const slotExists = await query('SELECT * FROM slots WHERE id = ?', [id]);
        
        if (slotExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check if slot has bookings
        const bookings = await query('SELECT * FROM bookings WHERE slot_id = ?', [id]);
        
        if (bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete slot because it has active bookings'
            });
        }

        // Delete slot
        await query('DELETE FROM slots WHERE id = ?', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error) {
        logger.error(`Error deleting slot ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete slot'
        });
    }
});

module.exports = {
    getAllSlots,
    getAvailableSlotsByDate,
    createSlot,
    updateSlot,
    deleteSlot
}; 