import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Users, TrendingUp, BarChart3 } from 'lucide-react';
import apiService from '../services/apiService';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getDashboardData();
        
        console.log('Dashboard API Response:', response); // Debug log
        
        // Handle the statistics response structure
        if (response && response.success && response.data) {
          const stats = response.data;
          
          // Transform the backend statistics to match frontend expectations
          const dashboardData = {
            stats: {
              totalAssets: stats.total || 0,
              activeAssets: stats.byStatus?.find(s => s.status === 'Active')?.count || 0,
              totalCustomers: stats.totalProjects || 0, // 1 project = 1 customer
              totalValue: 0 // Will be calculated from asset prices
            },
            customerAssetData: stats.byCategory?.map((cat, index) => ({
              customer: cat.category,
              devices: cat.count.toString()
            })) || [],
            recentAssets: stats.recent?.map(asset => ({
              id: asset.serialNumber || 'N/A',
              name: asset.assetModelName || 'Unknown',
              category: asset.assetCategory || 'Unknown',
              status: asset.assetStatus || 'Unknown',
              location: asset.assetLocation || 'Unknown',
              value: 0 // No price in current database structure
            })) || []
          };
          
          setDashboardData(dashboardData);
        } else {
          console.warn('Unexpected dashboard response structure:', response);
          setDashboardData({
            stats: { totalAssets: 0, activeAssets: 0, totalCustomers: 0, totalValue: 0 },
            customerAssetData: [],
            recentAssets: []
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data. Make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ color: 'red' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const { stats, customerAssetData, recentAssets } = dashboardData || {};
  const { totalAssets = 0, activeAssets = 0, totalCustomers = 0, totalValue = 0 } = stats || {};

  const maxDevices = customerAssetData?.length > 0 
    ? Math.max(...customerAssetData.map(item => parseInt(item.devices))) 
    : 0;

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
            {customerAssetData && customerAssetData.length > 0 ? (
              customerAssetData.map((item, index) => (
                <div key={index} className="chart-bar-item">
                  <div className="chart-bar-info">
                    <span className="customer-name">{item.customer}</span>
                    <span className="device-count">{item.devices} devices</span>
                  </div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${(parseInt(item.devices) / maxDevices) * 100}%`,
                        backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666' }}>No customer data available</div>
            )}
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
              {recentAssets && recentAssets.length > 0 ? (
                recentAssets.map(asset => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td>{asset.category}</td>
                    <td>
                      <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>{asset.location}</td>
                    <td>${parseInt(asset.value).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>
                    No assets available
                  </td>
                </tr>
              )}
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