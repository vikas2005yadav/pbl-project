const { query, getConnection } = require('../config/database');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate unique booking reference
const generateBookingReference = () => {
    return `CNG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// Create a new booking
const createBooking = asyncHandler(async (req, res) => {
    const { slot_id, vehicle_number } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!slot_id || !vehicle_number) {
        return res.status(400).json({
            success: false,
            message: 'Please provide slot_id and vehicle_number'
        });
    }

    // Validate vehicle number format
    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/; // Format: MH01AB1234
    if (!vehicleNumberRegex.test(vehicle_number)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid vehicle number format. Use format like MH01AB1234'
        });
    }

    // Begin transaction to ensure data consistency
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Check if slot exists and is available
        const [slots] = await connection.query(
            'SELECT * FROM slots WHERE id = ? FOR UPDATE',
            [slot_id]
        );

        if (slots.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        const slot = slots[0];

        if (slot.status !== 'available') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Slot is not available for booking'
            });
        }

        // Check if user already has active bookings for this date
        const [existingBookings] = await connection.query(
            `SELECT b.* FROM bookings b
             JOIN slots s ON b.slot_id = s.id
             WHERE b.user_id = ? AND s.date = ? AND b.status = 'confirmed'`,
            [user_id, slot.date]
        );

        // Limit to max 2 active bookings per day (from PRD)
        if (existingBookings.length >= 2) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'You have reached the maximum number of active bookings for this date'
            });
        }

        // Generate unique booking reference
        const booking_reference = generateBookingReference();

        // Create booking
        const [result] = await connection.query(
            'INSERT INTO bookings (user_id, slot_id, booking_reference, vehicle_number, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, slot_id, booking_reference, vehicle_number, 'confirmed']
        );

        // Update slot status
        await connection.query(
            'UPDATE slots SET status = ? WHERE id = ?',
            ['booked', slot_id]
        );

        await connection.commit();

        // Get booking details
        const [bookingDetails] = await connection.query(
            `SELECT b.*, s.date, s.start_time, s.end_time, u.name as user_name
             FROM bookings b
             JOIN slots s ON b.slot_id = s.id
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: bookingDetails[0]
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });
    } finally {
        connection.release();
    }
});

// Get user's bookings
const getUserBookings = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    try {
        const bookings = await query(
            `SELECT b.*, s.date, s.start_time, s.end_time
             FROM bookings b
             JOIN slots s ON b.slot_id = s.id
             WHERE b.user_id = ?
             ORDER BY s.date DESC, s.start_time`,
            [user_id]
        );

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        logger.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
});

// Get booking by ID
const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const booking = await query(
            `SELECT b.*, s.date, s.start_time, s.end_time, u.name as user_name
             FROM bookings b
             JOIN slots s ON b.slot_id = s.id
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ? AND (b.user_id = ? OR ? = 'admin')`,
            [id, user_id, req.user.role]
        );

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            data: booking[0]
        });
    } catch (error) {
        logger.error(`Error fetching booking ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking details'
        });
    }
});

// Cancel a booking
const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Begin transaction to ensure data consistency
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Get booking with lock for update
        let bookingQuery = 'SELECT * FROM bookings WHERE id = ?';
        let queryParams = [id];
        
        // If not admin, only allow cancellation of own bookings
        if (!isAdmin) {
            bookingQuery += ' AND user_id = ?';
            queryParams.push(user_id);
        }
        
        bookingQuery += ' FOR UPDATE';
        
        const [bookings] = await connection.query(bookingQuery, queryParams);

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        const booking = bookings[0];

        if (booking.status !== 'confirmed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Booking cannot be cancelled because it is already ${booking.status}`
            });
        }

        // Update booking status
        await connection.query(
            'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
            ['cancelled', id]
        );

        // Update slot status back to available
        await connection.query(
            'UPDATE slots SET status = ?, updated_at = NOW() WHERE id = ?',
            ['available', booking.slot_id]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error(`Error cancelling booking ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking'
        });
    } finally {
        connection.release();
    }
});

// Complete a booking (admin only)
const completeBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized. Admin access required'
        });
    }

    // Begin transaction
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Get booking with lock for update
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
            [id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        if (booking.status !== 'confirmed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Booking cannot be completed because it is ${booking.status}`
            });
        }

        // Update booking status
        await connection.query(
            'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
            ['completed', id]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Booking marked as completed'
        });
    } catch (error) {
        await connection.rollback();
        logger.error(`Error completing booking ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete booking'
        });
    } finally {
        connection.release();
    }
});

// Get all bookings (admin only)
const getAllBookings = asyncHandler(async (req, res) => {
    // Verify admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized. Admin access required'
        });
    }

    const { date, status, page = 1, limit = 10 } = req.query;
    
    try {
        let queryStr = `
            SELECT b.*, s.date, s.start_time, s.end_time, u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN slots s ON b.slot_id = s.id
            JOIN users u ON b.user_id = u.id
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        // Apply filters
        if (date) {
            queryStr += ` AND s.date = ?`;
            queryParams.push(date);
        }
        
        if (status) {
            queryStr += ` AND b.status = ?`;
            queryParams.push(status);
        }
        
        // Add ordering
        queryStr += ` ORDER BY s.date DESC, s.start_time`;
        
        // Add pagination
        const offset = (page - 1) * limit;
        queryStr += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        // Get bookings
        const bookings = await query(queryStr, queryParams);
        
        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM bookings b
            JOIN slots s ON b.slot_id = s.id
            WHERE 1=1
            ${date ? ' AND s.date = ?' : ''}
            ${status ? ' AND b.status = ?' : ''}
        `;
        
        const countParams = [];
        if (date) countParams.push(date);
        if (status) countParams.push(status);
        
        const totalResults = await query(countQuery, countParams);
        const total = totalResults[0].total;
        
        res.status(200).json({
            success: true,
            count: bookings.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: bookings
        });
    } catch (error) {
        logger.error('Error fetching all bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
});

module.exports = {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    completeBooking,
    getAllBookings
}; 