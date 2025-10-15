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
import DatabaseTest from './components/DatabaseTest';
import apiService from './services/apiService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for testing
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAssets([]);
    setLoading(true);
  };

  const addAsset = async (assetData) => {
    try {
      const response = await apiService.createAsset(assetData);
      console.log('Asset created:', response);
      // Refresh assets list or add to local state
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const updateAsset = async (serialNumber, assetData) => {
    try {
      const response = await apiService.updateAsset(serialNumber, assetData);
      console.log('Asset updated:', response);
      // Refresh assets list or update local state
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const deleteAsset = async (serialNumber) => {
    try {
      const response = await apiService.deleteAsset(serialNumber);
      console.log('Asset deleted:', response);
      // Refresh assets list or remove from local state
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
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
            <Route path="/assets" element={<Assets onDelete={deleteAsset} />} />
            <Route path="/maintenance" element={<PreventiveMaintenance assets={assets} />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/add-asset" element={<AddAsset onAdd={addAsset} />} />
            <Route path="/edit-asset/:id" element={<EditAsset assets={assets} onUpdate={updateAsset} />} />
            <Route path="/db-test" element={<DatabaseTest />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;