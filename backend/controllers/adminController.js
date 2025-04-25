const { query, getConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC',
      []
    );
    
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Server error getting users' });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Server error getting user' });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    // Validate role
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user exists
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email already exists (if changing email)
    if (email && email !== users[0].email) {
      const existingUsers = await query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Build update fields
    const updates = [];
    const params = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }
    
    // Add id parameter
    params.push(id);
    
    // Update user
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to update user' });
    }
    
    // Get updated user
    const updatedUsers = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error updating user' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get connection for transaction
    const connection = await getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete user's bookings
      await connection.query('DELETE FROM bookings WHERE user_id = ?', [id]);
      
      // Delete user
      await connection.query('DELETE FROM users WHERE id = ?', [id]);
      
      await connection.commit();
      
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Get total users
        const totalUsersResult = await query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const totalUsers = totalUsersResult[0].count;

        // Get total bookings
        const totalBookingsResult = await query('SELECT COUNT(*) as count FROM bookings');
        const totalBookings = totalBookingsResult[0].count;

        // Get today's bookings
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const todayBookingsResult = await query(
            `SELECT COUNT(*) as count FROM bookings b
             JOIN slots s ON b.slot_id = s.id
             WHERE s.date = ?`,
            [today]
        );
        const todayBookings = todayBookingsResult[0].count;

        // Get booking status counts
        const statusCountsResult = await query(
            'SELECT status, COUNT(*) as count FROM bookings GROUP BY status'
        );
        
        // Convert to object with status as keys
        const statusCounts = statusCountsResult.reduce((acc, curr) => {
            acc[curr.status] = curr.count;
            return acc;
        }, { confirmed: 0, cancelled: 0, completed: 0 });

        // Calculate booking rate (confirmed + completed / total)
        const completionRate = totalBookings > 0
            ? Math.round(((statusCounts.confirmed + statusCounts.completed) / totalBookings) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalBookings,
                todayBookings,
                statusCounts,
                completionRate
            }
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
});

// Get recent bookings for dashboard
const getRecentBookings = asyncHandler(async (req, res) => {
    try {
        const bookings = await query(
            `SELECT b.id, b.booking_reference, b.status, b.created_at,
                    u.name as user_name, s.date, s.start_time, s.end_time
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN slots s ON b.slot_id = s.id
             ORDER BY b.created_at DESC
             LIMIT 5`
        );

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        logger.error('Error fetching recent bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent bookings'
        });
    }
});

// Get recent users for dashboard
const getRecentUsers = asyncHandler(async (req, res) => {
    try {
        const users = await query(
            `SELECT id, name, email, created_at
             FROM users
             WHERE role = 'user'
             ORDER BY created_at DESC
             LIMIT 5`
        );

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        logger.error('Error fetching recent users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent users'
        });
    }
});

