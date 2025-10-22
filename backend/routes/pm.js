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
  getDetailedPM
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

module.exports = router;
