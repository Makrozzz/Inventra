import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Assets from './pages/Assets';
import PreventiveMaintenance from './pages/PreventiveMaintenance';
import AccountSettings from './pages/AccountSettings';
import AddAsset from './pages/AddAsset';
import EditAsset from './pages/EditAsset';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Configuration - Using working remote API
  const API_BASE = 'https://www.ivms2006.com/api';

  // Fetch assets from API
  const fetchAssets = async () => {
    console.log('🔄 Starting API call to:', `${API_BASE}/getProducts.php`);
    
    try {
      const response = await fetch(`${API_BASE}/getProducts.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors' // Explicitly enable CORS
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawText = await response.text();
      console.log('📦 Raw API Response:', rawText);
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from API');
      }
      
      console.log('📦 Parsed API Response data:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log('✅ API call successful, products found:', data.data.length);
        
        // Map API data to match existing asset structure
        const mappedAssets = data.data.map(product => ({
          id: product.id || product.ID,
          name: product.name || product.NAME || product.product_name,
          category: product.category || 'Electronics', // Default category
          status: (product.quantity || product.QUANTITY) > 0 ? 'Active' : 'Out of Stock',
          location: product.location || 'Warehouse', // Default location
          value: parseFloat(product.price || product.PRICE || 0),
          quantity: parseInt(product.quantity || product.QUANTITY || 0)
        }));
        
        setAssets(mappedAssets);
        console.log('✅ Assets updated with API data:', mappedAssets.length, 'items');
      } else {
        console.log('⚠️ API returned success: false or no data array');
        console.log('⚠️ Using fallback data due to API structure issue');
        throw new Error('API returned invalid data structure');
      }
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
      console.error('❌ Error details:', error.message);
      
      // Fallback to mock data if API fails
      console.log('🔄 Using fallback mock data');
      setAssets([
        { id: 1, name: 'Laptop Dell XPS', category: 'Electronics', status: 'Active', location: 'Office A', value: 1200, quantity: 5 },
        { id: 2, name: 'Office Chair', category: 'Furniture', status: 'Active', location: 'Office B', value: 300, quantity: 12 },
        { id: 3, name: 'Printer HP LaserJet', category: 'Electronics', status: 'Maintenance', location: 'Office A', value: 450, quantity: 2 },
        { id: 4, name: 'Monitor Samsung 24"', category: 'Electronics', status: 'Active', location: 'Office C', value: 280, quantity: 8 },
        { id: 5, name: 'Desk Lamp', category: 'Furniture', status: 'Active', location: 'Office A', value: 45, quantity: 15 }
      ]);
    } finally {
      console.log('⏰ API call completed, loading set to false');
      setLoading(false);
    }
  };

  // Fetch assets when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAssets([]);
    setLoading(true);
  };

  const addAsset = (asset) => {
    const newAsset = { ...asset, id: Date.now() };
    setAssets([...assets, newAsset]);
  };

  const updateAsset = (id, updatedAsset) => {
    setAssets(assets.map(asset => asset.id === parseInt(id) ? { ...updatedAsset, id: parseInt(id) } : asset));
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/assets" element={<Assets assets={assets} onDelete={deleteAsset} loading={loading} />} />
            <Route path="/maintenance" element={<PreventiveMaintenance assets={assets} />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/add-asset" element={<AddAsset onAdd={addAsset} />} />
            <Route path="/edit-asset/:id" element={<EditAsset assets={assets} onUpdate={updateAsset} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;