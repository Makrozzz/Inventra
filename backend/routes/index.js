const express = require('express');
const authRoutes = require('./auth');
const assetRoutes = require('./assets');
const projectRoutes = require('./projects');
const pmRoutes = require('./pm');
const inventoryRoutes = require('./inventory');
const categoryRoutes = require('./categories');
const peripheralRoutes = require('./peripherals');
const modelRoutes = require('./models');
const optionsRoutes = require('./options');

const router = express.Router();

// Route definitions
router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/projects', projectRoutes);
router.use('/pm', pmRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/categories', categoryRoutes);
router.use('/peripherals', peripheralRoutes);
router.use('/models', modelRoutes);
router.use('/options', optionsRoutes);

// Additional routes can be added here
// router.use('/reports', reportRoutes);

module.exports = router;