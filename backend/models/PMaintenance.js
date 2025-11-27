const { pool } = require('../config/database');

class PMaintenance {
  constructor(data) {
    this.PM_ID = data.PM_ID;
    this.Asset_ID = data.Asset_ID;
    this.PM_Date = data.PM_Date;
    this.Remarks = data.Remarks;
    this.Status = data.Status;
  }

  // Get all PM records with asset, project, and customer details
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pm.PM_ID,
          pm.Asset_ID,
          pm.PM_Date,
          pm.Remarks,
          pm.Status as PM_Status,
          pm.Created_By,
          u.username as Created_By_Username,
          CONCAT(u.First_Name, ' ', u.Last_Name) as Created_By_Name,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status as Asset_Status,
          c.Category_ID,
          c.Category,
          m.Model_Name as Model,
          r.Recipient_Name,
          r.Department,
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          cust.Customer_ID,
          cust.Customer_Name,
          cust.Branch,
          cust.Customer_Ref_Number
        FROM PMAINTENANCE pm
        LEFT JOIN ASSET a ON pm.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        LEFT JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
        LEFT JOIN PROJECT p ON i.Project_ID = p.Project_ID
        LEFT JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        LEFT JOIN USER u ON pm.Created_By = u.User_ID
        ORDER BY pm.PM_Date DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.findAll:', error);
      throw error;
    }
  }

  // Get PM statistics
  static async getStatistics() {
    try {
      // Total PM records
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM PMAINTENANCE'
      );

      // PM by status
      const [statusResult] = await pool.execute(`
        SELECT Status, COUNT(*) as count 
        FROM PMAINTENANCE 
        GROUP BY Status
      `);

      // PM by category
      const [categoryResult] = await pool.execute(`
        SELECT c.Category, COUNT(*) as count
        FROM PMAINTENANCE pm
        LEFT JOIN ASSET a ON pm.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        GROUP BY c.Category
      `);

      // Upcoming PM (next 30 days)
      const [upcomingResult] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM PMAINTENANCE
        WHERE PM_Date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      `);

      // Overdue PM
      const [overdueResult] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM PMAINTENANCE
        WHERE PM_Date < CURDATE() AND Status != 'Completed'
      `);

      // Completed PM
      const [completedResult] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM PMAINTENANCE
        WHERE Status = 'Completed'
      `);

      return {
        total: totalResult[0].total,
        byStatus: statusResult,
        byCategory: categoryResult,
        upcoming: upcomingResult[0].count,
        overdue: overdueResult[0].count,
        completed: completedResult[0].count
      };
    } catch (error) {
      console.error('Error in PMaintenance.getStatistics:', error);
      throw error;
    }
  }

  // Get unique customers
  static async getCustomers() {
    try {
      // Get all customers grouped by Customer_Ref_Number (1 project = 1 customer)
      // This will show all customers even if they don't have PM records yet
      const [rows] = await pool.execute(`
        SELECT DISTINCT 
          Customer_Ref_Number as Customer_ID,
          Customer_Name,
          Customer_Ref_Number
        FROM CUSTOMER
        GROUP BY Customer_Ref_Number, Customer_Name
        ORDER BY Customer_Name
      `);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getCustomers:', error);
      throw error;
    }
  }

  // Get branches by customer reference number
  static async getBranchesByCustomer(customerRefNumber) {
    try {
      // Get all branches for this customer reference (since customerId is now Customer_Ref_Number)
      const [rows] = await pool.execute(`
        SELECT DISTINCT Branch
        FROM CUSTOMER
        WHERE Customer_Ref_Number = ?
        ORDER BY Branch
      `, [customerRefNumber]);
      return rows.map(row => row.Branch);
    } catch (error) {
      console.error('Error in PMaintenance.getBranchesByCustomer:', error);
      throw error;
    }
  }

  // Get PM data filtered by customer and branch
  static async findByCustomerAndBranch(customerRefNumber, branch) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status as Asset_Status,
          c.Category_ID,
          c.Category,
          m.Model_Name as Model,
          r.Recipient_Name,
          r.Department,
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          cust.Customer_ID,
          cust.Customer_Name,
          cust.Branch,
          cust.Customer_Ref_Number,
          pm.PM_ID,
          pm.PM_Date,
          pm.Remarks,
          pm.Status as PM_Status
        FROM ASSET a
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        INNER JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
        INNER JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        LEFT JOIN PROJECT p ON i.Project_ID = p.Project_ID
        LEFT JOIN PMAINTENANCE pm ON a.Asset_ID = pm.Asset_ID
        WHERE cust.Customer_Ref_Number = ? AND cust.Branch = ?
        ORDER BY c.Category, a.Asset_ID, pm.PM_Date ASC
      `, [customerRefNumber, branch]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.findByCustomerAndBranch:', error);
      throw error;
    }
  }

  // Get PM checklist for a specific category
  static async getChecklistByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Checklist_ID,
          Category_ID,
          Check_Item,
          Display_Order
        FROM PM_CHECKLIST
        WHERE Category_ID = ?
        ORDER BY 
          CASE WHEN Display_Order IS NULL THEN 1 ELSE 0 END,
          Display_Order,
          Checklist_ID
      `, [categoryId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getChecklistByCategory:', error);
      throw error;
    }
  }

  // Get PM results for a specific PM_ID
  static async getResultsByPMId(pmId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pmr.PM_Result_ID,
          pmr.PM_ID,
          pmr.Checklist_ID,
          pmr.Is_OK_bool,
          pmr.Remarks,
          pmc.Check_item_Long,
          pmc.Category_ID
        FROM PM_RESULT pmr
        LEFT JOIN PM_CHECKLIST pmc ON pmr.Checklist_ID = pmc.Checklist_ID
        WHERE pmr.PM_ID = ?
        ORDER BY 
          CASE WHEN pmc.Display_Order IS NULL THEN 1 ELSE 0 END,
          pmc.Display_Order,
          pmc.Checklist_ID
      `, [pmId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getResultsByPMId:', error);
      throw error;
    }
  }

  // Get detailed PM with checklist results
  static async getDetailedPM(pmId) {
    try {
      // Get PM basic info
      const [pmRows] = await pool.execute(`
        SELECT 
          pm.*,
          u.username as Created_By_Username,
          CONCAT(u.First_Name, ' ', u.Last_Name) as Created_By_Name,
          u.User_Department as Created_By_Department,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          c.Category_ID,
          c.Category,
          m.Model_Name as Model,
          r.Recipient_Name,
          r.Department,
          r.Position,
          cust.Customer_Name,
          cust.Branch,
          p.Project_Title,
          p.file_path_logo as Project_Logo_Path
        FROM PMAINTENANCE pm
        LEFT JOIN ASSET a ON pm.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        LEFT JOIN INVENTORY inv ON a.Asset_ID = inv.Asset_ID
        LEFT JOIN CUSTOMER cust ON inv.Customer_ID = cust.Customer_ID
        LEFT JOIN PROJECT p ON inv.Project_ID = p.Project_ID
        LEFT JOIN USER u ON pm.Created_By = u.User_ID
        WHERE pm.PM_ID = ?
      `, [pmId]);

      if (pmRows.length === 0) return null;

      const pmData = pmRows[0];

      // Get checklist results
      pmData.checklist_results = await this.getResultsByPMId(pmId);
      
      // Get peripherals for the asset
      pmData.peripherals = await this.getPeripheralsByAssetId(pmData.Asset_ID);

      return pmData;
    } catch (error) {
      console.error('Error in PMaintenance.getDetailedPM:', error);
      throw error;
    }
  }

  // Get PM data with checklist results grouped by category
  static async getPMWithChecklistByCustomerAndBranch(customerRefNumber, branch) {
    try {
      // First get all ASSETS for this customer reference number and branch
      // This includes assets WITH and WITHOUT PM records
      const [assetRows] = await pool.execute(`
        SELECT 
          a.Asset_ID,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          c.Category_ID,
          c.Category,
          m.Model_Name as Model,
          r.Recipient_Name,
          r.Department,
          pm.PM_ID,
          pm.PM_Date,
          pm.Remarks as PM_Remarks,
          pm.Status as PM_Status
        FROM ASSET a
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        INNER JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
        INNER JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        LEFT JOIN PMAINTENANCE pm ON a.Asset_ID = pm.Asset_ID
        WHERE cust.Customer_Ref_Number = ? AND cust.Branch = ?
        ORDER BY c.Category, a.Asset_Tag_ID, pm.PM_Date ASC
      `, [customerRefNumber, branch]);

      // For each row, get its checklist results (only if PM_ID exists)
      const pmWithChecklists = await Promise.all(
        assetRows.map(async (row) => {
          // If this row has no PM_ID, return it as-is with empty checklist
          if (!row.PM_ID) {
            return {
              ...row,
              checklist_results: []
            };
          }

          // Otherwise, fetch checklist results for this PM
          const [checklistResults] = await pool.execute(`
            SELECT 
              pmr.PM_Result_ID,
              pmr.Checklist_ID,
              pmr.Is_OK_bool,
              pmr.Remarks,
              pmc.Check_item_Long,
              pmc.Category_ID
            FROM PM_RESULT pmr
            LEFT JOIN PM_CHECKLIST pmc ON pmr.Checklist_ID = pmc.Checklist_ID
            WHERE pmr.PM_ID = ?
            ORDER BY 
              CASE WHEN pmc.Display_Order IS NULL THEN 1 ELSE 0 END,
              pmc.Display_Order,
              pmc.Checklist_ID
          `, [row.PM_ID]);

          return {
            ...row,
            checklist_results: checklistResults
          };
        })
      );

      return pmWithChecklists;
    } catch (error) {
      console.error('Error in PMaintenance.getPMWithChecklistByCustomerAndBranch:', error);
      throw error;
    }
  }

  // Get all checklist items for a specific category
  static async getAllChecklistItemsByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Checklist_ID,
          Category_ID,
          Check_Item,
          Check_item_Long,
          Display_Order
        FROM PM_CHECKLIST
        WHERE Category_ID = ?
        ORDER BY 
          CASE WHEN Display_Order IS NULL THEN 1 ELSE 0 END,
          Display_Order,
          Checklist_ID
      `, [categoryId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getAllChecklistItemsByCategory:', error);
      throw error;
    }
  }

  // Delete PM record and all related PM_RESULT entries
  static async deletePM(pmId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete all PM_RESULT entries for this PM_ID
      await connection.execute(
        'DELETE FROM PM_RESULT WHERE PM_ID = ?',
        [pmId]
      );
      
      // Delete the PM record
      const [result] = await connection.execute(
        'DELETE FROM PMAINTENANCE WHERE PM_ID = ?',
        [pmId]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error in PMaintenance.deletePM:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get peripherals for a specific asset
  static async getPeripheralsByAssetId(assetId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          per.Peripheral_ID,
          per.Serial_Code,
          pt.Peripheral_Type_Name
        FROM PERIPHERAL per
        LEFT JOIN PERIPHERAL_TYPE pt ON per.Peripheral_Type_ID = pt.Peripheral_Type_ID
        WHERE per.Asset_ID = ?
        ORDER BY pt.Peripheral_Type_Name
      `, [assetId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getPeripheralsByAssetId:', error);
      throw error;
    }
  }

  // Get PM records for a specific asset
  static async findByAssetId(assetId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pm.PM_ID,
          pm.Asset_ID,
          pm.PM_Date,
          pm.Remarks,
          pm.Status,
          pm.Created_By,
          u.username as Created_By_Username,
          CONCAT(u.First_Name, ' ', u.Last_Name) as Created_By_Name
        FROM PMAINTENANCE pm
        LEFT JOIN USER u ON pm.Created_By = u.User_ID
        WHERE pm.Asset_ID = ?
        ORDER BY pm.PM_Date DESC
      `, [assetId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.findByAssetId:', error);
      throw error;
    }
  }

  // Create new PM record
  static async create(assetId, pmDate, remarks, status = 'In-Process', createdBy = null) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO PMAINTENANCE (Asset_ID, PM_Date, Remarks, Status, Created_By)
        VALUES (?, ?, ?, ?, ?)
      `, [assetId, pmDate, remarks, status, createdBy]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error in PMaintenance.create:', error);
      throw error;
    }
  }

  // Create PM results for a PM record
  static async createResults(pmId, checklistResults) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // checklistResults is an array of { Checklist_ID, Is_OK_bool, Remarks }
      for (const result of checklistResults) {
        await connection.execute(`
          INSERT INTO PM_RESULT (PM_ID, Checklist_ID, Is_OK_bool, Remarks)
          VALUES (?, ?, ?, ?)
        `, [pmId, result.Checklist_ID, result.Is_OK_bool, result.Remarks || null]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error in PMaintenance.createResults:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Create PM record with results in one transaction
  static async createWithResults(assetId, pmDate, remarks, checklistResults, status = 'In-Process', createdBy = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create PM record
      const [pmResult] = await connection.execute(`
        INSERT INTO PMAINTENANCE (Asset_ID, PM_Date, Remarks, Status, Created_By)
        VALUES (?, ?, ?, ?, ?)
      `, [assetId, pmDate, remarks, status, createdBy]);

      const pmId = pmResult.insertId;

      // Create PM results
      for (const result of checklistResults) {
        await connection.execute(`
          INSERT INTO PM_RESULT (PM_ID, Checklist_ID, Is_OK_bool, Remarks)
          VALUES (?, ?, ?, ?)
        `, [pmId, result.Checklist_ID, result.Is_OK_bool, result.Remarks || null]);
      }

      await connection.commit();
      return pmId;
    } catch (error) {
      await connection.rollback();
      console.error('Error in PMaintenance.createWithResults:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============ CHECKLIST MANAGEMENT ============
  
  // Get all categories
  static async getAllCategories() {
    try {
      const [rows] = await pool.execute(`
        SELECT Category_ID, Category
        FROM CATEGORY
        ORDER BY Category
      `);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getAllCategories:', error);
      throw error;
    }
  }

  // Create new checklist item
  static async createChecklistItem(categoryId, checkItem, checkItemLong) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO PM_CHECKLIST (Category_ID, Check_Item, Check_item_Long)
        VALUES (?, ?, ?)
      `, [categoryId, checkItem, checkItemLong || checkItem]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error in PMaintenance.createChecklistItem:', error);
      throw error;
    }
  }

  // Update checklist item
  static async updateChecklistItem(checklistId, checkItem, checkItemLong) {
    try {
      const [result] = await pool.execute(`
        UPDATE PM_CHECKLIST
        SET Check_Item = ?, Check_item_Long = ?
        WHERE Checklist_ID = ?
      `, [checkItem, checkItemLong || checkItem, checklistId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in PMaintenance.updateChecklistItem:', error);
      throw error;
    }
  }

  // Delete checklist item
  static async deleteChecklistItem(checklistId) {
    try {
      // First check if this checklist item is used in any PM results
      const [pmResults] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM PM_RESULT
        WHERE Checklist_ID = ?
      `, [checklistId]);

      if (pmResults[0].count > 0) {
        throw new Error(`Cannot delete checklist item: it is used in ${pmResults[0].count} PM record(s)`);
      }

      const [result] = await pool.execute(`
        DELETE FROM PM_CHECKLIST
        WHERE Checklist_ID = ?
      `, [checklistId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in PMaintenance.deleteChecklistItem:', error);
      throw error;
    }
  }

  // Update checklist items order
  static async updateChecklistOrder(orderUpdates) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Update Display_Order for each checklist item
      for (const update of orderUpdates) {
        await connection.execute(
          'UPDATE PM_CHECKLIST SET Display_Order = ? WHERE Checklist_ID = ?',
          [update.Display_Order, update.Checklist_ID]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error in PMaintenance.updateChecklistOrder:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Create new category
  static async createCategory(categoryName) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO CATEGORY (Category)
        VALUES (?)
      `, [categoryName]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error in PMaintenance.createCategory:', error);
      throw error;
    }
  }
}

module.exports = PMaintenance;
