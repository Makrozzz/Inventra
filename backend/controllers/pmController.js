const PMaintenance = require('../models/PMaintenance');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all PM records
 */
const getAllPM = async (req, res, next) => {
  try {
    const pmRecords = await PMaintenance.findAll();
    res.status(200).json(pmRecords);
  } catch (error) {
    logger.error('Error in getAllPM:', error);
    res.status(500).json({
      error: 'Failed to fetch PM records',
      message: error.message
    });
  }
};

/**
 * Get PM statistics
 */
const getPMStatistics = async (req, res, next) => {
  try {
    const statistics = await PMaintenance.getStatistics();
    res.status(200).json(formatResponse(true, statistics, 'PM statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error in getPMStatistics:', error);
    res.status(500).json({
      error: 'Failed to fetch PM statistics',
      message: error.message
    });
  }
};

/**
 * Get unique customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const customers = await PMaintenance.getCustomers();
    res.status(200).json(customers);
  } catch (error) {
    logger.error('Error in getCustomers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
};

/**
 * Get branches by customer
 */
const getBranchesByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const branches = await PMaintenance.getBranchesByCustomer(customerId);
    res.status(200).json(branches);
  } catch (error) {
    logger.error('Error in getBranchesByCustomer:', error);
    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error.message
    });
  }
};

/**
 * Get PM records filtered by customer and branch
 */
const getPMByCustomerAndBranch = async (req, res, next) => {
  try {
    const { customerId, branch } = req.query;

    if (!customerId || !branch) {
      return res.status(400).json({
        error: 'Customer ID and Branch are required'
      });
    }

    const pmRecords = await PMaintenance.getPMWithChecklistByCustomerAndBranch(customerId, branch);
    res.status(200).json(pmRecords);
  } catch (error) {
    logger.error('Error in getPMByCustomerAndBranch:', error);
    res.status(500).json({
      error: 'Failed to fetch PM records',
      message: error.message
    });
  }
};

/**
 * Get all checklist items by category
 */
const getAllChecklistByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const checklist = await PMaintenance.getAllChecklistItemsByCategory(categoryId);
    res.status(200).json(checklist);
  } catch (error) {
    logger.error('Error in getAllChecklistByCategory:', error);
    res.status(500).json({
      error: 'Failed to fetch checklist items',
      message: error.message
    });
  }
};

/**
 * Get checklist by category
 */
const getChecklistByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const checklist = await PMaintenance.getChecklistByCategory(categoryId);
    res.status(200).json(checklist);
  } catch (error) {
    logger.error('Error in getChecklistByCategory:', error);
    res.status(500).json({
      error: 'Failed to fetch checklist',
      message: error.message
    });
  }
};

/**
 * Get PM results by PM ID
 */
const getResultsByPMId = async (req, res, next) => {
  try {
    const { pmId } = req.params;
    const results = await PMaintenance.getResultsByPMId(pmId);
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in getResultsByPMId:', error);
    res.status(500).json({
      error: 'Failed to fetch PM results',
      message: error.message
    });
  }
};

/**
 * Get detailed PM with checklist results
 */
const getDetailedPM = async (req, res, next) => {
  try {
    const { pmId } = req.params;
    const pmDetail = await PMaintenance.getDetailedPM(pmId);

    if (!pmDetail) {
      return res.status(404).json({
        error: 'PM record not found'
      });
    }

    res.status(200).json(pmDetail);
  } catch (error) {
    logger.error('Error in getDetailedPM:', error);
    res.status(500).json({
      error: 'Failed to fetch PM details',
      message: error.message
    });
  }
};

/**
 * Get PM records by asset ID
 */
const getPMByAssetId = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const pmRecords = await PMaintenance.findByAssetId(assetId);
    res.status(200).json(pmRecords);
  } catch (error) {
    logger.error('Error in getPMByAssetId:', error);
    res.status(500).json({
      error: 'Failed to fetch PM records for asset',
      message: error.message
    });
  }
};

/**
 * Create new PM record with checklist results
 */
const createPM = async (req, res, next) => {
  try {
    const { assetId, pmDate, remarks, checklistResults, status } = req.body;

    // Validate required fields
    if (!assetId || !pmDate || !checklistResults || !Array.isArray(checklistResults)) {
      return res.status(400).json({
        error: 'Asset ID, PM Date, and checklist results are required'
      });
    }

    // Create PM with results
    const pmId = await PMaintenance.createWithResults(
      assetId, 
      pmDate, 
      remarks || null, 
      checklistResults,
      status || 'In-Process'
    );

    res.status(201).json({
      success: true,
      message: 'PM record created successfully',
      data: { pmId }
    });
  } catch (error) {
    logger.error('Error in createPM:', error);
    res.status(500).json({
      error: 'Failed to create PM record',
      message: error.message
    });
  }
};

/**
 * Get all categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await PMaintenance.getAllCategories();
    res.json(categories);
  } catch (error) {
    logger.error('Error in getAllCategories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
};

/**
 * Create new checklist item
 */
const createChecklistItem = async (req, res, next) => {
  try {
    const { categoryId, checkItem } = req.body;

    if (!categoryId || !checkItem) {
      return res.status(400).json({
        error: 'Category ID and check item are required'
      });
    }

    const checklistId = await PMaintenance.createChecklistItem(categoryId, checkItem);

    res.status(201).json({
      success: true,
      message: 'Checklist item created successfully',
      data: { checklistId }
    });
  } catch (error) {
    logger.error('Error in createChecklistItem:', error);
    res.status(500).json({
      error: 'Failed to create checklist item',
      message: error.message
    });
  }
};

/**
 * Update checklist item
 */
const updateChecklistItem = async (req, res, next) => {
  try {
    const { checklistId } = req.params;
    const { checkItem } = req.body;

    if (!checkItem) {
      return res.status(400).json({
        error: 'Check item is required'
      });
    }

    const success = await PMaintenance.updateChecklistItem(checklistId, checkItem);

    if (!success) {
      return res.status(404).json({
        error: 'Checklist item not found'
      });
    }

    res.json({
      success: true,
      message: 'Checklist item updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateChecklistItem:', error);
    res.status(500).json({
      error: 'Failed to update checklist item',
      message: error.message
    });
  }
};

/**
 * Delete checklist item
 */
const deleteChecklistItem = async (req, res, next) => {
  try {
    const { checklistId } = req.params;

    const success = await PMaintenance.deleteChecklistItem(checklistId);

    if (!success) {
      return res.status(404).json({
        error: 'Checklist item not found'
      });
    }

    res.json({
      success: true,
      message: 'Checklist item deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteChecklistItem:', error);
    
    // If error message indicates item is in use, return 409 Conflict
    if (error.message.includes('Cannot delete checklist item')) {
      return res.status(409).json({
        error: error.message,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to delete checklist item',
      message: error.message
    });
  }
};

/**
 * Create new category
 */
const createCategory = async (req, res, next) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).json({
        error: 'Category name is required'
      });
    }

    const categoryId = await PMaintenance.createCategory(categoryName);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { categoryId }
    });
  } catch (error) {
    logger.error('Error in createCategory:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: error.message
    });
  }
};

module.exports = {
  getAllPM,
  getPMStatistics,
  getCustomers,
  getBranchesByCustomer,
  getPMByCustomerAndBranch,
  getChecklistByCategory,
  getAllChecklistByCategory,
  getResultsByPMId,
  getDetailedPM,
  getPMByAssetId,
  createPM,
  getAllCategories,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createCategory
};
