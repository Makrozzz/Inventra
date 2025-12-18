const Project = require('../models/Project');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const { logProjectChange, detectChanges } = require('../utils/auditLogger');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    
    res.json({
      success: true,
      data: projects || [],
      message: projects && projects.length > 0 ? 'Projects fetched successfully' : 'No projects found'
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

// Get solution principals for a project
exports.getProjectSolutionPrincipals = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/database');
    
    const [rows] = await pool.execute(`
      SELECT sp.SP_ID, sp.SP_Name, psb.\`Support Type\`
      FROM PROJECT_SP_BRIDGE psb
      JOIN SOLUTION_PRINCIPAL sp ON psb.SP_ID = sp.SP_ID
      WHERE psb.Project_ID = ?
    `, [id]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching project solution principals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch solution principals',
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
        project_id: projectData.Project_ID,
        antivirus: projectData.Antivirus
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

// Get branches by customer reference number
exports.getBranchesByCustomerRef = async (req, res) => {
  try {
    const { customerRefNumber } = req.params;
    console.log('Looking up branches for customer ref:', customerRefNumber);
    
    const branches = await Customer.findBranchesByCustomerRef(customerRefNumber);
    
    res.json({
      success: true,
      data: branches || []
    });
  } catch (error) {
    console.error('Error fetching branches by customer ref:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branches for customer reference',
      message: error.message 
    });
  }
};

// Get branches for a specific project by project reference number
exports.getBranchesByProjectRef = async (req, res) => {
  try {
    const { projectRefNumber } = req.params;
    console.log('Looking up branches for project:', projectRefNumber);
    
    const branches = await Customer.findBranchesByProjectRef(projectRefNumber);
    
    res.json({
      success: true,
      data: branches || []
    });
  } catch (error) {
    console.error('Error fetching branches by project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branches for project',
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

    // Step 4: Log the creation in audit log
    const userId = req.user?.User_ID || req.user?.userId || 1; // Get from auth token
    const username = req.user?.Username || req.user?.username || 'System';
    await logProjectChange(
      userId,
      newProject.Project_ID,
      'INSERT',
      `${username} created new Project for ${customer.Customer_Name}`,
      []
    );

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
    
    console.log('🔄 UPDATE PROJECT - ID:', id);
    console.log('📝 Updates received:', updates);
    
    // Get current project data for comparison
    const projectData = await Project.findById(id);
    if (!projectData) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('📋 Current project data:', projectData);
    
    // Store old values for audit logging
    const oldData = { ...projectData };
    
    // Create a Project instance with updated data
    const project = new Project({
      Project_ID: id,
      Project_Ref_Number: updates.Project_Ref_Number || projectData.Project_Ref_Number,
      Project_Title: updates.Project_Title || projectData.Project_Title,
      Warranty: updates.Warranty !== undefined ? updates.Warranty : projectData.Warranty,
      Preventive_Maintenance: updates.Preventive_Maintenance !== undefined ? updates.Preventive_Maintenance : projectData.Preventive_Maintenance,
      Start_Date: updates.Start_Date !== undefined ? updates.Start_Date : projectData.Start_Date,
      End_Date: updates.End_Date !== undefined ? updates.End_Date : projectData.End_Date,
      Antivirus: updates.Antivirus !== undefined ? updates.Antivirus : projectData.Antivirus
    });
    
    await project.update();
    
    console.log('✅ Project updated in database');
    
    // Detect changes for audit log
    const changes = detectChanges(oldData, project);
    
    console.log('🔍 Detected changes:', changes);
    
    // Log the update if there are changes
    if (changes.length > 0) {
      const userId = req.user?.User_ID || req.user?.userId || 1;
      const username = req.user?.Username || req.user?.username || 'System';
      
      console.log('👤 User info - ID:', userId, 'Username:', username);
      
      // Get customer name for this project
      const inventoryRecords = await Inventory.findByProject(id);
      const customerName = inventoryRecords.length > 0 ? inventoryRecords[0].Customer_Name : 'Unknown';
      
      console.log('🏢 Customer name:', customerName);
      
      // Create description for each change
      const descriptions = changes.map(change => 
        `${username} change ${change.fieldName} for ${customerName} from ${change.oldValue} to ${change.newValue}`
      );
      
      console.log('📄 Descriptions to log:', descriptions);
      
      // Log each change separately
      for (let i = 0; i < changes.length; i++) {
        console.log(`📝 Logging change ${i + 1}/${changes.length}:`, descriptions[i]);
        await logProjectChange(
          userId,
          id,
          'UPDATE',
          descriptions[i],
          [changes[i]]
        );
      }
      
      console.log('✅ All changes logged to audit log');
    } else {
      console.log('⚠️ No changes detected - skipping audit log');
    }
    
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
    
    // Get project data before deletion for audit log
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
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
    
    // Step 4: Delete the project
    const deleted = await Project.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Step 5: Log the deletion
    const userId = req.user?.User_ID || req.user?.userId || 1;
    const username = req.user?.Username || req.user?.username || 'System';
    const customerName = inventoryRecords.length > 0 ? inventoryRecords[0].Customer_Name : 'Unknown';
    
    await logProjectChange(
      userId,
      id,
      'DELETE',
      `${username} deleted Project for ${customerName}`,
      []
    );
    
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

// Update project solution principals
exports.updateProjectSolutionPrincipals = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution_principals } = req.body;

    if (!solution_principals || !Array.isArray(solution_principals)) {
      return res.status(400).json({ error: 'solution_principals array is required' });
    }

    console.log(`Updating solution principals for project ${id}:`, solution_principals);

    const { pool } = require('../config/database');
    
    // Delete existing solution principal associations
    await pool.execute(`DELETE FROM PROJECT_SP_BRIDGE WHERE Project_ID = ?`, [id]);
    
    // Insert new solution principal associations
    if (solution_principals.length > 0) {
      // Use parameterized query for safety
      const placeholders = solution_principals.map(() => '(?, ?, NULL)').join(', ');
      const values = [];
      solution_principals.forEach(spId => {
        values.push(id, spId);
      });
      
      await pool.execute(`
        INSERT INTO PROJECT_SP_BRIDGE (Project_ID, SP_ID, \`Support Type\`)
        VALUES ${placeholders}
      `, values);
    }

    res.json({
      success: true,
      message: 'Solution principals updated successfully',
      count: solution_principals.length
    });
  } catch (error) {
    console.error('Error updating project solution principals:', error);
    res.status(500).json({ 
      error: 'Failed to update solution principals',
      message: error.message 
    });
  }
};