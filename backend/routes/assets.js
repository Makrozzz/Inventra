const express = require('express');
const { body } = require('express-validator');
const {
  getAllAssets,
  getAssetById,
  getAssetBySerialNumber,
  getAssetDetail,
  createAsset,
  updateAsset,
  updateAssetById,
  deleteAsset,
  getAssetStatistics,
  bulkImportAssets
} = require('../controllers/assetController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const assetValidationRules = [
  body('serialNumber')
    .notEmpty()
    .withMessage('Serial number is required')
    .isLength({ max: 100 })
    .withMessage('Serial number must be less than 100 characters'),
  body('assetModelName')
    .notEmpty()
    .withMessage('Asset model name is required')
    .isLength({ max: 255 })
    .withMessage('Asset model name must be less than 255 characters'),
  body('assetManufacturer')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Manufacturer must be less than 255 characters'),
  body('assetStatus')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Retired', 'Lost', 'Damaged'])
    .withMessage('Invalid asset status'),
  body('purchasePrice')
    .optional()
    .isNumeric()
    .withMessage('Purchase price must be a number'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid purchase date format'),
  body('warrantyDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid warranty date format')
];

const updateAssetValidationRules = [
  body('assetModelName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Asset model name must be less than 255 characters'),
  body('assetManufacturer')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Manufacturer must be less than 255 characters'),
  body('assetStatus')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Retired', 'Lost', 'Damaged'])
    .withMessage('Invalid asset status'),
  body('purchasePrice')
    .optional()
    .isNumeric()
    .withMessage('Purchase price must be a number'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid purchase date format'),
  body('warrantyDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid warranty date format')
];

// Routes
router.get('/', getAllAssets);
router.get('/statistics', getAssetStatistics);
router.get('/detail/:id', getAssetDetail);
router.get('/id/:id', getAssetById); // Get asset by ID
router.get('/:serialNumber', getAssetBySerialNumber);

// Protected routes (require authentication)
router.post('/', 
  authenticateToken, 
  assetValidationRules, 
  handleValidationErrors, 
  createAsset
);

router.put('/id/:id', 
  // authenticateToken,  // Disabled for mock mode
  updateAssetValidationRules, 
  handleValidationErrors, 
  updateAssetById
);

router.put('/:serialNumber', 
  authenticateToken, 
  updateAssetValidationRules, 
  handleValidationErrors, 
  updateAsset
);

router.delete('/:serialNumber', 
  authenticateToken, 
  authorize('admin', 'manager'), 
  deleteAsset
);

router.post('/bulk-import', 
  authenticateToken, 
  authorize('admin', 'manager'),
  body('assets').isArray().withMessage('Assets must be an array'),
  handleValidationErrors,
  bulkImportAssets
);

module.exports = router;