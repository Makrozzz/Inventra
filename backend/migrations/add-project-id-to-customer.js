const { pool } = require('../config/database');

async function addProjectIdToCustomer() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting migration: Add Project_ID to CUSTOMER table');
    
    // Check if column already exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM CUSTOMER LIKE 'Project_ID'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Project_ID column already exists in CUSTOMER table');
      return;
    }
    
    // Add Project_ID column
    await connection.execute(`
      ALTER TABLE CUSTOMER
      ADD COLUMN Project_ID int(11) DEFAULT NULL AFTER Customer_ID
    `);
    console.log('✅ Added Project_ID column to CUSTOMER table');
    
    // Add foreign key constraint
    await connection.execute(`
      ALTER TABLE CUSTOMER
      ADD CONSTRAINT fk_customer_project
      FOREIGN KEY (Project_ID) REFERENCES PROJECT(Project_ID)
      ON DELETE CASCADE
    `);
    console.log('✅ Added foreign key constraint for Project_ID');
    
    // Update existing CUSTOMER record to link with PROJECT
    // Based on the data, Customer_ID=1 (NADMA) should link to Project_ID=1
    await connection.execute(`
      UPDATE CUSTOMER
      SET Project_ID = 1
      WHERE Customer_ID = 1
    `);
    console.log('✅ Updated existing CUSTOMER record with Project_ID');
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run migration
addProjectIdToCustomer()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
