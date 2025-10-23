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
      const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM ASSET');
      const [statusResult] = await pool.execute('SELECT Status, COUNT(*) as count FROM ASSET GROUP BY Status');
      const [categoryResult] = await pool.execute(`
        SELECT c.Category, COUNT(*) as count 
        FROM ASSET a 
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID 
        GROUP BY c.Category
      `);
      
      return {
        total: totalResult[0].total,
        byStatus: statusResult.map(item => ({
          status: item.Status || 'Unknown',
          count: item.count
        })),
        byCategory: categoryResult.map(item => ({
          category: item.Category || 'Unknown',
          count: item.count
        }))
      };
    } catch (error) {
      console.error('Error in Asset.getStatistics:', error);
      // Return fallback data if database query fails
      return {
        total: 0,
        byStatus: [],
        byCategory: []
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

  // Helper method to get or create category
  static async getOrCreateCategory(categoryName) {
    try {
      // First try to find existing category
      const [existing] = await pool.execute(
        'SELECT Category_ID FROM CATEGORY WHERE Category = ?',
        [categoryName]
      );
      
      if (existing.length > 0) {
        return existing[0].Category_ID;
      }
      
      // Create new category
      const [result] = await pool.execute(
        'INSERT INTO CATEGORY (Category) VALUES (?)',
        [categoryName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in getOrCreateCategory:', error);
      throw error;
    }
  }

  // Helper method to get or create model
  static async getOrCreateModel(modelName) {
    try {
      // First try to find existing model
      const [existing] = await pool.execute(
        'SELECT Model_ID FROM MODEL WHERE Model = ?',
        [modelName]
      );
      
      if (existing.length > 0) {
        return existing[0].Model_ID;
      }
      
      // Create new model
      const [result] = await pool.execute(
        'INSERT INTO MODEL (Model) VALUES (?)',
        [modelName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in getOrCreateModel:', error);
      throw error;
    }
  }

  // Helper method to create peripheral
  static async createPeripheral(assetId, peripheralTypeName, serialCode, condition, remarks) {
    try {
      // Get peripheral type ID
      const [typeResult] = await pool.execute(
        'SELECT Peripheral_Type_ID FROM PERIPHERAL_TYPE WHERE Peripheral_Type_Name = ?',
        [peripheralTypeName]
      );
      
      if (typeResult.length === 0) {
        throw new Error(`Peripheral type '${peripheralTypeName}' not found`);
      }
      
      const peripheralTypeId = typeResult[0].Peripheral_Type_ID;
      
      // Create peripheral
      const [result] = await pool.execute(
        'INSERT INTO PERIPHERAL (Peripheral_Type_ID, Asset_ID, Serial_Code, `Condition`, Remarks) VALUES (?, ?, ?, ?, ?)',
        [peripheralTypeId, assetId, serialCode, condition, remarks]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error in createPeripheral:', error);
      throw error;
    }
  }

  // Helper method to link asset to project via inventory
  static async linkToProject(assetId, projectRefNum, customerName, branch) {
    try {
      // Find project and customer IDs
      const [projectResult] = await pool.execute(
        'SELECT Project_ID FROM PROJECT WHERE Project_Ref_Number = ?',
        [projectRefNum]
      );
      
      if (projectResult.length === 0) {
        throw new Error(`Project with reference number '${projectRefNum}' not found`);
      }
      
      const projectId = projectResult[0].Project_ID;
      
      const [customerResult] = await pool.execute(
        'SELECT Customer_ID FROM CUSTOMER WHERE Customer_Name = ? AND Branch = ?',
        [customerName, branch]
      );
      
      if (customerResult.length === 0) {
        throw new Error(`Customer '${customerName}' with branch '${branch}' not found`);
      }
      
      const customerId = customerResult[0].Customer_ID;
      
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
        return existingInventory[0].Inventory_ID;
      } else {
        // Create new inventory record
        const [result] = await pool.execute(
          'INSERT INTO INVENTORY (Project_ID, Customer_ID, Asset_ID) VALUES (?, ?, ?)',
          [projectId, customerId, assetId]
        );
        return result.insertId;
      }
    } catch (error) {
      console.error('Error in linkToProject:', error);
      throw error;
    }
  }

  // Helper method to create preventive maintenance record
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
}

module.exports = Asset;