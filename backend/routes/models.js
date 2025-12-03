const express = require('express');
const router = express.Router();

const {
  getAllModels,
  getOrCreateModel,
  searchModels,
  createModel,
  updateModel,
  deleteModel,
  getModelSpecs
} = require('../controllers/modelController');

// Import middleware (if authentication is implemented)
// const { requireAuth } = require('../middleware/auth');

/**
 * @route   GET /api/v1/models
 * @desc    Get all models for dropdown/autocomplete
 * @access  Public (or Private if auth is implemented)
 */
router.get('/', getAllModels);

/**
 * @route   GET /api/v1/models/:id/specs
 * @desc    Get specifications for a specific model
 * @access  Public
 */
router.get('/:id/specs', getModelSpecs);

/**
 * @route   GET /api/v1/models/search
 * @desc    Search models by partial name match
 * @access  Public
 * @query   q - search term
 */
router.get('/search', searchModels);

/**
 * @route   POST /api/v1/models
 * @desc    Create a new model explicitly
 * @access  Private (if auth is implemented)
 */
router.post('/', createModel);

/**
 * @route   POST /api/v1/models/get-or-create
 * @desc    Get existing model or create new one (hybrid functionality)
 * @access  Private (if auth is implemented)
 */
router.post('/get-or-create', getOrCreateModel);

/**
 * @route   PUT /api/v1/models/:id
 * @desc    Update model by ID
 * @access  Private (if auth is implemented)
 */
router.put('/:id', updateModel);

/**
 * @route   DELETE /api/v1/models/:id
 * @desc    Delete model by ID
 * @access  Private (if auth is implemented)
 */
router.delete('/:id', deleteModel);

module.exports = router;