/**
 * Database initialization script
 * This script helps set up the database correctly regardless of MySQL configuration
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { executeQuery, initializeDatabase } = require('../config/database');

// Get database connection info from .env or default values
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

/**
 * Create the database if it doesn't exist
 */
async function createDatabase() {
  console.log('Attempting to create database...');
  try {
    // Connect without database selected
    const connection = await mysql.createConnection(dbConfig);
    
    const dbName = process.env.DB_NAME || 'inventra_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or already exists`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    return false;
  }
}

/**
 * Run migrations but skip existing tables
 */
async function runMigrationsSafely() {
  console.log('Running migrations safely...');
  try {
    await initializeDatabase();
    
    // Get list of existing tables
    const tables = await executeQuery('SHOW TABLES');
    const existingTables = tables.map(table => Object.values(table)[0].toLowerCase());
    console.log('Existing tables:', existingTables);
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Split migration into individual statements
    const statements = migration.split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim());
    
    // Execute each statement, but skip CREATE TABLE if table exists
    for (const statement of statements) {
      try {
        // Check if this is a CREATE TABLE statement
        const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1].toLowerCase();
          if (existingTables.includes(tableName)) {
            console.log(`⏭️ Skipping existing table: ${tableName}`);
            continue;
          }
        }
        
        await executeQuery(statement);
        console.log('✅ Executed statement successfully');
      } catch (error) {
        console.error('❌ Failed to execute statement:', error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('✅ Migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    return false;
  }
}

/**
 * Initialize the database
 */
async function initDb() {
  console.log('🔧 Initializing database...');
  
  // Step 1: Create database if it doesn't exist
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.error('❌ Failed to create database. Please check your MySQL credentials.');
    process.exit(1);
  }
  
  // Step 2: Run migrations safely
  const migrationsRun = await runMigrationsSafely();
  if (!migrationsRun) {
    console.error('❌ Failed to run migrations. Your database may be incomplete.');
    process.exit(1);
  }
  
  console.log('✅ Database initialized successfully');
  console.log('ℹ️ To seed the database with sample data, run: npm run seed');
}

// Run if called directly
if (require.main === module) {
  initDb().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = {
  initDb,
  createDatabase,
  runMigrationsSafely
};