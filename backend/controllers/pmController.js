const PMaintenance = require('../models/PMaintenance');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const pdfGenerator = require('../utils/pdfGenerator');
const path = require('path');

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

    // Get user ID from authenticated user (from JWT token)
    const createdBy = req.user.userId;

    // Create PM with results
    const pmId = await PMaintenance.createWithResults(
      assetId, 
      pmDate, 
      remarks || null, 
      checklistResults,
      status || 'In-Process',
      createdBy
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
    const { categoryId, checkItem, checkItemLong } = req.body;

    if (!categoryId || !checkItem) {
      return res.status(400).json({
        error: 'Category ID and check item are required'
      });
    }

    const checklistId = await PMaintenance.createChecklistItem(categoryId, checkItem, checkItemLong);

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
    const { checkItem, checkItemLong } = req.body;

    if (!checkItem) {
      return res.status(400).json({
        error: 'Check item is required'
      });
    }

    const success = await PMaintenance.updateChecklistItem(checklistId, checkItem, checkItemLong);

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

/**
 * Generate and download PM report PDF
 */
const getPMReport = async (req, res, next) => {
  try {
    const { pmId } = req.params;

    // Check if PM exists
    const pmDetail = await PMaintenance.getDetailedPM(pmId);
    if (!pmDetail) {
      return res.status(404).json({
        error: 'PM record not found'
      });
    }

    // Check if PDF already exists
    const pdfCheck = await pdfGenerator.checkPDFExists(pmId);
    
    let filepath;
    let filename;

    if (pdfCheck.exists) {
      // PDF exists, use existing file
      filepath = pdfCheck.filepath;
      filename = path.basename(filepath);
      logger.info(`✅ Using existing PDF for PM_ID ${pmId}: ${filename}`);
    } else {
      // Generate new PDF (either doesn't exist or file missing locally)
      logger.info(`⚙️ Generating new PDF for PM_ID ${pmId}`);
      const result = await pdfGenerator.generatePMReport(pmId);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to generate PDF report',
          message: result.error
        });
      }

      filepath = result.filepath;
      filename = result.filename;
      
      // Update database with new file path
      await pdfGenerator.updateFilePath(pmId, filepath);
      
      logger.info(`✅ PDF generated successfully: ${filename}`);
    }

    // Convert relative path to absolute path for res.download()
    const absolutePath = path.join(__dirname, '../', filepath);

    // Send file for download
    res.download(absolutePath, filename, (err) => {
      if (err) {
        logger.error('❌ Error sending PDF file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download PDF',
            message: err.message
          });
        }
      } else {
        logger.info(`📥 PDF downloaded successfully: ${filename}`);
      }
    });

  } catch (error) {
    logger.error('Error in getPMReport:', error);
    res.status(500).json({
      error: 'Failed to retrieve PM report',
      message: error.message
    });
  }
};

/**
 * Bulk download PM reports as single PDF
 */
const bulkDownloadPM = async (req, res, next) => {
  try {
    const { pmIds } = req.body;

    if (!pmIds || !Array.isArray(pmIds) || pmIds.length === 0) {
      logger.error('Invalid pmIds in bulk download request');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'pmIds array is required and must not be empty'
      });
    }

    logger.info(`📦 Bulk download requested for ${pmIds.length} PM records: ${pmIds.join(', ')}`);

    // Fetch all PM records with details
    const pmRecordsPromises = pmIds.map(pmId => PMaintenance.getDetailedPM(pmId));
    const pmRecords = await Promise.all(pmRecordsPromises);

    // Filter out any null results (in case some PM IDs don't exist)
    const validPMRecords = pmRecords.filter(record => record !== null);

    if (validPMRecords.length === 0) {
      logger.error('No valid PM records found for provided IDs');
      return res.status(404).json({
        error: 'No valid PM records found',
        message: 'None of the provided PM IDs exist'
      });
    }

    logger.info(`✅ Found ${validPMRecords.length} valid PM records out of ${pmIds.length} requested`);

    // Generate combined PDF using pdfGenerator
    logger.info('Starting bulk PDF generation...');
    const result = await pdfGenerator.generateBulkPM(validPMRecords);
    
    if (!result || !result.success || !result.absolutePath) {
      logger.error('PDF generation failed:', result?.error);
      throw new Error(result?.error || 'Failed to generate bulk PDF');
    }

    const absolutePath = result.absolutePath; // Use absolutePath directly from generator
    const filename = result.filename;

    logger.info(`✅ Bulk PDF generated successfully: ${filename}`);

    // Send file for download and delete after sending
    res.download(absolutePath, filename, (err) => {
      if (err) {
        logger.error('❌ Error sending bulk PDF file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download bulk PDF',
            message: err.message
          });
        }
      } else {
        logger.info(`📥 Bulk PDF downloaded successfully: ${filename}`);
        
        // Delete bulk PDF file after successful download
        const fs = require('fs').promises;
        fs.unlink(absolutePath)
          .then(() => logger.info(`🗑️  Cleaned up bulk PDF: ${filename}`))
          .catch(unlinkErr => logger.error('Error deleting bulk PDF:', unlinkErr));
      }
    });

  } catch (error) {
    logger.error('Error in bulkDownloadPM:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate bulk PM report',
        message: error.message
      });
    }
  }
};

/**
 * Delete a PM record and all related PM_RESULT entries
 */
const deletePM = async (req, res, next) => {
  try {
    const { pmId } = req.params;
    
    if (!pmId) {
      return res.status(400).json({
        error: 'PM ID is required'
      });
    }
    
    const deleted = await PMaintenance.deletePM(pmId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'PM record not found'
      });
    }
    
    logger.info(`PM record deleted: PM_ID ${pmId}`);
    res.status(200).json({
      success: true,
      message: 'PM record deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deletePM:', error);
    res.status(500).json({
      error: 'Failed to delete PM record',
      message: error.message
    });
  }
};

/**
 * Update checklist items order
 */
const updateChecklistOrder = async (req, res, next) => {
  try {
    const { orderUpdates } = req.body;

    // Validate input
    if (!Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderUpdates must be a non-empty array'
      });
    }

    // Validate each update has required fields
    for (const update of orderUpdates) {
      if (!update.Checklist_ID || update.Display_Order === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each update must have Checklist_ID and Display_Order'
        });
      }
    }

    await PMaintenance.updateChecklistOrder(orderUpdates);

    logger.info(`Checklist order updated: ${orderUpdates.length} items`);
    res.status(200).json({
      success: true,
      message: 'Checklist order updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateChecklistOrder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update checklist order',
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
  deletePM,
  getAllCategories,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  updateChecklistOrder,
  createCategory,
  getPMReport,
  bulkDownloadPM
};
