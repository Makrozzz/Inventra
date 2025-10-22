const Project = require('../models/Project');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

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
          Customer_Name: "Tech Solutions Inc.",
          Customer_Ref_Number: "CUST-001",
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
          Customer_Name: "Global Systems Ltd.",
          Customer_Ref_Number: "CUST-002",
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
          Customer_Name: "SecureNet Corp.",
          Customer_Ref_Number: "CUST-003",
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
    const { project, customer } = req.body;
    
    // Validate required fields
    const requiredProjectFields = ['Project_Title'];
    for (const field of requiredProjectFields) {
      if (!project || !project[field]) {
        return res.status(400).json({ 
          error: `${field} is required` 
        });
      }
    }

    // Validate customer fields
    if (!customer || !customer.Customer_Ref_Number || !customer.Customer_Name) {
      return res.status(400).json({ 
        error: 'Customer information (Customer_Ref_Number and Customer_Name) is required' 
      });
    }

    // Validate branches
    if (!customer.branches || !Array.isArray(customer.branches) || customer.branches.length === 0) {
      return res.status(400).json({ 
        error: 'At least one branch is required' 
      });
    }

    console.log('Creating project with customer data:', { project, customer });

    // Step 1: Create the project
    const newProject = await Project.create(project);
    console.log('Project created:', newProject);

    // Step 2: Create customer records (one for each branch)
    const customerIds = await Customer.createMultipleBranches(
      newProject.Project_ID,
      customer.Customer_Ref_Number,
      customer.Customer_Name,
      customer.branches
    );
    console.log('Customer records created with IDs:', customerIds);

    // Step 3: Create INVENTORY records linking project to customers
    // Asset_ID will be NULL initially, filled when assets are added
    const inventoryIds = await Inventory.createForProject(
      newProject.Project_ID,
      customerIds
    );
    console.log('Inventory records created with IDs:', inventoryIds);

    // Return success with project, customer, and inventory info
    res.status(201).json({
      success: true,
      project: newProject,
      customer: {
        Customer_Ref_Number: customer.Customer_Ref_Number,
        Customer_Name: customer.Customer_Name,
        branches: customer.branches,
        customerIds: customerIds
      },
      inventory: {
        inventoryIds: inventoryIds,
        count: inventoryIds.length
      },
      message: `Project created successfully with ${customerIds.length} customer branch(es) and ${inventoryIds.length} inventory record(s)`
    });
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
    
    console.log(`Attempting to delete project with ID: ${id}`);
    
    // Step 1: Get all inventory records for this project to find related customers
    const inventoryRecords = await Inventory.findByProject(id);
    console.log(`Found ${inventoryRecords.length} inventory records for project ${id}`);
    
    // Step 2: Delete all inventory records for this project
    for (const inv of inventoryRecords) {
      await Inventory.delete(inv.Inventory_ID);
      console.log(`Deleted inventory record: ${inv.Inventory_ID}`);
    }
    
    // Step 3: Delete all customer records associated with this project
    // Get unique customer IDs from inventory
    const customerIds = [...new Set(inventoryRecords.map(inv => inv.Customer_ID))];
    console.log(`Found ${customerIds.length} unique customers to delete`);
    
    for (const customerId of customerIds) {
      if (customerId) {
        await Customer.delete(customerId);
        console.log(`Deleted customer record: ${customerId}`);
      }
    }
    
    // Step 4: Finally, delete the project
    const deleted = await Project.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log(`Successfully deleted project ${id} and all related records`);
    
    res.json({ 
      message: 'Project and all related records deleted successfully',
      deletedInventory: inventoryRecords.length,
      deletedCustomers: customerIds.length
    });
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