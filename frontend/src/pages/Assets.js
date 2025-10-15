import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Upload, Plus, Download } from 'lucide-react';
import Pagination from '../components/Pagination';

const Assets = ({ onDelete }) => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for all assets (loaded once)
  const [allAssets, setAllAssets] = useState([]);

  // Fetch all assets from database (once)
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use direct fetch with correct API endpoint
        const response = await fetch('http://localhost:5000/api/v1/assets');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const assets = await response.json();
        
        console.log('Assets API Response:', assets); // Debug log
        
        setAllAssets(assets);
        
        // Create columns based on new database structure
        const assetColumns = [
          { Field: 'Asset_ID', Type: 'int' },
          { Field: 'Asset_Serial_Number', Type: 'varchar(100)' },
          { Field: 'Asset_Tag_ID', Type: 'varchar(100)' },
          { Field: 'Item_Name', Type: 'varchar(100)' },
          { Field: 'Status', Type: 'varchar(50)' },
          { Field: 'Category', Type: 'varchar(100)' },
          { Field: 'Model', Type: 'varchar(100)' },
          { Field: 'Recipient_Name', Type: 'varchar(100)' },
          { Field: 'Department', Type: 'varchar(100)' }
        ];
        setColumns(assetColumns);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError(err.message || 'Failed to load assets. Make sure the backend server is running.');
        setAllAssets([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []); // Only fetch once

  // Filter assets based on search and status
  const filteredAssets = allAssets.filter(asset => {
    const searchableFields = Object.values(asset).join(' ').toLowerCase();
    const statusField = asset.assetStatus || asset.Asset_Status || asset.status || '';
    return (
      searchableFields.includes(searchTerm.toLowerCase()) &&
      (statusFilter === '' || statusField === statusFilter)
    );
  });

  // Client-side pagination calculations
  const totalItems = filteredAssets.length;
  const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Get unique values for filters - check both possible status field names
  const statuses = [...new Set(allAssets.map(asset => 
    asset.assetStatus || asset.Asset_Status || asset.status || ''
  ).filter(Boolean))];
  
  // Define which columns to hide (typically internal/system columns)
  const hiddenColumns = ['Asset_ID', 'Created_At', 'Updated_At', 'Deleted_At', 'createdAt', 'updatedAt'];
  
  // Get displayable columns (exclude hidden ones)
  const displayColumns = columns.filter(col => !hiddenColumns.includes(col.Field));
  
  // Helper function to format column names for display
  const formatColumnName = (columnName) => {
    return columnName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Helper function to format cell values
  const formatCellValue = (value, columnName) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };

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
    if (displayColumns.length === 0 || allAssets.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create headers from column names
    const headers = displayColumns.map(col => formatColumnName(col.Field));
    
    // Create rows with all asset data (not just filtered)
    const rows = allAssets.map(asset => 
      displayColumns.map(col => asset[col.Field] || 'N/A')
    );
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'complete_assets.csv';
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
            <span>Filters:</span>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="table-info" style={{ 
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #ecf0f1, #d5dbdb)', 
          borderRadius: '6px 6px 0 0',
          border: '1px solid #bdc3c7',
          borderBottom: 'none',
          color: '#2c3e50',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: 0 }}>
            📊 Page <strong>{currentPage}</strong> of <strong>{calculatedTotalPages}</strong> - 
            Showing <strong>{paginatedAssets.length}</strong> of <strong>{totalItems}</strong> total assets
          </p>
        </div>

        {loading ? (
          <div className="table-loading">
            <p>Loading assets...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <p style={{ color: '#e74c3c', fontSize: '1.1rem', marginBottom: '20px' }}>⚠️ Error: {error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              🔄 Retry
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {displayColumns.map(column => (
                    <th key={column.Field}>
                      {formatColumnName(column.Field)}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.map((asset, index) => (
                  <tr key={asset.serialNumber || asset.Serial_Number || asset.Asset_ID || asset.id || index}>
                    {displayColumns.map(column => (
                      <td key={column.Field}>
                        {(column.Field === 'assetStatus' || column.Field === 'Asset_Status' || column.Field === 'status') ? (
                          <span className={`status-badge status-${(asset[column.Field] || '').toLowerCase().replace(/\s+/g, '-')}`}>
                            {formatCellValue(asset[column.Field], column.Field)}
                          </span>
                        ) : (
                          <span title={asset[column.Field]}>
                            {formatCellValue(asset[column.Field], column.Field)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/edit-asset/${asset.serialNumber || asset.Serial_Number || asset.Asset_ID || asset.id}`} 
                          className="btn btn-secondary btn-sm"
                          title="Edit Asset"
                        >
                          <Edit size={14} />
                        </Link>
                        <button 
                          onClick={() => onDelete && onDelete(asset.serialNumber || asset.Serial_Number || asset.Asset_ID || asset.id)} 
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
          </div>
        )}

        {!loading && !error && filteredAssets.length === 0 && (
          <div className="empty-state">
            <p>📦 No assets found matching your search criteria.</p>
            <Link to="/add-asset" className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '5px' }} />
              Add Your First Asset
            </Link>
          </div>
        )}

        {!loading && !error && filteredAssets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={calculatedTotalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  );
};

export default Assets;