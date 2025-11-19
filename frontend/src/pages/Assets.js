import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Upload, Plus, Download, FileText, RefreshCw, Columns, AlertTriangle, X } from 'lucide-react';
import Pagination from '../components/Pagination';
import apiService from '../services/apiService';
import ColumnFilterPopup from '../components/ColumnFilterPopup';
import ColumnConfigService from '../services/columnConfigService';

const Assets = ({ onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column customization state
  const [columnConfig, setColumnConfig] = useState([]);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  
  // Column-specific filters
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilterPopup, setActiveFilterPopup] = useState(null); // Track which column's filter is open
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for all assets (loaded once)
  const [allAssets, setAllAssets] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState('Inventory_ID');
  const [sortDirection, setSortDirection] = useState('desc'); // Show newest first
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    show: false,
    asset: null,
    deleting: false
  });

  // Load column configuration on mount
  useEffect(() => {
    const savedConfig = ColumnConfigService.loadConfig();
    setColumnConfig(savedConfig);
  }, []);

  // Fetch all assets from database
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
        
        // Create columns based on new database schema
        // Default columns in specified order:
        // 1. Customer name, 2. Branch, 3. Serial number, 4. Tag ID, 5. Status
        // 6. Item name, 7. Model, 8. Category, 9. Antivirus, 10. Windows version
        // 11. Microsoft Office version, 12. Software, 13. Recipient name
        const assetColumns = [
          { Field: 'Customer_Name', Type: 'varchar(255)', Label: 'Customer Name' },
          { Field: 'Branch', Type: 'varchar(255)', Label: 'Branch' },
          { Field: 'Asset_Serial_Number', Type: 'varchar(255)', Label: 'Serial Number' },
          { Field: 'Asset_Tag_ID', Type: 'varchar(255)', Label: 'Tag ID' },
          { Field: 'Status', Type: 'varchar(50)', Label: 'Status' },
          { Field: 'Item_Name', Type: 'varchar(255)', Label: 'Item Name' },
          { Field: 'Model', Type: 'varchar(255)', Label: 'Model' },
          { Field: 'Category', Type: 'varchar(255)', Label: 'Category' },
          { Field: 'Antivirus', Type: 'varchar(255)', Label: 'Antivirus' },
          { Field: 'Windows', Type: 'varchar(255)', Label: 'Windows Version' },
          { Field: 'Microsoft_Office', Type: 'varchar(255)', Label: 'Microsoft Office' },
          { Field: 'Software', Type: 'text', Label: 'Software' },
          { Field: 'Recipient_Name', Type: 'varchar(255)', Label: 'Recipient Name' }
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

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []); // Only fetch once on mount

  // Refresh data when coming from CSV import or when explicitly requested
  useEffect(() => {
    // Check if we're coming from CSV import, Add Asset, or when explicitly requested
    const stateMessage = location.state?.message;
    const hasRefresh = location.state?.refresh || location.search.includes('refresh=true');
    
    if (hasRefresh) {
      console.log('Refreshing assets:', stateMessage || 'Data refresh requested');
      setSuccessMessage(stateMessage || 'Asset data refreshed successfully');
      fetchAssets();
      
      // Clear the state to prevent infinite refreshing
      if (location.state) {
        navigate(location.pathname, { replace: true, state: {} });
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location, navigate]);

  // Refresh function to be called from external components
  const refreshAssets = () => {
    fetchAssets();
  };

  // Handle column configuration changes
  const handleColumnConfigApply = (newConfig) => {
    setColumnConfig(newConfig);
    ColumnConfigService.saveConfig(newConfig);
    console.log('Column configuration updated:', {
      visible: ColumnConfigService.getVisibleColumns(newConfig).length,
      total: newConfig.length
    });
  };

  // Get currently visible columns
  const visibleColumns = ColumnConfigService.getVisibleColumns(columnConfig);

  // Handle delete button click - show confirmation dialog
  const handleDeleteClick = (asset) => {
    setDeleteDialog({
      show: true,
      asset: asset,
      deleting: false
    });
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog.asset) return;

    setDeleteDialog(prev => ({ ...prev, deleting: true }));

    try {
      console.log(`Attempting to delete asset ID: ${deleteDialog.asset.Asset_ID}`);
      
      const response = await apiService.deleteAssetById(deleteDialog.asset.Asset_ID);
      
      if (response.success) {
        console.log('Delete successful:', response);
        
        // Show success message
        setSuccessMessage(
          `Asset deleted successfully! ` +
          `(Peripherals: ${response.data.peripherals_deleted}, ` +
          `PM Records: ${response.data.pm_records_deleted})`
        );
        
        // Close dialog
        setDeleteDialog({ show: false, asset: null, deleting: false });
        
        // Refresh assets list
        await fetchAssets();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(response.error || 'Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert(`Failed to delete asset: ${error.message}`);
      setDeleteDialog(prev => ({ ...prev, deleting: false }));
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteDialog({ show: false, asset: null, deleting: false });
  };

  // Filter and sort assets based on search, column-specific filters, and sort settings
  const filteredAssets = allAssets
    .filter(asset => {
      // Global search filter
      const searchableFields = Object.values(asset).join(' ').toLowerCase();
      const matchesSearch = searchableFields.includes(searchTerm.toLowerCase());
      
      // Column-specific filters
      const matchesColumnFilters = Object.keys(columnFilters).every(columnKey => {
        if (!columnFilters[columnKey]) return true; // Empty filter = no filtering
        const assetValue = (asset[columnKey] || '').toString().toLowerCase();
        const filterValue = columnFilters[columnKey].toLowerCase();
        return assetValue.includes(filterValue);
      });
      
      return matchesSearch && matchesColumnFilters;
    })
    .sort((a, b) => {
      // Sort by the selected field and direction
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      // Handle numeric fields (like Inventory_ID)
      if (sortField === 'Inventory_ID') {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string fields
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
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
  }, [searchTerm, columnFilters]);

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
  
  // Define which columns to hide (typically internal/system columns)
  const hiddenColumns = [
    'Asset_ID', 
    'Inventory_ID',
    'Project_ID',
    'Customer_ID',
    'Recipients_ID',
    'Category_ID',
    'Model_ID',
    'Created_By',
    'Updated_By',
    'Customer_Ref_Number', // Hide customer ref as we show customer name
    'Project_Ref_Number',  // Hide unless specifically needed
    'Project_Title',       // Hide unless specifically needed
    'Department',          // Hide for cleaner view (can be shown on demand)
    'Warranty',
    'Preventive_Maintenance',
    'Start_Date',
    'End_Date',
    'Monthly_Prices',
    'Created_At', 
    'Updated_At', 
    'Deleted_At', 
    'createdAt', 
    'updatedAt'
  ];
  
  // Get displayable columns using ColumnConfigService
  // Map visible columns from config to column objects for backward compatibility
  const displayColumns = visibleColumns.map(configCol => {
    const backendField = ColumnConfigService.getBackendFieldName(configCol.key);
    return {
      Field: backendField,
      Label: configCol.label,
      Type: 'varchar(255)' // Default type
    };
  });
  
  // Helper function to format column names for display
  const formatColumnName = (column) => {
    // Use Label if available, otherwise format the Field name
    if (column.Label) {
      return column.Label;
    }
    return column.Field
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



  const handleExportCSV = () => {
    if (displayColumns.length === 0 || allAssets.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create headers from column labels or names
    const headers = displayColumns.map(col => col.Label || formatColumnName(col));
    
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
    <div style={{ padding: '0' }}>
      {/* Header Section with Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px 20px',
        marginBottom: '30px',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          width: '100%'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              margin: '0 0 10px 0',
              fontSize: '32px',
              fontWeight: '700'
            }}>
              Asset Inventory Management
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              fontSize: '16px'
            }}>
              View complete asset information including project, customer, and maintenance details
            </p>
          </div>
          <div className="actions">
            <button 
              onClick={refreshAssets}
              className="btn btn-secondary" 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                marginRight: '10px'
              }}
              disabled={loading}
            >
              <RefreshCw size={16} style={{ marginRight: '5px' }} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={() => navigate('/assets/import')}
              className="btn btn-secondary" 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                marginRight: '10px'
              }}
            >
              <Upload size={16} style={{ marginRight: '5px' }} />
              Import CSV
            </button>
            <button onClick={handleExportCSV} className="btn btn-secondary" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              marginRight: '10px'
            }}>
              <Download size={16} style={{ marginRight: '5px' }} />
              Export CSV
            </button>
            <button 
              onClick={() => setShowColumnFilter(true)} 
              className="btn btn-secondary" 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                marginRight: '10px'
              }}
              title="Customize columns"
            >
              <Columns size={16} style={{ marginRight: '5px' }} />
              Columns
            </button>
            <Link to="/add-asset" className="btn btn-primary" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              border: 'none',
              fontWeight: '600'
            }}>
              <Plus size={16} style={{ marginRight: '5px' }} />
              Add New Asset
            </Link>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '15px 20px',
          margin: '0 20px 20px 20px',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          {successMessage}
        </div>
      )}

      {/* Full Width Asset Table Section */}
      <div style={{ padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
        <div className="card" style={{ width: '100%' }}>
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
                        <span>{formatColumnName(column)}</span>
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
                            title={`Filter by ${formatColumnName(column)}`}
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
                            Filter {formatColumnName(column)}
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
                    <tr>
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
                          <Link 
                            to={`/asset-detail/${asset.Asset_ID}`} 
                            className="btn btn-primary"
                            title="View Full Details"
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
                              handleDeleteClick(asset);
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
      
      {/* Column Filter Popup */}
      <ColumnFilterPopup
        isOpen={showColumnFilter}
        onClose={() => setShowColumnFilter(false)}
        columns={columnConfig}
        onApply={handleColumnConfigApply}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={handleCancelDelete}
              disabled={deleteDialog.deleting}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                cursor: deleteDialog.deleting ? 'not-allowed' : 'pointer',
                padding: '5px',
                opacity: deleteDialog.deleting ? 0.5 : 1
              }}
            >
              <X size={24} color="#666" />
            </button>

            {/* Warning Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: '#fee',
                borderRadius: '50%',
                padding: '15px',
                display: 'inline-flex'
              }}>
                <AlertTriangle size={40} color="#dc3545" />
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              textAlign: 'center',
              color: '#dc3545',
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              Delete Asset?
            </h2>

            {/* Asset Information */}
            {deleteDialog.asset && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>
                  <strong>Serial Number:</strong> {deleteDialog.asset.Asset_Serial_Number}
                </p>
                <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>
                  <strong>Tag ID:</strong> {deleteDialog.asset.Asset_Tag_ID}
                </p>
                <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>
                  <strong>Item Name:</strong> {deleteDialog.asset.Item_Name}
                </p>
              </div>
            )}

            {/* Warning Message */}
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '25px'
            }}>
              <p style={{
                margin: 0,
                color: '#856404',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                <strong>⚠️ Warning:</strong> This action cannot be undone. The following related records will also be permanently deleted:
              </p>
              <ul style={{
                marginTop: '10px',
                marginBottom: 0,
                paddingLeft: '20px',
                color: '#856404',
                fontSize: '0.9rem'
              }}>
                <li>All <strong>Peripherals</strong> associated with this asset</li>
                <li>All <strong>Preventive Maintenance (PM)</strong> records for this asset</li>
                <li>Inventory links will be cleared (not deleted)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelDelete}
                disabled={deleteDialog.deleting}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: deleteDialog.deleting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: deleteDialog.deleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteDialog.deleting}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: deleteDialog.deleting ? '#ccc' : '#dc3545',
                  color: 'white',
                  cursor: deleteDialog.deleting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {deleteDialog.deleting ? (
                  <>
                    <span>Deleting...</span>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add spinning animation for loading indicator */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Assets;