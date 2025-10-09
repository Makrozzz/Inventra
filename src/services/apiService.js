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

  // Projects methods
  async getProjects() {
    return this.makeRequest('getProjects.php');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;