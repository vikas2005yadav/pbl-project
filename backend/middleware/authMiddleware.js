const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, no token provided' 
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if admin route
      if (decoded.role === 'admin') {
        req.user = decoded;
        return next();
      }
      
      // For regular users, get user from database
      const users = await query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'User no longer exists' 
        });
      }
      
      req.user = users[0];
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, invalid token' 
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error in authentication' 
    });
  }
};

// Middleware to restrict access to admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized, admin access required' 
    });
  }
};

module.exports = { protect, adminOnly }; 