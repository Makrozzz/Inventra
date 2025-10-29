// API Service for handling all API calls
class ApiService {
  constructor() {
    // Use Node.js backend
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    this.token = localStorage.getItem('authToken');
  }

  // Development helper - get a valid token for testing
  async setDevelopmentToken() {
    // Skipping token generation since login is in mock mode
    console.log('Token generation bypassed - login is in mock mode');
    return true;
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

  async updateAssetById(assetId, assetData) {
    return this.makeRequest(`assets/id/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(assetData)
    });
  }

  async getAssetById(assetId) {
    return this.makeRequest(`assets/id/${assetId}`);
  }

  // Direct methods for asset endpoints that don't follow the standard response format
  async updateAssetByIdDirect(assetId, assetData) {
    console.log('UpdateAssetByIdDirect - Bypassing authentication (mock mode)');
    
    const headers = {
      'Content-Type': 'application/json',
      // No authorization header since login is in mock mode
    };

    console.log('Request headers:', headers);
    console.log('Request URL:', `${this.baseURL}/assets/id/${assetId}`);
    console.log('Request body:', assetData);

    const url = `${this.baseURL}/assets/id/${assetId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(assetData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error response:', errorData);
      throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getAssetByIdDirect(assetId) {
    console.log('GetAssetByIdDirect - Bypassing authentication (mock mode)');
    
    const headers = {
      'Content-Type': 'application/json',
      // No authorization header since login is in mock mode
    };

    const url = `${this.baseURL}/assets/id/${assetId}`;
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
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

  // Enhanced project methods for Add Asset feature
  async getProjectByReference(refNum) {
    const headers = {
      'Content-Type': 'application/json',
      // Bypassing authentication for development
    };

    const url = `${this.baseURL}/projects/reference/${encodeURIComponent(refNum)}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getBranchesByCustomer(customerName) {
    const headers = {
      'Content-Type': 'application/json',
      // Bypassing authentication for development
    };

    const url = `${this.baseURL}/projects/branches/${encodeURIComponent(customerName)}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Enhanced asset creation with complete details
  async createAssetWithDetails(assetData) {
    const headers = {
      'Content-Type': 'application/json',
      // Bypassing authentication for development
    };

    console.log('Creating asset with details:', assetData);

    const url = `${this.baseURL}/assets/create-with-details`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(assetData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Methods to fetch dropdown data
  async getCategories() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const url = `${this.baseURL}/categories`;
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.warn('Categories endpoint not available, using fallback data');
      // Return fallback data if endpoint doesn't exist
      return {
        data: [
          { Category_ID: 1, Category: 'Desktop' },
          { Category_ID: 2, Category: 'Printer' },
          { Category_ID: 3, Category: 'Laptop' },
          { Category_ID: 4, Category: 'Server' }
        ]
      };
    }
  }

  async getModels() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const url = `${this.baseURL}/models`;
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch models');
      return await response.json();
    } catch (error) {
      console.warn('Models endpoint not available, using fallback data');
      // Return fallback data if endpoint doesn't exist
      return {
        data: [
          { Model_ID: 1, Model: 'Dell OptiPlex All-in-One Plus 7420' },
          { Model_ID: 2, Model: 'HP Color LaserJet Enterprise MFP M480f' },
          { Model_ID: 3, Model: 'Lenovo ThinkPad X1 Carbon' },
          { Model_ID: 4, Model: 'Dell PowerEdge R740' }
        ]
      };
    }
  }

  async getPeripheralTypes() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const url = `${this.baseURL}/peripheral-types`;
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch peripheral types');
      return await response.json();
    } catch (error) {
      console.warn('Peripheral types endpoint not available, using fallback data');
      // Return fallback data if endpoint doesn't exist
      return {
        data: [
          { Peripheral_Type_ID: 1, Peripheral_Type_Name: 'Keyboard' },
          { Peripheral_Type_ID: 2, Peripheral_Type_Name: 'Mouse' },
          { Peripheral_Type_ID: 3, Peripheral_Type_Name: 'Monitor' },
          { Peripheral_Type_ID: 4, Peripheral_Type_Name: 'Ethernet Cable' },
          { Peripheral_Type_ID: 5, Peripheral_Type_Name: 'Power Cable' }
        ]
      };
    }
  }

  async getRecipients() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const url = `${this.baseURL}/recipients`;
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch recipients');
      return await response.json();
    } catch (error) {
      console.warn('Recipients endpoint not available, returning empty array');
      return { data: [] };
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;