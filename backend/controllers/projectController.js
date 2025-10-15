const Project = require('../models/Project');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    
    // If no projects found, return mock data for development
    if (!projects || projects.length === 0) {
      const mockProjects = [
        {
          Project_ID: 1,
          Project_Ref_Number: "PRJ-2024-001",
          Project_Title: "Office Digital Transformation",
          Solution_Principal: "John Smith",
          Warranty: "2 Years Extended",
          Preventive_Maintenance: "Quarterly Service",
          Start_Date: "2024-01-15",
          End_Date: "2024-12-31"
        },
        {
          Project_ID: 2,
          Project_Ref_Number: "PRJ-2024-002",
          Project_Title: "IT Infrastructure Upgrade",
          Solution_Principal: "Sarah Johnson",
          Warranty: "1 Year Standard",
          Preventive_Maintenance: "Monthly Checkup",
          Start_Date: "2024-03-01",
          End_Date: "2025-02-28"
        },
        {
          Project_ID: 3,
          Project_Ref_Number: "PRJ-2024-003",
          Project_Title: "Security System Implementation",
          Solution_Principal: "Mike Wilson",
          Warranty: "3 Years Premium",
          Preventive_Maintenance: "Bi-weekly Monitoring",
          Start_Date: "2024-06-01",
          End_Date: "2024-11-30"
        }
      ];
      
      console.log('No projects found in database, returning mock data');
      return res.json(mockProjects);
    }

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch projects',
      message: error.message 
    });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project',
      message: error.message 
    });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validate required fields
    const requiredFields = ['Project_Title'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return res.status(400).json({ 
          error: `${field} is required` 
        });
      }
    }
    
    const newProject = await Project.create(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      message: error.message 
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project properties
    Object.keys(updates).forEach(key => {
      if (project.hasOwnProperty(key)) {
        project[key] = updates[key];
      }
    });
    
    await project.update();
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      message: error.message 
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Project.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      error: 'Failed to delete project',
      message: error.message 
    });
  }
};

// Get project statistics
exports.getProjectStatistics = async (req, res) => {
  try {
    const stats = await Project.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    
    // Return fallback statistics
    res.json({
      total: 0,
      active: 0,
      inactive: 0
    });
  }
};