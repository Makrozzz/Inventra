

const { pool } = require('../config/database');

class Project {
  constructor(project) {
    this.Project_ID = project.Project_ID;
    this.Project_Ref_Number = project.Project_Ref_Number;
    this.Project_Title = project.Project_Title;
    this.Warranty = project.Warranty;
    this.Preventive_Maintenance = project.Preventive_Maintenance;
    this.Start_Date = project.Start_Date;
    this.End_Date = project.End_Date;
    this.Antivirus = project.Antivirus;
  }

  // Get all projects with customer information from INVENTORY table
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          p.Warranty,
          p.Preventive_Maintenance,
          p.Start_Date,
          p.End_Date,
          p.Antivirus,
          c.Customer_Name,
          c.Customer_Ref_Number
        FROM PROJECT p
        LEFT JOIN INVENTORY i ON p.Project_ID = i.Project_ID
        LEFT JOIN CUSTOMER c ON i.Customer_ID = c.Customer_ID
        GROUP BY p.Project_ID
        ORDER BY p.Project_ID DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error in Project.findAll:', error);
      throw error;
    }
  }

  // Get project by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Project_ID,
          Project_Ref_Number,
          Project_Title,
          Warranty,
          Preventive_Maintenance,
          Start_Date,
          End_Date,
          Antivirus
        FROM PROJECT
        WHERE Project_ID = ?
      `, [id]);
      
      if (rows.length > 0) {
        return new Project(rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error in Project.findById:', error);
      throw error;
    }
  }

  // Get project by reference number with customer data from INVENTORY
  static async findByReferenceWithCustomer(refNum) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.Project_ID,
          p.Project_Ref_Number,
          p.Project_Title,
          p.Warranty,
          p.Preventive_Maintenance,
          p.Start_Date,
          p.End_Date,
          p.Antivirus,
          c.Customer_Name,
          c.Customer_Ref_Number
        FROM PROJECT p
        LEFT JOIN INVENTORY i ON p.Project_ID = i.Project_ID
        LEFT JOIN CUSTOMER c ON i.Customer_ID = c.Customer_ID
        WHERE p.Project_Ref_Number = ?
        GROUP BY p.Project_ID
        LIMIT 1
      `, [refNum]);
      
      if (rows.length > 0) {
        return rows[0];
      }
      return null;
    } catch (error) {
      console.error('Error in Project.findByReferenceWithCustomer:', error);
      throw error;
    }
  }

  // Create new project
  static async create(projectData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO PROJECT (Project_Ref_Number, Project_Title, Warranty, Preventive_Maintenance, Start_Date, End_Date, Antivirus) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          projectData.Project_Ref_Number,
          projectData.Project_Title,
          projectData.Warranty,
          projectData.Preventive_Maintenance,
          projectData.Start_Date,
          projectData.End_Date,
          projectData.Antivirus || null
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error in Project.create:', error);
      throw error;
    }
  }

  // Update project
  async update() {
    try {
      await pool.execute(
        `UPDATE PROJECT SET 
         Project_Ref_Number = ?, 
         Project_Title = ?, 
         Warranty = ?, 
         Preventive_Maintenance = ?, 
         Start_Date = ?, 
         End_Date = ?,
         Antivirus = ?
         WHERE Project_ID = ?`,
        [
          this.Project_Ref_Number,
          this.Project_Title,
          this.Warranty,
          this.Preventive_Maintenance,
          this.Start_Date,
          this.End_Date,
          this.Antivirus,
          this.Project_ID
        ]
      );
      return this;
    } catch (error) {
      console.error('Error in Project.update:', error);
      throw error;
    }
  }

  // Delete project
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM PROJECT WHERE Project_ID = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Project.delete:', error);
      throw error;
    }
  }

  // Get project statistics
  static async getStatistics() {
    try {
      const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM PROJECT');
      const [activeResult] = await pool.execute('SELECT COUNT(*) as active FROM PROJECT WHERE End_Date >= CURDATE()');
      
      return {
        total: totalResult[0].total,
        active: activeResult[0].active,
        completed: totalResult[0].total - activeResult[0].active
      };
    } catch (error) {
      console.error('Error in Project.getStatistics:', error);
      // Return fallback data if database query fails
      return {
        total: 0,
        active: 0,
        completed: 0
      };
    }
  }
}

module.exports = Project;