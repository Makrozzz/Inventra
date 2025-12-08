import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Users, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
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

          console.log('=== DASHBOARD DEBUG ===');
          console.log('stats.total:', stats.total);
          console.log('stats.byStatus:', stats.byStatus);
          console.log('stats.byCategory:', stats.byCategory);
          console.log('stats.byCustomer:', stats.byCustomer);
          console.log('stats.customersByCategory:', stats.customersByCategory);
          console.log('stats.totalProjects:', stats.totalProjects);

          // Find active assets with case-insensitive comparison
          const activeAssetCount = stats.byStatus?.find(s => 
            s.status && s.status.toUpperCase() === 'ACTIVE'
          )?.count || 0;

          console.log('Active asset count:', activeAssetCount);

          // Transform the backend statistics to match frontend expectations
          const dashboardData = {
            stats: {
              totalAssets: stats.total || 0,
              activeAssets: activeAssetCount,
              totalCustomers: stats.totalProjects || 0, // 1 project = 1 customer
              totalValue: 0 // Will be calculated from asset prices
            },
            customerAssetData: stats.byCategory?.map((cat, index) => ({
              customer: cat.category,
              devices: cat.count.toString()
            })) || [],
            customerDistribution: stats.byCustomer || [],
            customersByCategory: stats.customersByCategory || {},
            recentAssets: stats.recent?.map(asset => ({
              id: asset.serialNumber || 'N/A',
              name: asset.assetModelName || 'Unknown',
              category: asset.assetCategory || 'Unknown',
              status: asset.assetStatus || 'Unknown',
              location: asset.assetLocation || 'Unknown',
              value: 0 // No price in current database structure
            })) || []
          };

          console.log('Final dashboardData:', dashboardData);
          console.log('======================');

          setDashboardData(dashboardData);
        } else {
          console.warn('Unexpected dashboard response structure:', response);
          setDashboardData({
            stats: { totalAssets: 0, activeAssets: 0, totalCustomers: 0, totalValue: 0 },
            customerAssetData: [],
            customerDistribution: [],
            customersByCategory: {},
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
          <div className="error-icon"><AlertCircle size={48} /></div>
          <div className="error-text">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const { stats, customerAssetData, customerDistribution, customersByCategory, recentAssets } = dashboardData || {};
  const { totalAssets = 0, activeAssets = 0, totalCustomers = 0, totalValue = 0 } = stats || {};

  const maxDevices = customerAssetData?.length > 0
    ? Math.max(...customerAssetData.map(item => parseInt(item.devices)))
    : 0;

  // Find max total assets across all customers for scaling
  const maxCustomerAssets = customersByCategory && Object.keys(customersByCategory).length > 0
    ? Math.max(...Object.values(customersByCategory).map(c => c.total))
    : 0;

  // Dynamically generate category colors based on actual categories in the data
  const getCategoryColors = () => {
    if (!customersByCategory || Object.keys(customersByCategory).length === 0) {
      return {};
    }

    // Extract all unique categories from the data
    const uniqueCategories = new Set();
    Object.values(customersByCategory).forEach(customerData => {
      customerData.categories.forEach(cat => {
        uniqueCategories.add(cat.category);
      });
    });

    // Define a color palette
    const colorPalette = [
      '#60a5fa', // Light Blue
      '#34d399', // Green
      '#a78bfa', // Purple
      '#f87171', // Red
      '#fbbf24', // Yellow
      '#fb923c', // Orange
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#8b5cf6', // Violet
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#6366f1', // Indigo
      '#ef4444', // Rose
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#d946ef', // Fuchsia
    ];

    // Assign colors to categories
    const categoryColors = {};
    Array.from(uniqueCategories).sort().forEach((category, index) => {
      categoryColors[category] = colorPalette[index % colorPalette.length];
    });

    return categoryColors;
  };

  const categoryColors = getCategoryColors();

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

        {/* Customer Distribution Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">
              <Users size={24} className="chart-icon" />
              Customer Distribution
            </h2>
          </div>
          <div className="chart-container">
            {customersByCategory && Object.entries(customersByCategory).length > 0 ? (
              Object.entries(customersByCategory).map(([customerName, data], index) => (
                <div key={index} className="chart-bar-item" style={{ '--index': index }}>
                  <div className="chart-bar-info">
                    <span className="customer-name">{customerName}</span>
                    <span className="device-count">{data.total} {data.total === 1 ? 'asset' : 'assets'}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    width: '100%', 
                    height: '32px',
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    {data.categories.map((cat, catIndex) => {
                      const percentage = (cat.count / data.total) * 100;
                      const color = categoryColors[cat.category] || '#94a3b8';
                      return (
                        <div
                          key={catIndex}
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            minWidth: percentage > 0 ? '2px' : '0',
                            borderRight: catIndex < data.categories.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none'
                          }}
                          title={`${cat.category}: ${cat.count} assets (${percentage.toFixed(1)}%)`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.85';
                            e.currentTarget.style.transform = 'scaleY(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scaleY(1)';
                          }}
                        >
                          {percentage > 8 && (
                            <span style={{ 
                              color: 'white', 
                              fontSize: '11px', 
                              fontWeight: '700',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                              userSelect: 'none'
                            }}>
                              {cat.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <p>No customer distribution data available</p>
              </div>
            )}
            
            {/* Category Legend */}
            {customersByCategory && Object.keys(customersByCategory).length > 0 && Object.keys(categoryColors).length > 0 && (
              <div style={{ 
                marginTop: '20px', 
                paddingTop: '15px', 
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {Object.entries(categoryColors).sort(([a], [b]) => a.localeCompare(b)).map(([category, color]) => (
                  <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: color,
                      borderRadius: '3px'
                    }}></div>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assets - Full Width Section */}
      <div className="chart-card" style={{ marginTop: '30px' }}>
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
            <div className="empty-state-icon"><Package size={48} /></div>
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
  );
};

export default Dashboard;