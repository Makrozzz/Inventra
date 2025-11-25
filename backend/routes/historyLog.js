const express = require('express');
const router = express.Router();
const historyLogController = require('../controllers/historyLogController');
const { authenticateToken } = require('../middleware/auth');

// Get history logs with pagination (protected route)
router.get('/', authenticateToken, historyLogController.getHistoryLogs);

// Create history log (for internal use/testing - protected route)
router.post('/', authenticateToken, historyLogController.createHistoryLog);

module.exports = router;
