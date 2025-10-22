const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser
} = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidationRules = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Invalid role')
];

const loginValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidationRules = [
  body('firstName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const changePasswordValidationRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Public routes
router.post('/register', 
  registerValidationRules, 
  handleValidationErrors, 
  register
);

router.post('/login', 
  loginValidationRules, 
  handleValidationErrors, 
  login
);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

router.put('/profile', 
  authenticateToken, 
  updateProfileValidationRules, 
  handleValidationErrors, 
  updateProfile
);

router.put('/change-password', 
  authenticateToken, 
  changePasswordValidationRules, 
  handleValidationErrors, 
  changePassword
);

// Admin only routes
router.get('/users', 
  authenticateToken, 
  authorize('admin'), 
  getAllUsers
);

router.delete('/users/:userId', 
  authenticateToken, 
  authorize('admin'), 
  deleteUser
);

// Development only - generate test token
if (process.env.NODE_ENV === 'development') {
  router.post('/dev-token', (req, res) => {
    try {
      const testUser = {
        userId: 1,
        username: 'dev-user',
        email: 'dev@test.com',
        role: 'admin'
      };

      const token = jwt.sign(
        testUser,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: testUser
        },
        message: 'Development token generated'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate development token',
        error: error.message
      });
    }
  });
}

module.exports = router;