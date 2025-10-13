const { executeQuery, initializeDatabase } = require('../../config/database');
const { hashPassword } = require('../../utils/helpers');
const logger = require('../../utils/logger');

async function seedUsers() {
  try {
    logger.info('Seeding users...');
    
    const adminPassword = await hashPassword('Admin123!');
    const managerPassword = await hashPassword('Manager123!');
    const userPassword = await hashPassword('User123!');

    const users = [
      {
        username: 'admin',
        email: 'admin@inventra.com',
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      },
      {
        username: 'manager',
        email: 'manager@inventra.com',
        password_hash: managerPassword,
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager'
      },
      {
        username: 'user',
        email: 'user@inventra.com',
        password_hash: userPassword,
        first_name: 'Regular',
        last_name: 'User',
        role: 'user'
      }
    ];

    for (const user of users) {
      await executeQuery(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.username, user.email, user.password_hash, user.first_name, user.last_name, user.role]
      );
    }

    logger.info('Users seeded successfully');
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}

async function seedAssets() {
  try {
    logger.info('Seeding sample assets...');

    const assets = [
      {
        serial_number: 'DEMO001',
        asset_model_name: 'Dell Latitude 7420',
        asset_model_desc: '14-inch Business Laptop',
        asset_manufacturer: 'Dell Technologies',
        asset_status: 'Available',
        asset_location: 'IT Storage Room',
        asset_category: 'Laptop',
        purchase_date: '2023-01-15',
        purchase_price: 1299.99,
        warranty_date: '2026-01-15',
        notes: 'High-performance business laptop'
      },
      {
        serial_number: 'DEMO002',
        asset_model_name: 'HP EliteDesk 800',
        asset_model_desc: 'Compact Desktop Computer',
        asset_manufacturer: 'HP Inc.',
        asset_status: 'In Use',
        asset_location: 'Office Floor 2',
        asset_category: 'Desktop',
        purchase_date: '2023-02-20',
        purchase_price: 899.99,
        warranty_date: '2026-02-20',
        assigned_to: 'John Smith',
        notes: 'Assigned to accounting department'
      },
      {
        serial_number: 'DEMO003',
        asset_model_name: 'iPhone 14 Pro',
        asset_model_desc: '256GB Smartphone',
        asset_manufacturer: 'Apple Inc.',
        asset_status: 'In Use',
        asset_location: 'Mobile Deployment',
        asset_category: 'Mobile Device',
        purchase_date: '2023-03-10',
        purchase_price: 1099.99,
        warranty_date: '2024-03-10',
        assigned_to: 'Sarah Johnson',
        notes: 'Company mobile device'
      },
      {
        serial_number: 'DEMO004',
        asset_model_name: 'Cisco Catalyst 2960',
        asset_model_desc: '24-Port Network Switch',
        asset_manufacturer: 'Cisco Systems',
        asset_status: 'In Use',
        asset_location: 'Server Room A',
        asset_category: 'Network Equipment',
        purchase_date: '2023-01-05',
        purchase_price: 450.00,
        warranty_date: '2025-01-05',
        notes: 'Main office network switch'
      },
      {
        serial_number: 'DEMO005',
        asset_model_name: 'Samsung 27" Monitor',
        asset_model_desc: '4K UHD Display Monitor',
        asset_manufacturer: 'Samsung Electronics',
        asset_status: 'Available',
        asset_location: 'IT Storage Room',
        asset_category: 'Monitor',
        purchase_date: '2023-04-12',
        purchase_price: 329.99,
        warranty_date: '2026-04-12',
        notes: 'Spare monitor for workstations'
      }
    ];

    for (const asset of assets) {
      await executeQuery(
        `INSERT INTO ASSET (
          Serial_Number, Asset_ModelName, Asset_ModelDesc, Asset_Manufacturer,
          Asset_Status, Asset_Location, Asset_Category, Purchase_Date,
          Purchase_Price, Warranty_Date, Assigned_To, Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.serial_number,
          asset.asset_model_name,
          asset.asset_model_desc,
          asset.asset_manufacturer,
          asset.asset_status,
          asset.asset_location,
          asset.asset_category,
          asset.purchase_date,
          asset.purchase_price,
          asset.warranty_date,
          asset.assigned_to || null,
          asset.notes
        ]
      );
    }

    logger.info('Sample assets seeded successfully');
  } catch (error) {
    logger.error('Error seeding assets:', error);
    throw error;
  }
}

async function seedProjects() {
  try {
    logger.info('Seeding sample projects...');

    const projects = [
      {
        project_name: 'Office Network Upgrade',
        project_description: 'Upgrading network infrastructure for main office',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        status: 'Active',
        manager_id: 2 // Manager user
      },
      {
        project_name: 'Laptop Refresh Program',
        project_description: 'Replacing aging laptops across the organization',
        start_date: '2024-02-15',
        end_date: '2024-06-30',
        status: 'Planning',
        manager_id: 2
      }
    ];

    for (const project of projects) {
      await executeQuery(
        `INSERT INTO projects (project_name, project_description, start_date, end_date, status, manager_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project.project_name,
          project.project_description,
          project.start_date,
          project.end_date,
          project.status,
          project.manager_id
        ]
      );
    }

    logger.info('Sample projects seeded successfully');
  } catch (error) {
    logger.error('Error seeding projects:', error);
    throw error;
  }
}

async function runSeeder() {
  try {
    logger.info('Starting database seeding...');
    
    // Initialize database connection
    await initializeDatabase();

    // Run seeders
    await seedUsers();
    await seedAssets();
    await seedProjects();

    logger.info('Database seeding completed successfully!');
    logger.info('Default login credentials:');
    logger.info('Admin: admin@inventra.com / Admin123!');
    logger.info('Manager: manager@inventra.com / Manager123!');
    logger.info('User: user@inventra.com / User123!');
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = {
  runSeeder,
  seedUsers,
  seedAssets,
  seedProjects
};