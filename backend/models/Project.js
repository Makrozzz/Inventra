

const { pool } = require('../config/database');

class Project {
  constructor(project) {
    this.Project_ID = project.Project_ID;
    this.Project_Ref_Number = project.Project_Ref_Number;
    this.Project_Title = project.Project_Title;
    this.Solution_Principal = project.Solution_Principal;
    this.Warranty = project.Warranty;
    this.Preventive_Maintenance = project.Preventive_Maintenance;
    this.Start_Date = project.Start_Date;
    this.End_Date = project.End_Date;
  }

  // Get all projects
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Project_ID,
          Project_Ref_Number,
          Project_Title,
          Solution_Principal,
          Warranty,
          Preventive_Maintenance,
          Start_Date,
          End_Date
        FROM PROJECT
        ORDER BY Project_ID DESC
      `);
      return rows.map(row => new Project(row));
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
          Solution_Principal,
          Warranty,
          Preventive_Maintenance,
          Start_Date,
          End_Date
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

  // Create new project
  static async create(projectData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO PROJECT (Project_Ref_Number, Project_Title, Solution_Principal, Warranty, Preventive_Maintenance, Start_Date, End_Date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          projectData.Project_Ref_Number,
          projectData.Project_Title,
          projectData.Solution_Principal,
          projectData.Warranty,
          projectData.Preventive_Maintenance,
          projectData.Start_Date,
          projectData.End_Date
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
         Solution_Principal = ?, 
         Warranty = ?, 
         Preventive_Maintenance = ?, 
         Start_Date = ?, 
         End_Date = ?
         WHERE Project_ID = ?`,
        [
          this.Project_Ref_Number,
          this.Project_Title,
          this.Solution_Principal,
          this.Warranty,
          this.Preventive_Maintenance,
          this.Start_Date,
          this.End_Date,
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