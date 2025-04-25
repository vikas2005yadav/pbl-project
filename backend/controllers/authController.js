const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, getConnection } = require('../config/database');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, username, password } = req.body;
    
    // Validate input
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Please provide name, username, and password' });
    }
    
    // Check if user already exists
    const existingUsers = await query('SELECT * FROM users WHERE name = ? OR email = ?', [username, username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user (use username in both name and email fields for compatibility)
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, username, hashedPassword, 'user']
    );
    
    if (result.affectedRows === 1) {
      // Generate JWT token
      const token = jwt.sign(
        { id: result.insertId, name, username, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: result.insertId,
          name,
          username,
          role: 'user'
        }
      });
    }
    
    return res.status(500).json({ message: 'Failed to register user' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Username already exists' 
        : 'Server error during registration'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    // Find user by username (stored in email field) or name field
    const users = await query('SELECT * FROM users WHERE name = ? OR email = ?', [username, username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, username: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.email,  // Use email field as username
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    // Check fixed admin credentials as specified in PRD
    if (username !== 'admin' || password !== '265325') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Generate JWT token for admin
    const token = jwt.sign(
      { id: 'admin', username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error during admin login' });
  }
};

// Get current user information
exports.getCurrentUser = async (req, res) => {
  try {
    const users = await query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      user: users[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Server error getting user information' });
  }
};

module.exports = {
  registerUser: exports.register,
  loginUser: exports.login,
  getMe: exports.getCurrentUser,
  adminLogin: exports.adminLogin
}; 