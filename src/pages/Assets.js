import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Upload, Plus, Download } from 'lucide-react';

const Assets = ({ assets, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const filteredAssets = assets.filter(asset => {
    return (
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === '' || asset.category === categoryFilter) &&
      (statusFilter === '' || asset.status === statusFilter) &&
      (locationFilter === '' || asset.location === locationFilter)
    );
  });

  const categories = [...new Set(assets.map(asset => asset.category))];
  const statuses = [...new Set(assets.map(asset => asset.status))];
  const locations = [...new Set(assets.map(asset => asset.location))];

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('CSV imported:', e.target.result);
        alert('CSV import functionality would be implemented here');
      };
      reader.readAsText(file);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Name', 'Category', 'Status', 'Location', 'Value'],
      ...filteredAssets.map(asset => [asset.id, asset.name, asset.category, asset.status, asset.location, asset.value])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets.csv';
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Asset Management</h1>
        <div className="actions">
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
            id="csv-import"
          />
          <label htmlFor="csv-import" className="btn btn-secondary">
            <Upload size={16} style={{ marginRight: '5px' }} />
            Import CSV
          </label>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} style={{ marginRight: '5px' }} />
            Export CSV
          </button>
          <Link to="/add-asset" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '5px' }} />
            Add New Asset
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search assets by name, ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
        </div>

        <div className="filters">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} />
            <span>Advanced Filters:</span>
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="table-info">
          <p>Showing {filteredAssets.length} of {assets.length} assets</p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Location</th>
              <th>Purchase Value</th>
              <th>Current Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id}>
                <td><strong>#{asset.id}</strong></td>
                <td>{asset.name}</td>
                <td>
                  <span className="category-badge">
                    {asset.category}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.location}</td>
                <td>${asset.value.toLocaleString()}</td>
                <td>${Math.round(asset.value * 0.85).toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    <Link 
                      to={`/edit-asset/${asset.id}`} 
                      className="btn btn-secondary btn-sm"
                      title="Edit Asset"
                    >
                      <Edit size={14} />
                    </Link>
                    <button 
                      onClick={() => onDelete(asset.id)} 
                      className="btn btn-danger btn-sm"
                      title="Delete Asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssets.length === 0 && (
          <div className="empty-state">
            <p>No assets found matching your search criteria.</p>
            <Link to="/add-asset" className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '5px' }} />
              Add Your First Asset
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;