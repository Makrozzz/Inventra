// API Service for handling all API calls
class ApiService {
  constructor() {
    // Use Node.js backend
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  // Generic method to handle API requests
  async makeRequest(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const url = `${this.baseURL}/${endpoint}`;
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      return {
        data: data.data,
        meta: data.meta,
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.makeRequest('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.makeRequest('auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.makeRequest('auth/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Dashboard specific methods
  async getDashboardData() {
    return this.makeRequest('assets/statistics');
  }

  // Asset methods
  async getAllAssets(page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    return this.makeRequest(`assets?${queryParams}`);
  }

  async getAsset(serialNumber) {
    return this.makeRequest(`assets/${serialNumber}`);
  }

  async createAsset(assetData) {
    return this.makeRequest('assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
  }

  async updateAsset(serialNumber, assetData) {
    return this.makeRequest(`assets/${serialNumber}`, {
      method: 'PUT',
      body: JSON.stringify(assetData)
    });
  }

  async deleteAsset(serialNumber) {
    return this.makeRequest(`assets/${serialNumber}`, {
      method: 'DELETE'
    });
  }

  async bulkImportAssets(assets) {
    return this.makeRequest('assets/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ assets })
    });
  }

  // Project methods
  async getAllProjects(page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    return this.makeRequest(`projects?${queryParams}`);
  }

  async getProject(projectId) {
    return this.makeRequest(`projects/${projectId}`);
  }

  async createProject(projectData) {
    return this.makeRequest('projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(projectId, projectData) {
    return this.makeRequest(`projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(projectId) {
    return this.makeRequest(`projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // Legacy methods for backward compatibility (now pointing to Node backend)
  async getProducts() {
    return this.getAllAssets();
  }

  async getProjects() {
    return this.getAllProjects();
  }

  // Inventory methods
  async getInventoryByProject(projectId) {
    return this.makeRequest(`inventory/project/${projectId}`);
  }

  async updateInventoryWithAsset(projectId, customerId, assetId) {
    return this.makeRequest('inventory/update-asset', {
      method: 'POST',
      body: JSON.stringify({ projectId, customerId, assetId })
    });
  }

  // Customer methods
  async getCustomersByProject(projectId) {
    return this.makeRequest(`customers/project/${projectId}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;