// Export bookings to CSV (for Excel)
const exportToCSV = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;
    
    try {
        // Build query with optional filters
        let queryStr = `
            SELECT b.id, b.booking_reference, u.name as user_name, u.email as user_email,
                   b.vehicle_number, s.date, s.start_time, s.end_time, b.status, b.created_at
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN slots s ON b.slot_id = s.id
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        if (startDate) {
            queryStr += ` AND s.date >= ?`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            queryStr += ` AND s.date <= ?`;
            queryParams.push(endDate);
        }
        
        if (status) {
            queryStr += ` AND b.status = ?`;
            queryParams.push(status);
        }
        
        queryStr += ` ORDER BY s.date, s.start_time`;
        
        const bookings = await query(queryStr, queryParams);
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No bookings found for the given criteria'
            });
        }
        
        // Create CSV header row
        const headers = [
            'Booking ID',
            'Reference',
            'User Name',
            'Email',
            'Vehicle Number',
            'Date',
            'Start Time',
            'End Time',
            'Status',
            'Created At'
        ];
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        bookings.forEach(booking => {
            const row = [
                booking.id,
                booking.booking_reference,
                `"${booking.user_name}"`, // Wrap in quotes to handle names with commas
                `"${booking.user_email}"`,
                booking.vehicle_number,
                booking.date,
                booking.start_time,
                booking.end_time,
                booking.status,
                booking.created_at
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `bookings_export_${timestamp}.csv`;
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send CSV content
        res.status(200).send(csvContent);
    } catch (error) {
        logger.error('Error exporting bookings to CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export bookings'
        });
    }
});

// Export bookings to PDF
const exportToPDF = asyncHandler(async (req, res) => {
    // Since we're implementing without external libraries, we'll create an HTML file
    // that can be printed to PDF by the browser
    const { startDate, endDate, status } = req.query;
    
    try {
        // Build query with optional filters
        let queryStr = `
            SELECT b.id, b.booking_reference, u.name as user_name, u.email as user_email,
                   b.vehicle_number, s.date, s.start_time, s.end_time, b.status, b.created_at
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN slots s ON b.slot_id = s.id
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        if (startDate) {
            queryStr += ` AND s.date >= ?`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            queryStr += ` AND s.date <= ?`;
            queryParams.push(endDate);
        }
        
        if (status) {
            queryStr += ` AND b.status = ?`;
            queryParams.push(status);
        }
        
        queryStr += ` ORDER BY s.date, s.start_time`;
        
        const bookings = await query(queryStr, queryParams);
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No bookings found for the given criteria'
            });
        }
        
        // Get summary statistics
        const totalBookings = bookings.length;
        const statusCounts = bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {});
        
        // Create HTML content for PDF
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CNG Booking System - Booking Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #4a6cf7; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .summary { margin: 20px 0; }
                .summary h2 { color: #4a6cf7; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .summary-item { background-color: #f9f9f9; padding: 10px; border-radius: 5px; }
                .summary-item h3 { margin: 0 0 5px 0; }
                .summary-item p { margin: 0; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <h1>CNG Booking System - Booking Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="summary">
                <h2>Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <h3>Total Bookings</h3>
                        <p>${totalBookings}</p>
                    </div>
                    <div class="summary-item">
                        <h3>Confirmed</h3>
                        <p>${statusCounts.confirmed || 0}</p>
                    </div>
                    <div class="summary-item">
                        <h3>Completed</h3>
                        <p>${statusCounts.completed || 0}</p>
                    </div>
                    <div class="summary-item">
                        <h3>Cancelled</h3>
                        <p>${statusCounts.cancelled || 0}</p>
                    </div>
                    <div class="summary-item">
                        <h3>Date Range</h3>
                        <p>${startDate || 'All'} to ${endDate || 'All'}</p>
                    </div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Reference</th>
                        <th>User</th>
                        <th>Vehicle</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>`;
        
        // Add booking rows        
        bookings.forEach(booking => {
            const dateObj = new Date(booking.date);
            const formattedDate = dateObj.toLocaleDateString();
            
            htmlContent += `
                    <tr>
                        <td>${booking.id}</td>
                        <td>${booking.booking_reference}</td>
                        <td>${booking.user_name}</td>
                        <td>${booking.vehicle_number}</td>
                        <td>${formattedDate}</td>
                        <td>${booking.start_time} - ${booking.end_time}</td>
                        <td>${booking.status}</td>
                    </tr>`;
        });
        
        // Close HTML tags
        htmlContent += `
                </tbody>
            </table>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()">Print Report</button>
            </div>
        </body>
        </html>`;
        
        // Set headers for HTML response
        res.setHeader('Content-Type', 'text/html');
        
        // Send HTML content
        res.status(200).send(htmlContent);
    } catch (error) {
        logger.error('Error generating PDF report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF report'
        });
    }
});

// Get system settings
const getSystemSettings = asyncHandler(async (req, res) => {
    try {
        // We'll store system settings in a settings table
        const settings = await query('SELECT * FROM settings');
        
        if (settings.length === 0) {
            // If no settings exist, return defaults
            return res.status(200).json({
                success: true,
                data: {
                    siteName: 'CNG Booking System',
                    bookingLeadTime: 1, // hours
                    maxActiveBookings: 2,
                    maintenanceMode: false
                }
            });
        }
        
        // Convert settings array to object
        const settingsObj = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        
        res.status(200).json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        logger.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system settings'
        });
    }
});

// Update system settings
const updateSystemSettings = asyncHandler(async (req, res) => {
    const { siteName, bookingLeadTime, maxActiveBookings, maintenanceMode } = req.body;
    
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Clear existing settings
        await connection.query('DELETE FROM settings');
        
        // Insert new settings
        if (siteName !== undefined) {
            await connection.query(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                ['siteName', siteName]
            );
        }
        
        if (bookingLeadTime !== undefined) {
            await connection.query(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                ['bookingLeadTime', bookingLeadTime.toString()]
            );
        }
        
        if (maxActiveBookings !== undefined) {
            await connection.query(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                ['maxActiveBookings', maxActiveBookings.toString()]
            );
        }
        
        if (maintenanceMode !== undefined) {
            await connection.query(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                ['maintenanceMode', maintenanceMode ? '1' : '0']
            );
        }
        
        await connection.commit();
        
        res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        logger.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system settings'
        });
    } finally {
        connection.release();
    }
});

module.exports = {
    getDashboardStats,
    getRecentBookings,
    getRecentUsers,
    exportToCSV,
    exportToPDF,
    getSystemSettings,
    updateSystemSettings
}; 