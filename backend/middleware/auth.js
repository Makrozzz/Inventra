const jwt = require('jsonwebtoken');
const { formatResponse } = require('../utils/helpers');
const { executeQuery } = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(
        formatResponse(false, null, 'Access token required')
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Verify user still exists in database
    const user = await executeQuery(
      'SELECT user_id, username, email, role FROM users WHERE user_id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json(
        formatResponse(false, null, 'Invalid token - user not found')
      );
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        formatResponse(false, null, 'Token expired')
      );
    }
    
    return res.status(401).json(
      formatResponse(false, null, 'Invalid token')
    );
  }
};

/**
 * Middleware to check user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        formatResponse(false, null, 'Authentication required')
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        formatResponse(false, null, 'Insufficient permissions')
      );
    }

    next();
  };
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    // Token invalid, but continue without user
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth
};