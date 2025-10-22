const Asset = require('../models/Asset');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all assets with pagination and filtering
 */
const getAllAssets = async (req, res, next) => {
  try {
    const assets = await Asset.findAll();

    // Return assets directly as JSON array for frontend compatibility
    res.status(200).json(assets);
  } catch (error) {
    logger.error('Error in getAllAssets:', error);
    console.error('Error fetching assets:', error);
    
    // Return mock data if database query fails
    const mockAssets = [
      {
        Asset_ID: 1,
        Asset_Serial_Number: 'MOCK-001',
        Asset_Tag_ID: 'TAG-001',
        Item_Name: 'Mock Desktop PC',
        Status: 'Active',
        Category: 'Desktop',
        Model: 'OptiPlex Mock',
        Recipient_Name: 'Test User',
        Department: 'IT Department'
      }
    ];
    
    res.status(200).json(mockAssets);
  }
};

/**
 * Get single asset by serial number
 */
const getAssetBySerialNumber = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    
    // For now, we'll search through all assets to find by serial number
    // In a production app, you'd want a dedicated method for this
    const allAssets = await Asset.findAll();
    const asset = allAssets.find(a => a.Asset_Serial_Number === serialNumber);

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    logger.error('Error in getAssetBySerialNumber:', error);
    res.status(500).json({
      error: 'Failed to fetch asset',
      message: error.message
    });
  }
};

/**
 * Get complete asset detail by ID (includes project, customer, peripherals)
 */
const getAssetDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const assetDetail = await Asset.findDetailById(id);

    if (!assetDetail) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }

    res.status(200).json(assetDetail);
  } catch (error) {
    logger.error('Error in getAssetDetail:', error);
    res.status(500).json({
      error: 'Failed to fetch asset detail',
      message: error.message
    });
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
    const Project = require('../models/Project');
    
    const statistics = await Asset.getStatistics();
    const projectStats = await Project.getStatistics();
    
    // Add project count as total customers (1 project = 1 customer)
    statistics.totalProjects = projectStats.total;

    res.status(200).json(
      formatResponse(true, statistics, 'Asset statistics retrieved successfully')
    );
  } catch (error) {
    logger.error('Error in getAssetStatistics:', error);
    
    // If database error, return mock statistics
    if (error.message.includes('Access denied') || error.message.includes('ENOTFOUND')) {
      logger.warn('Database not available, returning mock statistics');
      const mockStats = {
        total: 1,
        totalProjects: 0,
        byStatus: [{ status: 'Testing', count: 1 }],
        byCategory: [{ category: 'Mock', count: 1 }],
        recent: [{
          serialNumber: 'MOCK-001',
          assetModelName: 'Mock Asset',
          assetStatus: 'Testing',
          assetCategory: 'Mock',
          assetLocation: 'Development'
        }]
      };
      
      res.status(200).json(
        formatResponse(true, mockStats, 'Mock statistics returned (database not available)')
      );
      return;
    }
    
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
  getAssetDetail,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStatistics,
  bulkImportAssets
};