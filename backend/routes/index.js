const express = require('express');
const authRoutes = require('./auth');
const assetRoutes = require('./assets');

const router = express.Router();

// Route definitions
router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);

// Additional routes can be added here
// router.use('/projects', projectRoutes);
// router.use('/maintenance', maintenanceRoutes);
// router.use('/reports', reportRoutes);

module.exports = router;