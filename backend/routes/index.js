const express = require('express');
const router = express.Router();

// Import route modules
const assetRoutes = require('./assets');
const projectRoutes = require('./projects');
const inventoryRoutes = require('./inventory');
const categoryRoutes = require('./categories');
const modelRoutes = require('./models');
const peripheralRoutes = require('./peripherals');
const pmRoutes = require('./pm');
const authRoutes = require('./auth');
const registerRoutes = require('./register');
const profileRoutes = require('./profile');
const optionsRoutes = require('./options');
const recipientRoutes = require('./recipients');

// Mount routes
router.use('/assets', assetRoutes);
router.use('/projects', projectRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/categories', categoryRoutes);
router.use('/models', modelRoutes);
router.use('/peripherals', peripheralRoutes);
router.use('/pm', pmRoutes);
router.use('/auth', authRoutes);
router.use('/register', registerRoutes);
router.use('/profile', profileRoutes);
router.use('/options', optionsRoutes);
router.use('/recipients', recipientRoutes);

module.exports = router;
