const { pool } = require('../config/database');

class Customer {
  constructor(customer) {
    this.Customer_ID = customer.Customer_ID;
    this.Customer_Ref_Number = customer.Customer_Ref_Number;
    this.Customer_Name = customer.Customer_Name;
    this.Branch = customer.Branch;
  }

  /**
   * Create multiple customer records (one for each branch)
   * @param {number} projectId - Project ID
   * @param {string} customerRefNumber - Customer reference number
   * @param {string} customerName - Customer name
   * @param {string[]} branches - Array of branch names
   * @returns {Promise<number[]>} - Array of created Customer_IDs
   */
  static async createMultipleBranches(projectId, customerRefNumber, customerName, branches) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const customerIds = [];
      
      // Create a customer record for each branch
      for (const branch of branches) {
        const [result] = await connection.execute(
          `INSERT INTO CUSTOMER (Project_ID, Customer_Ref_Number, Customer_Name, Branch) 
           VALUES (?, ?, ?, ?)`,
          [projectId, customerRefNumber, customerName, branch]
        );
        
        customerIds.push(result.insertId);
        console.log(`Created customer record: ID ${result.insertId}, Project_ID: ${projectId}, Branch: ${branch}`);
      }
      
      await connection.commit();
      return customerIds;
    } catch (error) {
      await connection.rollback();
      console.error('Error in Customer.createMultipleBranches:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all customers
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Customer_ID,
          Customer_Ref_Number,
          Customer_Name,
          Branch
        FROM CUSTOMER
        ORDER BY Customer_Ref_Number, Branch
      `);
      return rows.map(row => new Customer(row));
    } catch (error) {
      console.error('Error in Customer.findAll:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Customer_ID,
          Customer_Ref_Number,
          Customer_Name,
          Branch
        FROM CUSTOMER
        WHERE Customer_ID = ?
      `, [id]);
      
      if (rows.length > 0) {
        return new Customer(rows[0]);
      }
      return null;
    } catch (error) {
      console.error('Error in Customer.findById:', error);
      throw error;
    }
  }

  /**
   * Get all branches for a customer reference number
   */
  static async getBranchesByRefNumber(refNumber) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          Customer_ID,
          Customer_Ref_Number,
          Customer_Name,
          Branch
        FROM CUSTOMER
        WHERE Customer_Ref_Number = ?
        ORDER BY Branch
      `, [refNumber]);
      
      return rows.map(row => new Customer(row));
    } catch (error) {
      console.error('Error in Customer.getBranchesByRefNumber:', error);
      throw error;
    }
  }

  /**
   * Get all branches for a customer name
   */
  static async findBranchesByCustomerName(customerName) {
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT
          Customer_ID,
          Customer_Ref_Number,
          Customer_Name,
          Branch
        FROM CUSTOMER
        WHERE Customer_Name = ?
        ORDER BY Branch
      `, [customerName]);
      
      return rows.map(row => ({
        Customer_ID: row.Customer_ID,
        Customer_Ref_Number: row.Customer_Ref_Number,
        Customer_Name: row.Customer_Name,
        Branch: row.Branch
      }));
    } catch (error) {
      console.error('Error in Customer.findBranchesByCustomerName:', error);
      throw error;
    }
  }

  /**
   * Delete customer by ID
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM CUSTOMER WHERE Customer_ID = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Customer.delete:', error);
      throw error;
    }
  }
}

module.exports = Customer;
