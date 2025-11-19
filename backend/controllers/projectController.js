const Project = require('../models/Project');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    
    // Return empty array if no projects found (instead of mock data)
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
      return res.json({
        success: true,
        data: mockProjects,
        message: 'Mock projects returned (no projects in database)'
      });
    }

    res.json({
      success: true,
      data: projects,
      message: 'Projects fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false,
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

// Get project by reference number with customer data
exports.getProjectByReference = async (req, res) => {
  try {
    const { refNum } = req.params;
    console.log('Looking up project by reference number:', refNum);
    
    const projectData = await Project.findByReferenceWithCustomer(refNum);
    
    if (!projectData) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found with the given reference number' 
      });
    }
    
    res.json({
      success: true,
      data: {
        project_reference_num: projectData.Project_Ref_Number,
        customer_name: projectData.Customer_Name,
        customer_reference_number: projectData.Customer_Ref_Number,
        project_title: projectData.Project_Title,
        project_id: projectData.Project_ID
      }
    });
  } catch (error) {
    console.error('Error fetching project by reference:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch project by reference',
      message: error.message 
    });
  }
};

// Get branches by customer name
exports.getBranchesByCustomer = async (req, res) => {
  try {
    const { customerName } = req.params;
    console.log('Looking up branches for customer:', customerName);
    
    const branches = await Customer.findBranchesByCustomerName(customerName);
    
    res.json({
      success: true,
      data: branches || []
    });
  } catch (error) {
    console.error('Error fetching branches by customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branches',
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
    // NOTE: Customer table no longer has Project_ID in new database
    const customerIds = await Customer.createMultipleBranches(
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

// Update branches for a project
exports.updateProjectBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const { branches } = req.body;

    if (!branches || !Array.isArray(branches)) {
      return res.status(400).json({ error: 'Branches array is required' });
    }

    console.log(`Updating branches for project ${id}:`, branches);

    // Get existing inventory records to find current customers
    const existingInventory = await Inventory.findByProject(id);
    
    if (existingInventory.length === 0) {
      return res.status(404).json({ error: 'No inventory records found for this project' });
    }
    
    // Get customer info from existing inventory (all records should have same customer info)
    const customerRefNumber = existingInventory[0].Customer_Ref_Number;
    const customerName = existingInventory[0].Customer_Name;
    
    if (!customerRefNumber || !customerName) {
      return res.status(400).json({ error: 'Customer information not found in inventory records' });
    }
    
    console.log('Using customer info:', { customerRefNumber, customerName });
    
    const existingCustomerIds = [...new Set(existingInventory.map(inv => inv.Customer_ID))];
    
    // Get existing branches
    const existingBranches = [...new Set(existingInventory.map(inv => inv.Branch))];
    console.log('Existing branches:', existingBranches);
    console.log('New branches:', branches);

    // Find branches to add and remove
    const branchesToAdd = branches.filter(b => !existingBranches.includes(b));
    const branchesToKeep = branches.filter(b => existingBranches.includes(b));
    const branchesToRemove = existingBranches.filter(b => !branches.includes(b));

    console.log('Branches to add:', branchesToAdd);
    console.log('Branches to keep:', branchesToKeep);
    console.log('Branches to remove:', branchesToRemove);

    // Delete customers and inventory for removed branches
    for (const branch of branchesToRemove) {
      const inventoryToDelete = existingInventory.filter(inv => inv.Branch === branch);
      for (const inv of inventoryToDelete) {
        await Inventory.delete(inv.Inventory_ID);
        if (inv.Customer_ID) {
          await Customer.delete(inv.Customer_ID);
        }
        console.log(`Deleted inventory ${inv.Inventory_ID} and customer ${inv.Customer_ID} for branch: ${branch}`);
      }
    }

    // Add new branches
    if (branchesToAdd.length > 0) {
      // Create new customer records for new branches
      const newCustomerIds = await Customer.createMultipleBranches(
        customerRefNumber,
        customerName,
        branchesToAdd
      );
      console.log('Created new customer IDs:', newCustomerIds);

      // Create inventory records for new branches
      const newInventoryIds = await Inventory.createForProject(id, newCustomerIds);
      console.log('Created new inventory IDs:', newInventoryIds);
    }

    res.json({
      success: true,
      message: 'Branches updated successfully',
      added: branchesToAdd.length,
      removed: branchesToRemove.length,
      total: branches.length
    });
  } catch (error) {
    console.error('Error updating project branches:', error);
    res.status(500).json({ 
      error: 'Failed to update branches',
      message: error.message 
    });
  }
};