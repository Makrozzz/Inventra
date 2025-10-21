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
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status as Asset_Status,
          c.Category_ID,
          c.Category,
          m.Model,
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
      const [rows] = await pool.execute(`
        SELECT DISTINCT 
          cust.Customer_ID,
          cust.Customer_Name,
          cust.Customer_Ref_Number
        FROM CUSTOMER cust
        INNER JOIN INVENTORY i ON cust.Customer_ID = i.Customer_ID
        INNER JOIN ASSET a ON i.Asset_ID = a.Asset_ID
        INNER JOIN PMAINTENANCE pm ON a.Asset_ID = pm.Asset_ID
        ORDER BY cust.Customer_Name
      `);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getCustomers:', error);
      throw error;
    }
  }

  // Get branches by customer
  static async getBranchesByCustomer(customerId) {
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT 
          cust.Branch
        FROM CUSTOMER cust
        INNER JOIN INVENTORY i ON cust.Customer_ID = i.Customer_ID
        INNER JOIN ASSET a ON i.Asset_ID = a.Asset_ID
        INNER JOIN PMAINTENANCE pm ON a.Asset_ID = pm.Asset_ID
        WHERE cust.Customer_ID = ?
        ORDER BY cust.Branch
      `, [customerId]);
      return rows.map(row => row.Branch);
    } catch (error) {
      console.error('Error in PMaintenance.getBranchesByCustomer:', error);
      throw error;
    }
  }

  // Get PM data filtered by customer and branch
  static async findByCustomerAndBranch(customerId, branch) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          pm.PM_ID,
          pm.Asset_ID,
          pm.PM_Date,
          pm.Remarks,
          pm.Status as PM_Status,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          a.Status as Asset_Status,
          c.Category_ID,
          c.Category,
          m.Model,
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
        WHERE cust.Customer_ID = ? AND cust.Branch = ?
        ORDER BY c.Category, pm.PM_Date DESC
      `, [customerId, branch]);
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
          Check_Item
        FROM PM_CHECKLIST
        WHERE Category_ID = ?
        ORDER BY Checklist_ID
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
          pmc.Check_Item,
          pmc.Category_ID
        FROM PM_RESULT pmr
        LEFT JOIN PM_CHECKLIST pmc ON pmr.Checklist_ID = pmc.Checklist_ID
        WHERE pmr.PM_ID = ?
        ORDER BY pmc.Checklist_ID
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
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          c.Category_ID,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department
        FROM PMAINTENANCE pm
        LEFT JOIN ASSET a ON pm.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        WHERE pm.PM_ID = ?
      `, [pmId]);

      if (pmRows.length === 0) return null;

      const pmData = pmRows[0];

      // Get checklist results
      pmData.checklist_results = await this.getResultsByPMId(pmId);

      return pmData;
    } catch (error) {
      console.error('Error in PMaintenance.getDetailedPM:', error);
      throw error;
    }
  }

  // Get PM data with checklist results grouped by category
  static async getPMWithChecklistByCustomerAndBranch(customerId, branch) {
    try {
      // First get all PM records for this customer and branch
      const [pmRows] = await pool.execute(`
        SELECT 
          pm.PM_ID,
          pm.Asset_ID,
          pm.PM_Date,
          pm.Remarks as PM_Remarks,
          pm.Status as PM_Status,
          a.Asset_Serial_Number,
          a.Asset_Tag_ID,
          a.Item_Name,
          c.Category_ID,
          c.Category,
          m.Model,
          r.Recipient_Name,
          r.Department
        FROM PMAINTENANCE pm
        LEFT JOIN ASSET a ON pm.Asset_ID = a.Asset_ID
        LEFT JOIN CATEGORY c ON a.Category_ID = c.Category_ID
        LEFT JOIN MODEL m ON a.Model_ID = m.Model_ID
        LEFT JOIN RECIPIENTS r ON a.Recipients_ID = r.Recipients_ID
        LEFT JOIN INVENTORY i ON a.Asset_ID = i.Asset_ID
        LEFT JOIN CUSTOMER cust ON i.Customer_ID = cust.Customer_ID
        WHERE cust.Customer_ID = ? AND cust.Branch = ?
        ORDER BY c.Category, a.Asset_Tag_ID
      `, [customerId, branch]);

      // For each PM record, get its checklist results
      const pmWithChecklists = await Promise.all(
        pmRows.map(async (pm) => {
          const [checklistResults] = await pool.execute(`
            SELECT 
              pmr.PM_Result_ID,
              pmr.Checklist_ID,
              pmr.Is_OK_bool,
              pmr.Remarks,
              pmc.Check_Item,
              pmc.Category_ID
            FROM PM_RESULT pmr
            LEFT JOIN PM_CHECKLIST pmc ON pmr.Checklist_ID = pmc.Checklist_ID
            WHERE pmr.PM_ID = ?
            ORDER BY pmc.Checklist_ID
          `, [pm.PM_ID]);

          return {
            ...pm,
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
          Check_Item
        FROM PM_CHECKLIST
        WHERE Category_ID = ?
        ORDER BY Checklist_ID
      `, [categoryId]);
      return rows;
    } catch (error) {
      console.error('Error in PMaintenance.getAllChecklistItemsByCategory:', error);
      throw error;
    }
  }
}

module.exports = PMaintenance;
