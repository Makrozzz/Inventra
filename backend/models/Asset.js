const { pool } = require('../config/database');

class Asset {
  constructor(data) {
    this.Asset_ID = data.Asset_ID;
    this.Asset_Serial_Number = data.Asset_Serial_Number;
    this.Asset_Tag_ID = data.Asset_Tag_ID;
    this.Item_Name = data.Item_Name;
    this.Recipients_ID = data.Recipients_ID;
    this.Category_ID = data.Category_ID;
    this.Model_ID = data.Model_ID;
    this.Status = data.Status;
    
    // Related data from JOINs
    this.Category = data.Category;
    this.Model = data.Model;
    this.Recipient_Name = data.Recipient_Name;
    this.Department = data.Department;
  }

  // Get all assets with complete inventory information (Project, Customer, Recipients, Category, Model)
  static async findAll() {
    try {
      // First, let's check all assets and their inventory status
      console.log('=== Asset.findAll() DEBUG ===');
      
      // Check total assets in ASSET table
      const [assetCount] = await pool.execute('SELECT COUNT(*) as total FROM ASSET');
      console.log(`Total assets in ASSET table: ${assetCount[0].total}`);
      
      // Check total inventory records
      const [inventoryCount] = await pool.execute('SELECT COUNT(*) as total FROM INVENTORY WHERE Asset_ID IS NOT NULL');
      console.log(`Total inventory records with Asset_ID: ${inventoryCount[0].total}`);
      
      // Check assets without inventory linkage
      const [orphanAssets] = await pool.execute(`
        SELECT a.Asset_ID, a.Asset_Serial_Number, a.Asset_Tag_ID, a.Item_Name 
        FROM ASSET a 
        WHERE a.Asset_ID NOT IN (SELECT DISTINCT Asset_ID FROM INVENTORY WHERE Asset_ID IS NOT NULL)
      `);
      
      if (orphanAssets.length > 0) {
        console.log(`WARNING: Found ${orphanAssets.length} assets without inventory links:`);
        orphanAssets.forEach(asset => {
          console.log(`  - Asset_ID: ${asset.Asset_ID}, Serial: ${asset.Asset_Serial_Number}, Tag: ${asset.Asset_Tag_ID}`);
        });
      }

      const [rows] = await pool.execute(`
        SELECT 
          i.Inventory_ID,
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department,
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          p.Solution_Principal,
          p.Warranty,
          p.Preventive_Maintenance,
          p.Start_Date,
          p.End_Date,
          cust.Customer_ID,
          cust.Customer_Ref_Number,
          cust.Customer_Name,
          cust.Branch
        FROM INVENTORY i
        INNER JOIN ASSET a ON i.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        LEFT JOIN PROJECT p ON i.Project_ID = p.Project_ID
        LEFT JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        ORDER BY i.Inventory_ID DESC
      `);
      
      console.log(`Query returned ${rows.length} assets with inventory links`);
      
      if (rows.length > 0) {
        const inventoryIds = rows.map(row => row.Inventory_ID).sort((a, b) => a - b);
        console.log(`Inventory_ID range: ${inventoryIds[0]} - ${inventoryIds[inventoryIds.length - 1]}`);
        console.log(`Latest 5 Inventory_IDs: ${inventoryIds.slice(-5).join(', ')}`);
      }
      
      console.log('=== End Asset.findAll() DEBUG ===');
      
      // Return rows with all joined data
      return rows;
    } catch (error) {
      console.error('Error in Asset.findAll:', error);
      throw error;
    }
  }

