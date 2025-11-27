import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AddProject from './pages/AddProject';
import EditProject from './pages/EditProject';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import PreventiveMaintenance from './pages/PreventiveMaintenance';
import PMDetail from './pages/PMDetail';
import AccountSettings from './pages/AccountSettings';
import AuditLog from './pages/AuditLog';
import SolutionPrincipal from './pages/SolutionPrincipal';
import AddAsset from './pages/AddAsset';
import EditAsset from './pages/EditAsset';
import DatabaseTest from './components/DatabaseTest';
import apiService from './services/apiService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
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
        <Sidebar onLogout={handleLogout} onMinimizeChange={setIsSidebarMinimized} />
        <main className="main-content" style={{
          marginLeft: isSidebarMinimized ? '80px' : '250px',
          width: isSidebarMinimized ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
          transition: 'margin-left 0.3s ease, width 0.3s ease'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/add" element={<AddProject />} />
            <Route path="/projects/edit/:id" element={<EditProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/assets" element={<Assets onDelete={deleteAsset} />} />
            <Route path="/asset-detail/:assetId" element={<AssetDetail />} />
            <Route path="/maintenance" element={<PreventiveMaintenance assets={assets} />} />
            <Route path="/maintenance/detail/:pmId" element={<PMDetail />} />
            <Route path="/solution-principal" element={<SolutionPrincipal />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/audit-log" element={<AuditLog />} />
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