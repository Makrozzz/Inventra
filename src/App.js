import React, { useState } from 'react';
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
  const [assets, setAssets] = useState([
    { id: 1, name: 'Laptop Dell XPS', category: 'Electronics', status: 'Active', location: 'Office A', value: 1200 },
    { id: 2, name: 'Office Chair', category: 'Furniture', status: 'Active', location: 'Office B', value: 300 },
    { id: 3, name: 'Printer HP LaserJet', category: 'Electronics', status: 'Maintenance', location: 'Office A', value: 450 },
    { id: 4, name: 'Monitor Samsung 24"', category: 'Electronics', status: 'Active', location: 'Office C', value: 280 },
    { id: 5, name: 'Desk Lamp', category: 'Furniture', status: 'Active', location: 'Office A', value: 45 }
  ]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
            <Route path="/" element={<Dashboard assets={assets} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/assets" element={<Assets assets={assets} onDelete={deleteAsset} />} />
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