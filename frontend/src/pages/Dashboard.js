import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Users, TrendingUp, BarChart3 } from 'lucide-react';
import apiService from '../services/apiService';
import './Dashboard.css';

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
      <div className="dashboard-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Error: {error}</div>
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
    <div className="dashboard-container">
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
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">
              <BarChart3 size={24} className="chart-icon" />
              Device Analysis by Customer
            </h2>
          </div>
          <div className="chart-container">
            {customerAssetData && customerAssetData.length > 0 ? (
              customerAssetData.map((item, index) => (
                <div key={index} className="chart-bar-item" style={{ '--index': index }}>
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
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No customer data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">
              <Package size={24} className="chart-icon" />
              Recent Assets
            </h2>
          </div>

          {recentAssets && recentAssets.length > 0 ? (
            <div className="recent-assets-grid">
              {recentAssets.slice(0, 6).map((asset, index) => (
                <div key={asset.id} className="recent-asset-card" style={{ '--index': index }}>
                  <div className="asset-header">
                    <h3 className="asset-name">{asset.name}</h3>
                    <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="asset-details">
                    <div className="asset-detail">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{asset.category}</span>
                    </div>
                    <div className="asset-detail">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{asset.location}</span>
                    </div>
                    <div className="asset-detail">
                      <span className="detail-label">Serial:</span>
                      <span className="detail-value">{asset.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <p>No recent assets available</p>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
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