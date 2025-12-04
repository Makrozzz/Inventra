/**
 * Authentication utility functions
 */

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Get the current auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Handle token expiration - clear storage and redirect to login
 */
export const handleTokenExpiration = (message = 'Your session has expired. Please login again.') => {
  console.error('🔐 Token expired or invalid - logging out');
  localStorage.clear();
  alert(message);
  window.location.href = '/login';
};

/**
 * Check if response indicates token expiration
 */
export const isTokenExpired = (response) => {
  return response.status === 401 || response.status === 403;
};

/**
 * Handle API response with automatic token expiration detection
 * @param {Response} response - Fetch API response object
 * @returns {Promise} - Parsed JSON response
 */
export const handleAuthResponse = async (response) => {
  // Check for token expiration
  if (isTokenExpired(response)) {
    handleTokenExpiration();
    throw new Error('Token expired');
  }

  const data = await response.json();
  
  // Check if response message indicates token issues
  if (!data.success && data.message) {
    const tokenKeywords = ['token', 'expired', 'unauthorized', 'authentication'];
    const hasTokenIssue = tokenKeywords.some(keyword => 
      data.message.toLowerCase().includes(keyword)
    );
    
    if (hasTokenIssue) {
      handleTokenExpiration();
      throw new Error('Token expired');
    }
  }
  
  return data;
};

/**
 * Make authenticated API request with automatic token handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - API response data
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    handleTokenExpiration('Please login to continue.');
    throw new Error('No auth token');
  }
  
  // Add auth header
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return await handleAuthResponse(response);
  } catch (error) {
    // If error message contains token-related keywords, handle expiration
    if (error.message && error.message.toLowerCase().includes('token')) {
      handleTokenExpiration();
    }
    throw error;
  }
};

/**
 * Logout user - clear storage and redirect to login
 */
export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};
