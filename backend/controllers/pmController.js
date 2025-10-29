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
  createPM
};
