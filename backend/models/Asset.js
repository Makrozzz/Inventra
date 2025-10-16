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
}

module.exports = Asset;