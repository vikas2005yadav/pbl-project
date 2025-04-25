const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings');
        
        // Convert to object format for easier frontend use
        const settingsObject = {};
        settings.forEach(setting => {
            settingsObject[setting.key] = setting.value;
        });
        
        return res.status(200).json({
            success: true,
            data: settingsObject
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update a setting
exports.updateSetting = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    const { key, value } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE settings SET value = ? WHERE key = ?',
            [value, key]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Setting updated successfully'
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update multiple settings at once
exports.updateMultipleSettings = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    const settings = req.body;

    try {
        // Use a transaction to ensure all updates are applied or none
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const [key, value] of Object.entries(settings)) {
                await connection.query(
                    'UPDATE settings SET value = ? WHERE key = ?',
                    [value, key]
                );
            }

            await connection.commit();
            connection.release();

            return res.status(200).json({
                success: true,
                message: 'Settings updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 