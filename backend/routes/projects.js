const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// GET /api/projects - Get all projects
router.get('/', projectController.getAllProjects);

// GET /api/projects/statistics - Get project statistics
router.get('/statistics', projectController.getProjectStatistics);

// GET /api/projects/reference/:refNum - Get project by reference number
router.get('/reference/:refNum', projectController.getProjectByReference);

// GET /api/projects/branches/:customerName - Get branches by customer name
router.get('/branches/:customerName', projectController.getBranchesByCustomer);

// GET /api/projects/:id - Get project by ID
router.get('/:id', projectController.getProjectById);

// POST /api/projects - Create new project
router.post('/', projectController.createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', projectController.updateProject);

// PUT /api/projects/:id/branches - Update project branches
router.put('/:id/branches', projectController.updateProjectBranches);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', projectController.deleteProject);

module.exports = router;