const express = require('express');
const { getUserProfile, updateUserProfile, updatePassword } = require('../controllers/profileController');
const auth = require('../middleware/auth');

const router = express.Router();

// Protected routes - require authentication
router.get('/me', auth, getUserProfile);
router.put('/update', auth, updateUserProfile);
router.put('/change-password', auth, updatePassword);

module.exports = router;