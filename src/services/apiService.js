// API Service for handling all API calls
class ApiService {
  constructor() {
    // For local testing, use mock server
    // Change to 'http://localhost:8080/api' for testing
    this.baseURL = 'https://www.ivms2006.com/api';
  }

  // Generic method to handle API requests
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}/${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Dashboard specific methods
  async getDashboardData() {
    return this.makeRequest('getDashboardData.php');
  }

  // Products/Assets methods
  async getProducts() {
    return this.makeRequest('getProducts.php');
  }

  // Get all assets with complete database attributes
  async getAllAssets() {
    try {
      // First try the new complete API
      return await this.makeRequest('getAllAssets.php');
    } catch (error) {
        console.warn('getAllAssets.php not available, falling back to getProducts.php:', error);
        // Fallback to existing API with enhanced structure
        const products = await this.makeRequest('getProducts.php');      // Mock column structure based on existing data
      const mockColumns = [
        { Field: 'id', Type: 'varchar(255)' },
        { Field: 'name', Type: 'varchar(255)' },
        { Field: 'accessories', Type: 'text' }, 
        { Field: 'status', Type: 'varchar(50)' },
        { Field: 'price', Type: 'decimal(10,2)' },
        { Field: 'quantity', Type: 'int(11)' }
      ];
      
      return {
        data: products,
        columns: mockColumns,
        count: products.length
      };
    }
  }

  // Projects methods
  async getProjects() {
    return this.makeRequest('getProjects.php');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;