/**
 * Mock database service for development when MySQL is not available
 */

class MockDatabase {
  constructor() {
    this.users = [
      {
        user_id: 1,
        username: 'admin',
        email: 'admin@inventra.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: 2,
        username: 'manager',
        email: 'manager@inventra.com',
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    this.assets = [
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
      }
    ];
  }

  async executeQuery(query, params = []) {
    console.log('Mock DB Query:', query.substring(0, 100) + '...');
    
    // Simple query matching for testing
    if (query.includes('SELECT') && query.includes('users')) {
      return this.users;
    }
    
    if (query.includes('SELECT') && query.includes('ASSET')) {
      return this.assets;
    }
    
    if (query.includes('SELECT COUNT')) {
      return [{ total: this.assets.length }];
    }
    
    // For other queries, return empty result
    return [];
  }

  async testConnection() {
    console.log('✅ Mock database connected successfully');
    return true;
  }

  async initializeDatabase() {
    console.log('✅ Mock database initialized');
    return true;
  }

  async getConnection() {
    return {
      release: () => console.log('Mock connection released'),
      query: this.executeQuery.bind(this)
    };
  }
}

const mockDb = new MockDatabase();

module.exports = {
  pool: null,
  executeQuery: mockDb.executeQuery.bind(mockDb),
  getConnection: mockDb.getConnection.bind(mockDb),
  testConnection: mockDb.testConnection.bind(mockDb),
  initializeDatabase: mockDb.initializeDatabase.bind(mockDb)
};