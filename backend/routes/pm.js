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
  createCategory
} = require('../controllers/pmController');

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
router.post('/', createPM);

// Checklist management routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.post('/checklist', createChecklistItem);
router.put('/checklist/:checklistId', updateChecklistItem);
router.delete('/checklist/:checklistId', deleteChecklistItem);

module.exports = router;
