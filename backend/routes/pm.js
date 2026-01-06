const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {
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
  updateChecklistOrder,
  createCategory,
  getPMReport,
  getBlankPMReport,
  bulkDownloadPM,
  deletePM,
  uploadAcknowledgement,
  deleteAcknowledgement
} = require('../controllers/pmController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/', getAllPM);
router.get('/statistics', getPMStatistics);
router.get('/customers', getCustomers);
router.get('/customers/:customerId/branches', getBranchesByCustomer);
router.get('/filter', getPMByCustomerAndBranch);

// Get checklist by category name (for PM Import)
router.get('/checklist-by-name/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    console.log('Fetching checklist for category name:', categoryName);
    
    // First get the category ID from the category name
    const [categoryRows] = await pool.execute(
      'SELECT Category_ID FROM CATEGORY WHERE Category = ?',
      [categoryName]
    );
    
    if (categoryRows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const categoryId = categoryRows[0].Category_ID;
    
    // Then get the checklist items
    const [checklistItems] = await pool.execute(`
      SELECT 
        Checklist_ID,
        Category_ID,
        Check_item_Long,
        Display_Order
      FROM PM_CHECKLIST
      WHERE Category_ID = ?
      ORDER BY 
        CASE WHEN Display_Order IS NULL THEN 1 ELSE 0 END,
        Display_Order,
        Checklist_ID
    `, [categoryId]);
    
    console.log(`Found ${checklistItems.length} checklist items for category ${categoryName}`);
    res.json(checklistItems);
  } catch (error) {
    console.error('Error fetching checklist by category name:', error);
    res.status(500).json({ error: 'Failed to fetch checklist items', message: error.message });
  }
});

router.get('/checklist/:categoryId', getChecklistByCategory);
router.get('/all-checklist/:categoryId', getAllChecklistByCategory);
router.get('/results/:pmId', getResultsByPMId);
router.get('/detail/:pmId', getDetailedPM);
router.get('/asset/:assetId', getPMByAssetId);

