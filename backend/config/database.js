const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config({ path: __dirname + '/../.env' });

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventra_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    console.log('Attempting to connect to DB with config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    logger.info('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', {
      query: query.substring(0, 100) + '...',
      error: error.message
    });
    throw error;
  }
};

// Get database connection
const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    logger.error('Failed to get database connection:', error.message);
    throw error;
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('❌ Database connection failed. Please check your credentials in .env file');
    console.log('Current config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '[SET]' : '[EMPTY]'
    });
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Verify MySQL server is running');
    console.log('2. Check username and password in backend/.env');
    console.log('3. Ensure database exists');
    console.log('4. Add your current IP (115.133.188.46) to cPanel Remote MySQL');
    
    console.log('\n⚠️ Server will continue with limited functionality...');
    console.log('Some API endpoints may not work without database connection.');
  }
};

module.exports = {
  pool,
  executeQuery,
  getConnection,
  testConnection,
  initializeDatabase
};