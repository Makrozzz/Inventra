const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAssetQuery() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  console.log('Testing database connection with config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Test 1: Check if ASSET table exists
    console.log('\n1. Checking if ASSET table exists...');
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('Available tables:', tables);

    // Test 2: Check table structure
    console.log('\n2. Checking ASSET table structure...');
    try {
      const [columns] = await connection.execute("DESCRIBE ASSET");
      console.log('ASSET table columns:', columns);
    } catch (error) {
      console.log('❌ ASSET table does not exist or error:', error.message);
      
      // Try alternative table names
      const possibleTables = ['asset', 'assets', 'Asset', 'Assets'];
      for (const tableName of possibleTables) {
        try {
          console.log(`\nTrying table name: ${tableName}`);
          const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
          console.log(`✅ Found table ${tableName}:`, columns);
          break;
        } catch (err) {
          console.log(`❌ Table ${tableName} not found`);
        }
      }
    }

    // Test 3: Try to select from ASSET table
    console.log('\n3. Trying to select from ASSET table...');
    try {
      const [rows] = await connection.execute("SELECT COUNT(*) as count FROM ASSET");
      console.log('Asset count:', rows[0].count);
      
      if (rows[0].count > 0) {
        const [sampleRows] = await connection.execute("SELECT * FROM ASSET LIMIT 5");
        console.log('Sample assets:', sampleRows);
      } else {
        console.log('⚠️ No assets found in the table');
      }
    } catch (error) {
      console.log('❌ Error querying ASSET table:', error.message);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testAssetQuery();