  // Get asset by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Recipients_ID,
          a.Category_ID,
          a.Model_ID,
          a.Status,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department
        FROM ASSET a
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        WHERE a.Asset_ID = ?
      `, [id]);
      
      if (rows.length > 0) {
        return new Asset(rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error in Asset.findById:', error);
      throw error;
    }
  }

  // Get asset by serial number
  static async findBySerialNumber(serialNumber) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Recipients_ID,
          a.Category_ID,
          a.Model_ID,
          a.Status,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department
        FROM ASSET a
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        WHERE a.Asset_Serial_Number = ?
      `, [serialNumber]);
      
      if (rows.length > 0) {
        return new Asset(rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error in Asset.findBySerialNumber:', error);
      throw error;
    }
  }

  // Create new asset
  static async create(assetData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO ASSET (Asset_Serial_Number, Asset_Tag_ID, Item_Name, Recipients_ID, Category_ID, Model_ID, Status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assetData.Asset_Serial_Number,
          assetData.Asset_Tag_ID,
          assetData.Item_Name,
          assetData.Recipients_ID,
          assetData.Category_ID,
          assetData.Model_ID,
          assetData.Status || 'Active'
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error in Asset.create:', error);
      throw error;
    }
  }

  // Update asset
  async update() {
    try {
      await pool.execute(
        `UPDATE ASSET SET 
         Asset_Serial_Number = ?, 
         Asset_Tag_ID = ?, 
         Item_Name = ?, 
         Recipients_ID = ?, 
         Category_ID = ?, 
         Model_ID = ?, 
         Status = ?
         WHERE Asset_ID = ?`,
        [
          this.Asset_Serial_Number,
          this.Asset_Tag_ID,
          this.Item_Name,
          this.Recipients_ID,
          this.Category_ID,
          this.Model_ID,
          this.Status,
          this.Asset_ID
        ]
      );
      return this;
    } catch (error) {
      console.error('Error in Asset.update:', error);
      throw error;
    }
  }

  // Helper method to update recipient information properly
  static async updateRecipientInfo(recipientName, department, currentRecipientId) {
    try {
      if (!recipientName && !department) return currentRecipientId;

      // If we have a current recipient ID, update that recipient's information
      if (currentRecipientId) {
        const updateFields = [];
        const updateValues = [];

        if (recipientName) {
          updateFields.push('Recipient_Name = ?');
          updateValues.push(recipientName);
        }

        if (department) {
          updateFields.push('Department = ?');
          updateValues.push(department);
        }

        if (updateFields.length > 0) {
          updateValues.push(currentRecipientId);
          
          const updateQuery = `UPDATE RECIPIENTS SET ${updateFields.join(', ')} WHERE Recipients_ID = ?`;
          console.log('Updating existing recipient:', { recipientName, department, currentRecipientId });
          
          await pool.execute(updateQuery, updateValues);
          return currentRecipientId;
        }
      }

      // If no current recipient ID, create new recipient
      if (recipientName) {
        console.log('Creating new recipient:', { recipientName, department });
        const [result] = await pool.execute(
          'INSERT INTO RECIPIENTS (Recipient_Name, Department) VALUES (?, ?)',
          [recipientName, department || '']
        );
        return result.insertId;
      }

      return currentRecipientId;
    } catch (error) {
      console.error('Error in updateRecipientInfo:', error);
      return currentRecipientId; // Return original ID on error
    }
  }

  // Helper method to update category information properly
  static async updateCategoryInfo(categoryName, currentCategoryId) {
    try {
      if (!categoryName) return currentCategoryId;

      // If we have a current category ID, update that category's name
      if (currentCategoryId) {
        console.log('Updating existing category:', { categoryName, currentCategoryId });
        
        await pool.execute(
          'UPDATE CATEGORY SET Category = ? WHERE Category_ID = ?',
          [categoryName, currentCategoryId]
        );
        return currentCategoryId;
      }

      // If no current category ID, create new category
      console.log('Creating new category:', { categoryName });
      const [result] = await pool.execute(
        'INSERT INTO CATEGORY (Category) VALUES (?)',
        [categoryName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in updateCategoryInfo:', error);
      return currentCategoryId; // Return original ID on error
    }
  }

  // Helper method to update model information properly
  static async updateModelInfo(modelName, currentModelId) {
    try {
      if (!modelName) return currentModelId;

      // If we have a current model ID, update that model's name
      if (currentModelId) {
        console.log('Updating existing model:', { modelName, currentModelId });
        
        await pool.execute(
          'UPDATE MODEL SET Model = ? WHERE Model_ID = ?',
          [modelName, currentModelId]
        );
        return currentModelId;
      }

      // If no current model ID, create new model
      console.log('Creating new model:', { modelName });
      const [result] = await pool.execute(
        'INSERT INTO MODEL (Model) VALUES (?)',
        [modelName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in updateModelInfo:', error);
      return currentModelId; // Return original ID on error
    }
  }

  // Delete asset
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM ASSET WHERE Asset_ID = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Asset.delete:', error);
      throw error;
    }
  }

  // Delete asset by ID with cascade deletion of related records
  static async deleteById(assetId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      console.log(`Starting deletion process for Asset_ID: ${assetId}`);

      let pmRecordsDeleted = 0;
      let pmResultsDeleted = 0;

      // 1. Try to delete PM records and their results (handle missing tables gracefully)
      try {
        // First, get all PM records for this asset
        const [pmRecords] = await connection.execute(
          'SELECT PM_ID FROM PMAINTENANCE WHERE Asset_ID = ?',
          [assetId]
        );
        console.log(`Found ${pmRecords.length} PM records to delete`);

        // Try to delete PM_RESULT for each PM record (correct table name is singular)
        try {
          for (const pm of pmRecords) {
            const [pmResultDeleteResult] = await connection.execute(
              'DELETE FROM PM_RESULT WHERE PM_ID = ?',
              [pm.PM_ID]
            );
            pmResultsDeleted += pmResultDeleteResult.affectedRows;
          }
          console.log(`Deleted ${pmResultsDeleted} PM result records`);
        } catch (pmResultError) {
          // PM_RESULT table might not exist, continue anyway
          console.log(`Warning: Could not delete PM_RESULT (table might not exist): ${pmResultError.message}`);
        }

        // Delete PMAINTENANCE records
        const [pmDeleteResult] = await connection.execute(
          'DELETE FROM PMAINTENANCE WHERE Asset_ID = ?',
          [assetId]
        );
        pmRecordsDeleted = pmDeleteResult.affectedRows;
        console.log(`Deleted ${pmRecordsDeleted} PM maintenance records`);
      } catch (pmError) {
        // PMAINTENANCE table issues, log and continue
        console.log(`Warning: Could not delete PM records: ${pmError.message}`);
      }

      // 2. Delete peripherals for this asset
      let peripheralsDeleted = 0;
      try {
        const [peripheralResult] = await connection.execute(
          'DELETE FROM PERIPHERAL WHERE Asset_ID = ?',
          [assetId]
        );
        peripheralsDeleted = peripheralResult.affectedRows;
        console.log(`Deleted ${peripheralsDeleted} peripherals`);
      } catch (peripheralError) {
        console.log(`Warning: Could not delete peripherals: ${peripheralError.message}`);
      }

      // 3. Update inventory records (set Asset_ID to NULL instead of deleting)
      let inventoryUpdated = 0;
      try {
        const [inventoryResult] = await connection.execute(
          'UPDATE INVENTORY SET Asset_ID = NULL WHERE Asset_ID = ?',
          [assetId]
        );
        inventoryUpdated = inventoryResult.affectedRows;
        console.log(`Updated ${inventoryUpdated} inventory records`);
      } catch (inventoryError) {
        console.log(`Warning: Could not update inventory: ${inventoryError.message}`);
      }

      // 4. Finally, delete the asset (this is the critical operation)
      const [assetResult] = await connection.execute(
        'DELETE FROM ASSET WHERE Asset_ID = ?',
        [assetId]
      );
      console.log(`Deleted ${assetResult.affectedRows} asset record`);

      if (assetResult.affectedRows === 0) {
        await connection.rollback();
        return {
          success: false,
          error: 'Asset not found or already deleted'
        };
      }

      await connection.commit();
      console.log(`✅ Successfully deleted Asset_ID: ${assetId} and all related records`);

      return {
        success: true,
        peripheralsDeleted: peripheralsDeleted,
        pmRecordsDeleted: pmRecordsDeleted,
        inventoryUpdated: inventoryUpdated
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error in Asset.deleteById:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  }

  // Get complete asset detail with all related information (Project, Customer, Peripherals, etc.)
  static async findDetailById(id) {
    try {
      // Get main asset information with project, customer, recipients
      const [assetRows] = await pool.execute(`
        SELECT 
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department,
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          p.Solution_Principal,
          p.Warranty,
          p.Preventive_Maintenance,
          p.Start_Date,
          p.End_Date,
          cust.Customer_ID,
          cust.Customer_Ref_Number,
          cust.Customer_Name,
          cust.Branch
        FROM ASSET a
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        LEFT JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
        LEFT JOIN PROJECT p ON i.Project_ID = p.Project_ID
        LEFT JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        WHERE a.Asset_ID = ?
        LIMIT 1
      `, [id]);
      
      if (assetRows.length === 0) {
        return null;
      }

      const assetData = assetRows[0];

      // Get peripherals for this asset
      const [peripheralRows] = await pool.execute(`
        SELECT 
          per.Peripheral_ID,
          per.Serial_Code,
          per.Condition,
          per.Remarks,
          pt.Peripheral_Type_Name
        FROM PERIPHERAL per
        LEFT JOIN PERIPHERAL_TYPE pt ON per.Peripheral_Type_ID = pt.Peripheral_Type_ID
        WHERE per.Asset_ID = ?
        ORDER BY pt.Peripheral_Type_Name
      `, [id]);

      // Combine asset data with peripherals
      return {
        ...assetData,
        Peripherals: peripheralRows
      };
    } catch (error) {
      console.error('Error in Asset.findDetailById:', error);
      throw error;
    }
  }

  // Get asset statistics
  static async getStatistics() {
    try {
      console.log('=== Asset.getStatistics() CALLED ===');
      
      const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM ASSET');
      console.log('Total query result:', totalResult);
      
      const [statusResult] = await pool.execute('SELECT Status, COUNT(*) as count FROM ASSET GROUP BY Status');
      console.log('Status query result:', statusResult);
      
      const [categoryResult] = await pool.execute(`
        SELECT c.Category, COUNT(*) as count 
        FROM ASSET a 
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID 
        GROUP BY c.Category
      `);
      console.log('Category query result:', categoryResult);
      
      // Get customer distribution (assets per customer)
      const [customerResult] = await pool.execute(`
        SELECT 
          c.Customer_Name,
          COUNT(DISTINCT a.Asset_ID) as asset_count
        FROM CUSTOMER c
        LEFT JOIN INVENTORY i ON c.Customer_ID = i.Customer_ID
        LEFT JOIN ASSET a ON i.Asset_ID = a.Asset_ID
        WHERE a.Asset_ID IS NOT NULL
        GROUP BY c.Customer_Name
        HAVING asset_count > 0
        ORDER BY asset_count DESC
      `);
      console.log('Customer distribution query result:', customerResult);
      
      // Get customer distribution by category (for stacked bar chart)
      const [customerByCategoryResult] = await pool.execute(`
        SELECT 
          c.Customer_Name,
          cat.Category,
          COUNT(DISTINCT a.Asset_ID) as asset_count
        FROM CUSTOMER c
        LEFT JOIN INVENTORY i ON c.Customer_ID = i.Customer_ID
        LEFT JOIN ASSET a ON i.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY cat ON a.Category_ID = cat.Category_ID
        WHERE a.Asset_ID IS NOT NULL
        GROUP BY c.Customer_Name, cat.Category
        ORDER BY c.Customer_Name, asset_count DESC
      `);
      console.log('Customer by category query result:', customerByCategoryResult);
      
      // Group customer data by category for stacked bars
      const customersByCategory = {};
      customerByCategoryResult.forEach(item => {
        const customerName = item.Customer_Name || 'Unknown';
        if (!customersByCategory[customerName]) {
          customersByCategory[customerName] = {
            total: 0,
            categories: []
          };
        }
        customersByCategory[customerName].categories.push({
          category: item.Category || 'Unknown',
          count: item.asset_count
        });
        customersByCategory[customerName].total += item.asset_count;
      });
      console.log('Grouped customers by category:', customersByCategory);
      
      const result = {
        total: totalResult[0].total,
        byStatus: statusResult.map(item => ({
          status: item.Status || 'Unknown',
          count: item.count
        })),
        byCategory: categoryResult.map(item => ({
          category: item.Category || 'Unknown',
          count: item.count
        })),
        byCustomer: customerResult.map(item => ({
          customer: item.Customer_Name || 'Unknown',
          count: item.asset_count
        })),
        customersByCategory: customersByCategory
      };
      
      console.log('Final statistics result:', result);
      console.log('====================================');
      
      return result;
    } catch (error) {
      console.error('Error in Asset.getStatistics:', error);
      // Return fallback data if database query fails
      return {
        total: 0,
        byStatus: [],
        byCategory: [],
        byCustomer: [],
        customersByCategory: {}
      };
    }
  }

  // Helper method to create or get recipient
  static async createRecipient(recipientName, department) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO RECIPIENTS (Recipient_Name, Department) VALUES (?, ?)',
        [recipientName, department]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in createRecipient:', error);
      throw error;
    }
  }

  // Helper method to get or create category - ENHANCED with hybrid functionality
  static async getOrCreateCategory(categoryName) {
    try {
      if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
        throw new Error('Category name is required and must be a non-empty string');
      }

      const cleanCategoryName = categoryName.trim();
      console.log(`Getting or creating category: "${cleanCategoryName}"`);

      // First try to find existing category (case-insensitive)
      const [existing] = await pool.execute(
        'SELECT Category_ID, Category FROM CATEGORY WHERE LOWER(Category) = LOWER(?)',
        [cleanCategoryName]
      );
      
      if (existing.length > 0) {
        console.log(`Found existing category: ID=${existing[0].Category_ID}, Name="${existing[0].Category}"`);
        return existing[0].Category_ID;
      }
      
      // Create new category
      const [result] = await pool.execute(
        'INSERT INTO CATEGORY (Category) VALUES (?)',
        [cleanCategoryName]
      );
      
      const newCategoryId = result.insertId;
      console.log(`✅ Created new category: ID=${newCategoryId}, Name="${cleanCategoryName}"`);
      return newCategoryId;
    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 'ER_DUP_ENTRY') {
        try {
          const [existing] = await pool.execute(
            'SELECT Category_ID FROM CATEGORY WHERE LOWER(Category) = LOWER(?)',
            [categoryName.trim()]
          );
          if (existing.length > 0) {
            return existing[0].Category_ID;
          }
        } catch (retryError) {
          console.error('Error in retry after duplicate:', retryError);
        }
      }
      console.error('Error in getOrCreateCategory:', error);
      throw error;
    }
  }

  // Helper method to get or create model - ENHANCED with hybrid functionality
  static async getOrCreateModel(modelName) {
    try {
      if (!modelName || typeof modelName !== 'string' || modelName.trim() === '') {
        throw new Error('Model name is required and must be a non-empty string');
      }

      const cleanModelName = modelName.trim();
      console.log(`Getting or creating model: "${cleanModelName}"`);

      // First try to find existing model (case-insensitive)
      const [existing] = await pool.execute(
        'SELECT Model_ID, Model FROM MODEL WHERE LOWER(Model) = LOWER(?)',
        [cleanModelName]
      );
      
      if (existing.length > 0) {
        console.log(`Found existing model: ID=${existing[0].Model_ID}, Name="${existing[0].Model}"`);
        return existing[0].Model_ID;
      }
      
      // Create new model
      const [result] = await pool.execute(
        'INSERT INTO MODEL (Model) VALUES (?)',
        [cleanModelName]
      );
      
      const newModelId = result.insertId;
      console.log(`✅ Created new model: ID=${newModelId}, Name="${cleanModelName}"`);
      return newModelId;
    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 'ER_DUP_ENTRY') {
        try {
          const [existing] = await pool.execute(
            'SELECT Model_ID FROM MODEL WHERE LOWER(Model) = LOWER(?)',
            [modelName.trim()]
          );
          if (existing.length > 0) {
            return existing[0].Model_ID;
          }
        } catch (retryError) {
          console.error('Error in retry after duplicate:', retryError);
        }
      }
      console.error('Error in getOrCreateModel:', error);
      throw error;
    }
  }

  // Helper method to create peripheral - ENHANCED with hybrid functionality
  static async createPeripheral(assetId, peripheralTypeName, serialCode, condition, remarks) {
    try {
      if (!peripheralTypeName || typeof peripheralTypeName !== 'string' || peripheralTypeName.trim() === '') {
        throw new Error('Peripheral type name is required and must be a non-empty string');
      }

      const cleanPeripheralTypeName = peripheralTypeName.trim();
      console.log(`Creating peripheral: "${cleanPeripheralTypeName}" for Asset_ID: ${assetId}`);

      // Get or create peripheral type (case-insensitive)
      let peripheralTypeId;
      const [existingType] = await pool.execute(
        'SELECT Peripheral_Type_ID FROM PERIPHERAL_TYPE WHERE LOWER(Peripheral_Type_Name) = LOWER(?)',
        [cleanPeripheralTypeName]
      );
      
      if (existingType.length > 0) {
        peripheralTypeId = existingType[0].Peripheral_Type_ID;
        console.log(`Found existing peripheral type: ID=${peripheralTypeId}, Name="${cleanPeripheralTypeName}"`);
      } else {
        // Create new peripheral type
        const [typeResult] = await pool.execute(
          'INSERT INTO PERIPHERAL_TYPE (Peripheral_Type_Name) VALUES (?)',
          [cleanPeripheralTypeName]
        );
        peripheralTypeId = typeResult.insertId;
        console.log(`✅ Created new peripheral type: ID=${peripheralTypeId}, Name="${cleanPeripheralTypeName}"`);
      }
      
      // Create peripheral record
      const [result] = await pool.execute(
        'INSERT INTO PERIPHERAL (Peripheral_Type_ID, Asset_ID, Serial_Code, `Condition`, Remarks) VALUES (?, ?, ?, ?, ?)',
        [peripheralTypeId, assetId, serialCode || null, condition || 'Good', remarks || '']
      );
      
      const peripheralId = result.insertId;
      console.log(`✅ Created peripheral: ID=${peripheralId}, Asset_ID=${assetId}, Type="${cleanPeripheralTypeName}"`);
      return peripheralId;
    } catch (error) {
      // Handle duplicate key error for peripheral type (race condition)
      if (error.code === 'ER_DUP_ENTRY' && error.message.includes('PERIPHERAL_TYPE')) {
        try {
          const [existingType] = await pool.execute(
            'SELECT Peripheral_Type_ID FROM PERIPHERAL_TYPE WHERE LOWER(Peripheral_Type_Name) = LOWER(?)',
            [peripheralTypeName.trim()]
          );
          if (existingType.length > 0) {
            // Retry creating the peripheral with the existing type
            const [result] = await pool.execute(
              'INSERT INTO PERIPHERAL (Peripheral_Type_ID, Asset_ID, Serial_Code, `Condition`, Remarks) VALUES (?, ?, ?, ?, ?)',
              [existingType[0].Peripheral_Type_ID, assetId, serialCode || null, condition || 'Good', remarks || '']
            );
            return result.insertId;
          }
        } catch (retryError) {
          console.error('Error in retry after duplicate peripheral type:', retryError);
        }
      }
      console.error('Error in createPeripheral:', error);
      throw error;
    }
  }

  // Helper method to link asset to project via inventory
  static async linkToProject(assetId, projectRefNum, customerName, branch) {
    try {
      // Find project ID first
      const [projectResult] = await pool.execute(
        'SELECT Project_ID FROM PROJECT WHERE Project_Ref_Number = ?',
        [projectRefNum]
      );
      
      if (projectResult.length === 0) {
        throw new Error(`Project with reference number '${projectRefNum}' not found`);
      }
      
      const projectId = projectResult[0].Project_ID;
      
      // Try to find exact customer/branch match
      let [customerResult] = await pool.execute(
        'SELECT Customer_ID, Customer_Ref_Number FROM CUSTOMER WHERE Customer_Name = ? AND Branch = ?',
        [customerName, branch]
      );
      
      let customerId;
      let customerRefNumber;
      
      if (customerResult.length === 0) {
        console.log(`⚠️ Customer '${customerName}' with branch '${branch}' not found - looking for alternatives`);
        
        // Strategy 1: Try to find customer with same name but different branch
        const [altCustomerResult] = await pool.execute(
          'SELECT Customer_ID, Customer_Ref_Number, Branch FROM CUSTOMER WHERE Customer_Name = ? LIMIT 1',
          [customerName]
        );
        
        if (altCustomerResult.length > 0) {
          // Found customer with same name but different branch - use it
          customerId = altCustomerResult[0].Customer_ID;
          customerRefNumber = altCustomerResult[0].Customer_Ref_Number;
          console.log(`✅ Using existing customer with different branch: '${altCustomerResult[0].Branch}' → '${branch}'`);
        } else {
          // Strategy 2: Create new customer record
          console.log(`📝 Creating new customer record for '${customerName}' in branch '${branch}'`);
          
          // Generate a customer reference number (you can modify this logic as needed)
          const [maxCustomerRef] = await pool.execute(
            'SELECT MAX(CAST(SUBSTRING(Customer_Ref_Number, 2) AS UNSIGNED)) as max_ref FROM CUSTOMER WHERE Customer_Ref_Number REGEXP "^M[0-9]+$"'
          );
          
          const nextRefNum = maxCustomerRef[0]?.max_ref ? `M${String(maxCustomerRef[0].max_ref + 1).padStart(5, '0')}` : 'M24001';
          
          const [insertResult] = await pool.execute(
            'INSERT INTO CUSTOMER (Project_ID, Customer_Ref_Number, Customer_Name, Branch) VALUES (?, ?, ?, ?)',
            [projectId, nextRefNum, customerName, branch]
          );
          
          customerId = insertResult.insertId;
          customerRefNumber = nextRefNum;
          console.log(`✅ Created new customer: ID=${customerId}, Ref=${nextRefNum}, Name='${customerName}', Branch='${branch}'`);
        }
      } else {
        customerId = customerResult[0].Customer_ID;
        customerRefNumber = customerResult[0].Customer_Ref_Number;
        console.log(`✅ Found exact customer match: ID=${customerId}, Ref=${customerRefNumber}`);
      }
      
      // Update existing inventory record or create new one
      const [existingInventory] = await pool.execute(
        'SELECT Inventory_ID FROM INVENTORY WHERE Project_ID = ? AND Customer_ID = ? AND Asset_ID IS NULL LIMIT 1',
        [projectId, customerId]
      );
      
      if (existingInventory.length > 0) {
        // Update existing inventory record
        await pool.execute(
          'UPDATE INVENTORY SET Asset_ID = ? WHERE Inventory_ID = ?',
          [assetId, existingInventory[0].Inventory_ID]
        );
        console.log(`✅ LINKED TO PROJECT: Asset_ID ${assetId} → Inventory_ID ${existingInventory[0].Inventory_ID} (Customer_Ref: ${customerRefNumber})`);
        return existingInventory[0].Inventory_ID;
      } else {
        // Create new inventory record
        const [result] = await pool.execute(
          'INSERT INTO INVENTORY (Project_ID, Customer_ID, Asset_ID) VALUES (?, ?, ?)',
          [projectId, customerId, assetId]
        );
        console.log(`✅ LINKED TO PROJECT: Asset_ID ${assetId} → Inventory_ID ${result.insertId} (Customer_Ref: ${customerRefNumber})`);
        return result.insertId;
      }
    } catch (error) {
      console.error('Error in linkToProject:', error);
      throw error;
    }
  }

  // Helper method to create preventive maintenance record
  // NOTE: This should only be called manually through the PM system, not automatically
  static async createPreventiveMaintenance(assetId) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO PMAINTENANCE (Asset_ID, PM_Date, Status) VALUES (?, CURDATE(), ?)',
        [assetId, 'Scheduled']
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in createPreventiveMaintenance:', error);
      throw error;
    }
  }

  // Helper method to fix orphaned assets by creating inventory links
  // NOTE: This method should NOT automatically assign default customers
  // Orphaned assets should be manually assigned to proper customers/projects
  static async fixOrphanedAssets() {
    try {
      console.log('=== Checking for orphaned assets ===');
      
      // Find assets without inventory links
      const [orphanAssets] = await pool.execute(`
        SELECT a.Asset_ID, a.Asset_Serial_Number, a.Asset_Tag_ID, a.Item_Name 
        FROM ASSET a 
        WHERE a.Asset_ID NOT IN (SELECT DISTINCT Asset_ID FROM INVENTORY WHERE Asset_ID IS NOT NULL)
      `);
      
      if (orphanAssets.length === 0) {
        console.log('No orphaned assets found');
        return { fixed: 0, orphaned: 0 };
      }
      
      console.log(`Found ${orphanAssets.length} orphaned assets:`);
      orphanAssets.forEach(asset => {
        console.log(`  - Asset_ID: ${asset.Asset_ID}, Serial: ${asset.Asset_Serial_Number}, Tag: ${asset.Asset_Tag_ID}`);
      });
      
      console.log('⚠️  ORPHANED ASSETS DETECTED - Manual assignment required');
      console.log('⚠️  These assets were not assigned to default customers to preserve data integrity');
      console.log('⚠️  Please manually assign these assets to correct customers/projects through the UI');
      
      // Do NOT auto-fix with default values - this was causing the NADMA/Putrajaya problem
      // Assets should be manually assigned to correct customers based on their actual source
      
      return { fixed: 0, orphaned: orphanAssets.length };
    } catch (error) {
      console.error('Error in fixOrphanedAssets:', error);
      throw error;
    }
  }
}

module.exports = Asset;