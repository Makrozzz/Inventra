import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Upload } from 'lucide-react';

const Inventory = ({ assets, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredAssets = assets.filter(asset => {
    return (
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === '' || asset.category === categoryFilter) &&
      (statusFilter === '' || asset.status === statusFilter)
    );
  });

  const categories = [...new Set(assets.map(asset => asset.category))];
  const statuses = [...new Set(assets.map(asset => asset.status))];

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Asset Inventory</h1>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
            id="csv-import"
          />
          <label htmlFor="csv-import" className="btn btn-secondary" style={{ marginRight: '10px' }}>
            <Upload size={16} style={{ marginRight: '5px' }} />
            Import CSV
          </label>
          <Link to="/add-asset" className="btn btn-primary">Add New Asset</Link>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
        </div>

        <div className="filters">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} />
            <span>Filters:</span>
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
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Location</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.name}</td>
                <td>{asset.category}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: asset.status === 'Active' ? '#d4edda' : '#fff3cd',
                    color: asset.status === 'Active' ? '#155724' : '#856404'
                  }}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.location}</td>
                <td>${asset.value}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <Link to={`/edit-asset/${asset.id}`} className="btn btn-secondary" style={{ padding: '5px 10px' }}>
                      <Edit size={14} />
                    </Link>
                    <button 
                      onClick={() => onDelete(asset.id)} 
                      className="btn" 
                      style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white' }}
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No assets found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;