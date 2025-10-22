import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Upload, Plus, Download, Eye, FileText } from 'lucide-react';
import Pagination from '../components/Pagination';

const Assets = ({ onDelete }) => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Column-specific filters
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilterPopup, setActiveFilterPopup] = useState(null); // Track which column's filter is open
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for all assets (loaded once)
  const [allAssets, setAllAssets] = useState([]);
  
  // State for expanded row details
  const [expandedRow, setExpandedRow] = useState(null);

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
        
        // Create columns based on INVENTORY table structure (includes Project, Customer, Asset details)
        // Column order: Project → Customer → Asset details
        const assetColumns = [
          { Field: 'Inventory_ID', Type: 'int' },
          { Field: 'Project_Ref_Number', Type: 'varchar(100)' },
          { Field: 'Project_Title', Type: 'text' },
          { Field: 'Customer_Ref_Number', Type: 'varchar(100)' },
          { Field: 'Customer_Name', Type: 'varchar(255)' },
          { Field: 'Branch', Type: 'varchar(255)' },
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

  // Filter assets based on search, status, and column-specific filters
  const filteredAssets = allAssets.filter(asset => {
    // Global search filter
    const searchableFields = Object.values(asset).join(' ').toLowerCase();
    const matchesSearch = searchableFields.includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusField = asset.assetStatus || asset.Asset_Status || asset.Status || '';
    const matchesStatus = statusFilter === '' || statusField === statusFilter;
    
    // Column-specific filters
    const matchesColumnFilters = Object.keys(columnFilters).every(columnKey => {
      if (!columnFilters[columnKey]) return true; // Empty filter = no filtering
      const assetValue = (asset[columnKey] || '').toString().toLowerCase();
      const filterValue = columnFilters[columnKey].toLowerCase();
      return assetValue.includes(filterValue);
    });
    
    return matchesSearch && matchesStatus && matchesColumnFilters;
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
  }, [searchTerm, statusFilter, columnFilters]);

  // Close filter popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeFilterPopup && !event.target.closest('th')) {
        setActiveFilterPopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterPopup]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Toggle filter popup for a column
  const toggleFilterPopup = (columnField) => {
    setActiveFilterPopup(activeFilterPopup === columnField ? null : columnField);
  };

  // Handle column filter change
  const handleColumnFilterChange = (columnField, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnField]: value
    }));
  };

  // Clear specific column filter
  const clearColumnFilter = (columnField) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnField];
      return newFilters;
    });
  };

  // Clear all column filters
  const clearColumnFilters = () => {
    setColumnFilters({});
  };

  // Get unique values for filters - check both possible status field names
  const statuses = [...new Set(allAssets.map(asset => 
    asset.assetStatus || asset.Asset_Status || asset.Status || ''
  ).filter(Boolean))];
  
  // Define which columns to hide (typically internal/system columns)
  const hiddenColumns = [
    'Asset_ID', 
    'Inventory_ID',
    'Project_ID',
    'Customer_ID',
    'Recipients_ID',
    'Category_ID',
    'Model_ID',
    'Solution_Principal',
    'Warranty',
    'Preventive_Maintenance',
    'Start_Date',
    'End_Date',
    'Created_At', 
    'Updated_At', 
    'Deleted_At', 
    'createdAt', 
    'updatedAt'
  ];
  
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
        <h1 className="page-title">Asset Inventory Management</h1>
        <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
          View complete asset information including project, customer, and maintenance details
        </p>
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

        <div style={{
          padding: '12px 16px',
          background: '#e3f2fd',
          borderRadius: '6px',
          border: '1px solid #90caf9',
          marginBottom: '10px',
          fontSize: '0.85rem',
          color: '#1565c0'
        }}>
          <strong>💡 Tip:</strong> Click on any row to view detailed project, customer, and maintenance information
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ margin: 0 }}>
              📊 Page <strong>{currentPage}</strong> of <strong>{calculatedTotalPages}</strong> - 
              Showing <strong>{paginatedAssets.length}</strong> of <strong>{totalItems}</strong> total inventory records
            </p>
            {Object.keys(columnFilters).filter(key => columnFilters[key]).length > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '0.85rem',
                padding: '4px 12px',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '4px'
              }}>
                <Filter size={14} />
                <span>{Object.keys(columnFilters).filter(key => columnFilters[key]).length} column filter(s) active</span>
              </div>
            )}
          </div>
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
                    <th key={column.Field} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span>{formatColumnName(column.Field)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {columnFilters[column.Field] && (
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                clearColumnFilter(column.Field);
                              }}
                              title="Clear filter"
                            >
                              ×
                            </span>
                          )}
                          <Filter 
                            size={14} 
                            style={{ 
                              cursor: 'pointer',
                              color: columnFilters[column.Field] ? '#3498db' : '#95a5a6',
                              transition: 'color 0.2s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFilterPopup(column.Field);
                            }}
                            title={`Filter by ${formatColumnName(column.Field)}`}
                          />
                        </div>
                      </div>
                      
                      {/* Filter Popup */}
                      {activeFilterPopup === column.Field && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            zIndex: 1000,
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            padding: '12px',
                            minWidth: '200px',
                            marginTop: '5px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#2c3e50' }}>
                            Filter {formatColumnName(column.Field)}
                          </div>
                          <input
                            type="text"
                            placeholder="Enter filter value..."
                            value={columnFilters[column.Field] || ''}
                            onChange={(e) => handleColumnFilterChange(column.Field, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              outline: 'none'
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setActiveFilterPopup(null);
                              } else if (e.key === 'Escape') {
                                setActiveFilterPopup(null);
                              }
                            }}
                          />
                          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                clearColumnFilter(column.Field);
                                setActiveFilterPopup(null);
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.8rem',
                                backgroundColor: '#95a5a6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => setActiveFilterPopup(null)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.8rem',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.map((asset, index) => (
                  <React.Fragment key={asset.Inventory_ID || asset.Asset_ID || index}>
                    <tr 
                      style={{ cursor: 'pointer', backgroundColor: expandedRow === index ? '#f8f9fa' : 'transparent' }}
                      onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                    >
                      {displayColumns.map(column => (
                        <td key={column.Field}>
                          {(column.Field === 'Status' || column.Field === 'assetStatus' || column.Field === 'Asset_Status') ? (
                            <span className={`status-badge status-${(asset[column.Field] || '').toLowerCase().replace(/\s+/g, '-')}`}>
                              {formatCellValue(asset[column.Field], column.Field)}
                            </span>
                          ) : column.Field === 'Project_Title' ? (
                            <span 
                              title={asset[column.Field]}
                              style={{ 
                                display: 'block',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
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
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(expandedRow === index ? null : index);
                            }}
                            className="btn btn-secondary"
                            title="View Details"
                            style={{
                              padding: '12px 16px',
                              fontSize: '1rem',
                              minWidth: '50px',
                              minHeight: '44px'
                            }}
                          >
                            <Eye size={18} />
                          </button>
                          <Link 
                            to={`/asset-detail/${asset.Asset_ID}`} 
                            className="btn btn-primary"
                            title="View Full Details"
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              padding: '12px 16px',
                              fontSize: '1rem',
                              fontWeight: '600',
                              minHeight: '44px'
                            }}
                          >
                            <FileText size={18} />
                            <span>Details</span>
                          </Link>
                          <Link 
                            to={`/edit-asset/${asset.Asset_ID}`} 
                            className="btn btn-secondary"
                            title="Edit Asset"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: '12px 16px',
                              fontSize: '1rem',
                              minWidth: '50px',
                              minHeight: '44px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit size={18} />
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete && onDelete(asset.Asset_ID);
                            }} 
                            className="btn btn-danger"
                            title="Delete Asset"
                            style={{
                              padding: '12px 16px',
                              fontSize: '1rem',
                              minWidth: '50px',
                              minHeight: '44px'
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRow === index && (
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td colSpan={displayColumns.length + 1} style={{ padding: '20px' }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            gap: '20px',
                            fontSize: '0.9rem',
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}>
                            {/* Left Column - Project Information */}
                            <div style={{ 
                              padding: '15px', 
                              background: 'white', 
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              minWidth: 0,
                              overflow: 'hidden'
                            }}>
                              <h4 style={{ 
                                marginTop: 0, 
                                marginBottom: '15px',
                                color: '#2c3e50',
                                fontSize: '1rem',
                                borderBottom: '2px solid #3498db',
                                paddingBottom: '8px',
                                wordWrap: 'break-word',
                                textAlign: 'left'
                              }}>
                                📋 Project Information
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Project Ref:</strong>
                                  <div style={{ 
                                    color: '#2c3e50', 
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Project_Ref_Number || 'N/A'}
                                  </div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Project Title:</strong>
                                  <div style={{ 
                                    color: '#2c3e50', 
                                    lineHeight: '1.5',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'normal',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Project_Title || 'N/A'}
                                  </div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Duration:</strong>
                                  <div style={{ 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Start_Date && asset.End_Date 
                                      ? `${new Date(asset.Start_Date).toLocaleDateString()} - ${new Date(asset.End_Date).toLocaleDateString()}`
                                      : 'N/A'
                                    }
                                  </div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Warranty:</strong>
                                  <div style={{ 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Warranty || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Customer & Maintenance Information */}
                            <div style={{ 
                              padding: '15px', 
                              background: 'white', 
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              minWidth: 0,
                              overflow: 'hidden'
                            }}>
                              <h4 style={{ 
                                marginTop: 0, 
                                marginBottom: '15px',
                                color: '#2c3e50',
                                fontSize: '1rem',
                                borderBottom: '2px solid #e74c3c',
                                paddingBottom: '8px',
                                wordWrap: 'break-word',
                                textAlign: 'left'
                              }}>
                                🏢 Customer Information
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Customer:</strong>
                                  <div style={{ 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Customer_Name || 'N/A'}
                                  </div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Branch:</strong>
                                  <div style={{ 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Branch || 'N/A'}
                                  </div>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Customer Ref:</strong>
                                  <div style={{ 
                                    color: '#2c3e50',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {asset.Customer_Ref_Number || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              
                              <h4 style={{ 
                                marginTop: '20px', 
                                marginBottom: '15px',
                                color: '#2c3e50',
                                fontSize: '1rem',
                                borderBottom: '2px solid #27ae60',
                                paddingBottom: '8px',
                                wordWrap: 'break-word',
                                textAlign: 'left'
                              }}>
                                🔧 Maintenance
                              </h4>
                              <div style={{ 
                                color: '#2c3e50', 
                                lineHeight: '1.6', 
                                fontSize: '0.85rem',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                                textAlign: 'left'
                              }}>
                                {asset.Preventive_Maintenance || 'No maintenance information available'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Info Row */}
                          <div style={{ 
                            marginTop: '15px',
                            padding: '12px 15px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            fontSize: '0.85rem',
                            overflow: 'hidden'
                          }}>
                            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '8px', textAlign: 'left' }}>Solution Principal:</strong>
                            <div style={{ 
                              color: '#2c3e50', 
                              lineHeight: '1.6',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              textAlign: 'left'
                            }}>
                              {asset.Solution_Principal || 'N/A'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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