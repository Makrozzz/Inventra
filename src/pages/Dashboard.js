import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Users, TrendingUp, BarChart3 } from 'lucide-react';

const Dashboard = ({ assets, customers = [] }) => {
  const totalAssets = assets.length;
  const totalCustomers = customers.length || 12; // Default value for demo
  const activeAssets = assets.filter(asset => asset.status === 'Active').length;
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  // Mock customer data for the chart
  const customerAssetData = [
    { customer: 'ABC Corp', devices: 15 },
    { customer: 'XYZ Ltd', devices: 8 },
    { customer: 'Tech Solutions', devices: 12 },
    { customer: 'Global Systems', devices: 20 },
    { customer: 'Innovation Co', devices: 6 }
  ];

  const maxDevices = Math.max(...customerAssetData.map(item => item.devices));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="actions">
          <Link to="/add-asset" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '5px' }} />
            Add New Asset
          </Link>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{totalAssets}</div>
            <div className="stat-label">Total Assets</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{activeAssets}</div>
            <div className="stat-label">Active Assets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">${totalValue.toLocaleString()}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="card">
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} />
            Device Analysis by Customer
          </h2>
          <div className="chart-container">
            {customerAssetData.map((item, index) => (
              <div key={index} className="chart-bar-item">
                <div className="chart-bar-info">
                  <span className="customer-name">{item.customer}</span>
                  <span className="device-count">{item.devices} devices</span>
                </div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ 
                      width: `${(item.devices / maxDevices) * 100}%`,
                      backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Recent Assets</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 5).map(asset => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>
                    <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>{asset.location}</td>
                  <td>${asset.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link to="/assets" className="btn btn-secondary">
              View All Assets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;