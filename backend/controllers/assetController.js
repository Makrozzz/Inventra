const Asset = require('../models/Asset');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all assets with pagination and filtering
 */
const getAllAssets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search
    };

    const result = await Asset.findAll(page, limit, filters);

    res.status(200).json(
      formatResponse(true, result.assets, 'Assets retrieved successfully', {
        pagination: result.pagination,
        filters: filters
      })
    );
  } catch (error) {
    logger.error('Error in getAllAssets:', error);
    next(error);
  }
};

/**
 * Get single asset by serial number
 */
const getAssetBySerialNumber = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    const asset = await Asset.findBySerialNumber(serialNumber);

    if (!asset) {
      return res.status(404).json(
        formatResponse(false, null, 'Asset not found')
      );
    }

    res.status(200).json(
      formatResponse(true, asset, 'Asset retrieved successfully')
    );
  } catch (error) {
    logger.error('Error in getAssetBySerialNumber:', error);
    next(error);
  }
};

/**
 * Create new asset
 */
const createAsset = async (req, res, next) => {
  try {
    const assetData = req.body;

    // Check if asset with same serial number already exists
    const existingAsset = await Asset.findBySerialNumber(assetData.serialNumber);
    if (existingAsset) {
      return res.status(400).json(
        formatResponse(false, null, 'Asset with this serial number already exists')
      );
    }

    const assetId = await Asset.create(assetData);
    const newAsset = await Asset.findBySerialNumber(assetData.serialNumber);

    logger.info(`Asset created: ${assetData.serialNumber} by user ${req.user?.userId}`);

    res.status(201).json(
      formatResponse(true, newAsset, 'Asset created successfully')
    );
  } catch (error) {
    logger.error('Error in createAsset:', error);
    next(error);
  }
};

/**
 * Update asset
 */
const updateAsset = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    const updateData = req.body;

    // Check if asset exists
    const existingAsset = await Asset.findBySerialNumber(serialNumber);
    if (!existingAsset) {
      return res.status(404).json(
        formatResponse(false, null, 'Asset not found')
      );
    }

    const success = await Asset.update(serialNumber, updateData);
    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to update asset')
      );
    }

    const updatedAsset = await Asset.findBySerialNumber(serialNumber);

    logger.info(`Asset updated: ${serialNumber} by user ${req.user?.userId}`);

    res.status(200).json(
      formatResponse(true, updatedAsset, 'Asset updated successfully')
    );
  } catch (error) {
    logger.error('Error in updateAsset:', error);
    next(error);
  }
};

/**
 * Delete asset
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;

    // Check if asset exists
    const existingAsset = await Asset.findBySerialNumber(serialNumber);
    if (!existingAsset) {
      return res.status(404).json(
        formatResponse(false, null, 'Asset not found')
      );
    }

    const success = await Asset.delete(serialNumber);
    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to delete asset')
      );
    }

    logger.info(`Asset deleted: ${serialNumber} by user ${req.user?.userId}`);

    res.status(200).json(
      formatResponse(true, null, 'Asset deleted successfully')
    );
  } catch (error) {
    logger.error('Error in deleteAsset:', error);
    next(error);
  }
};

/**
 * Get asset statistics for dashboard
 */
const getAssetStatistics = async (req, res, next) => {
  try {
    const statistics = await Asset.getStatistics();

    res.status(200).json(
      formatResponse(true, statistics, 'Asset statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Error in getAssetStatistics:', error);
    next(error);
  }
};

/**
 * Bulk import assets
 */
const bulkImportAssets = async (req, res, next) => {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json(
        formatResponse(false, null, 'Assets array is required')
      );
    }

    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const assetData of assets) {
      try {
        // Check if asset already exists
        const existing = await Asset.findBySerialNumber(assetData.serialNumber);
        if (existing) {
          results.failed++;
          results.errors.push({
            serialNumber: assetData.serialNumber,
            error: 'Asset already exists'
          });
          continue;
        }

        await Asset.create(assetData);
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          serialNumber: assetData.serialNumber,
          error: error.message
        });
      }
    }

    logger.info(`Bulk import completed: ${results.created} created, ${results.failed} failed`);

    res.status(200).json(
      formatResponse(true, results, 'Bulk import completed')
    );
  } catch (error) {
    logger.error('Error in bulkImportAssets:', error);
    next(error);
  }
};

module.exports = {
  getAllAssets,
  getAssetBySerialNumber,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStatistics,
  bulkImportAssets
};