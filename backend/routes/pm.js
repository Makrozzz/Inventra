const express = require('express');
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
  deletePM
} = require('../controllers/pmController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/', getAllPM);
router.get('/statistics', getPMStatistics);
router.get('/customers', getCustomers);
router.get('/customers/:customerId/branches', getBranchesByCustomer);
router.get('/filter', getPMByCustomerAndBranch);
router.get('/checklist/:categoryId', getChecklistByCategory);
router.get('/all-checklist/:categoryId', getAllChecklistByCategory);
router.get('/results/:pmId', getResultsByPMId);
router.get('/detail/:pmId', getDetailedPM);
router.get('/asset/:assetId', getPMByAssetId);

// PDF Report route
router.get('/:pmId/report', getPMReport);

// DEBUG: Check filename before download
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

// Blank PM Report route
router.get('/asset/:assetId/blank-report', getBlankPMReport);

// Bulk download route
router.post('/bulk-download', bulkDownloadPM);

router.post('/', authenticateToken, createPM);
router.delete('/:pmId', deletePM);

// Checklist Management Routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.post('/checklist', createChecklistItem);
router.put('/checklist/:checklistId', updateChecklistItem);
router.delete('/checklist/:checklistId', deleteChecklistItem);
router.put('/checklist-order', updateChecklistOrder);

module.exports = router;