// DEBUG: Check filename before download (MUST be before /:pmId/report)
router.get('/:pmId/report-debug', async (req, res) => {
  try {
    const pmId = parseInt(req.params.pmId);
    const PMaintenance = require('../models/PMaintenance');
    const pmData = await PMaintenance.getDetailedPM(pmId);
    
    if (!pmData) {
      return res.json({ error: 'PM not found' });
    }
    
    const sanitize = (text) => {
      if (!text) return 'UNKNOWN';
      return text.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase().substring(0, 50);
    };
    
    const customerName = sanitize(pmData.Customer_Name);
    const filename = `PM_Report_PM${pmData.PM_ID}_${customerName}_${pmData.Asset_Serial_Number}.pdf`;
    
    res.json({
      pmId: pmData.PM_ID,
      customerName: pmData.Customer_Name,
      sanitizedCustomer: customerName,
      serialNumber: pmData.Asset_Serial_Number,
      generatedFilename: filename,
      filenameLength: filename.length,
      hasProperExtension: filename.endsWith('.pdf')
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// PDF Report route
router.get('/:pmId/report', getPMReport);

// Blank PM Report route
router.get('/asset/:assetId/blank-report', getBlankPMReport);

// Get assets for bulk PM import
router.get('/assets', async (req, res) => {
  try {
    const { customer, branch, category } = req.query;
    
    if (!customer || !branch || !category) {
      return res.status(400).json({ error: 'Customer, branch, and category are required' });
    }
    
    console.log('Fetching assets for PM import:', { customer, branch, category });
    
    const [assets] = await pool.execute(
      `SELECT DISTINCT a.Asset_ID, a.Asset_Serial_Number, a.Item_Name, a.Asset_Tag_ID
       FROM ASSET a
       LEFT JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
       LEFT JOIN CUSTOMER c ON i.Customer_ID = c.Customer_ID
       LEFT JOIN CATEGORY cat ON a.Category_ID = cat.Category_ID
       WHERE c.Customer_Name = ? 
       AND c.Branch = ?
       AND cat.Category = ?
       ORDER BY a.Asset_Serial_Number`,
      [customer, branch, category]
    );
    
    console.log(`Found ${assets.length} assets`);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets for PM import:', error);
    res.status(500).json({ error: 'Failed to fetch assets', message: error.message });
  }
});

// Bulk download route
router.post('/bulk-download', bulkDownloadPM);

router.post('/', authenticateToken, createPM);
router.post('/:pmId/upload-acknowledgement', uploadAcknowledgement);
router.delete('/:pmId/delete-acknowledgement', deleteAcknowledgement);
router.delete('/:pmId', deletePM);

// Checklist Management Routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.post('/checklist', createChecklistItem);
router.put('/checklist/:checklistId', updateChecklistItem);
router.delete('/checklist/:checklistId', deleteChecklistItem);
router.put('/checklist-order', updateChecklistOrder);

// Bulk PM Import Route
// Setup multer for bulk PM import
const bulkPMStorage = multer.memoryStorage();
const bulkPMUpload = multer({
  storage: bulkPMStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
}).any();

router.post('/bulk-import', authenticateToken, bulkPMUpload, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.userId;
    const pmDataArray = JSON.parse(req.body.pmData);
    
    if (!pmDataArray || pmDataArray.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'No PM data provided' });
    }

    const uploadDir = path.join(__dirname, '../uploads/signed-pm-reports');
    
    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    let successCount = 0;
    const results = [];

    for (const pmEntry of pmDataArray) {
      try {
        // Insert into PMAINTENANCE
        const [pmResult] = await connection.execute(
          `INSERT INTO PMAINTENANCE (Asset_ID, PM_Date, Remarks, Status, Created_By)
           VALUES (?, ?, ?, 'In-Process', ?)`,
          [pmEntry.assetId, pmEntry.pmDate, pmEntry.remarks, userId]
        );

        const pmId = pmResult.insertId;

        // Handle file upload
        const fileField = `file_${pmEntry.assetId}`;
        const uploadedFile = req.files?.find(f => f.fieldname === fileField);
        
        let savedFileName = null;
        if (uploadedFile) {
          const timestamp = Date.now();
          const filename = `PM${pmId}_Acknowledgement_${pmEntry.serialNumber}_${timestamp}.pdf`;
          const filePath = path.join(uploadDir, filename);
          
          await fs.writeFile(filePath, uploadedFile.buffer);
          
          // Update PMAINTENANCE with file path
          const relativePath = `uploads/signed-pm-reports/${filename}`;
          await connection.execute(
            `UPDATE PMAINTENANCE SET file_path_acknowledgement = ? WHERE PM_ID = ?`,
            [relativePath, pmId]
          );
          savedFileName = filename;
        }

        // Insert PM_RESULT entries
        for (const checklistResult of pmEntry.checklistResults) {
          await connection.execute(
            `INSERT INTO PM_RESULT (PM_ID, Checklist_ID, Is_OK_bool, Remarks, Updated_By)
             VALUES (?, ?, ?, ?, ?)`,
            [
              pmId,
              checklistResult.checklistId,
              checklistResult.isOk,
              checklistResult.remarks,
              userId
            ]
          );
        }

        successCount++;
        results.push({
          assetId: pmEntry.assetId,
          pmId: pmId,
          serialNumber: pmEntry.serialNumber,
          fileName: savedFileName,
          success: true
        });

      } catch (error) {
        console.error(`Error processing asset ${pmEntry.assetId}:`, error);
        results.push({
          assetId: pmEntry.assetId,
          serialNumber: pmEntry.serialNumber,
          success: false,
          error: error.message
        });
      }
    }

    await connection.commit();
    
    res.json({
      message: 'Bulk PM import completed',
      successCount: successCount,
      totalCount: pmDataArray.length,
      results: results
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk PM import:', error);
    res.status(500).json({ 
      error: 'Failed to import PM data', 
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
