import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Edit, Trash2, Download, Plus, Upload, FileText, Columns, AlertTriangle, X, Settings2, Eye, Trash, Edit2, Boxes } from 'lucide-react';
import Pagination from '../components/Pagination';
import apiService from '../services/apiService';
import ColumnFilterPopup from '../components/ColumnFilterPopup';
import ColumnConfigService from '../services/columnConfigService';
import { API_URL } from '../config/api';

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

  // Selection state
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const headerButtonStyle = {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  };

  const handleHeaderButtonHover = (event, isHover) => {
    const target = event.currentTarget;
    target.style.transform = isHover ? 'translateY(-2px)' : 'translateY(0)';
    target.style.boxShadow = isHover
      ? '0 6px 20px rgba(0, 0, 0, 0.25)'
      : '0 4px 15px rgba(0, 0, 0, 0.2)';
  };

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
        const response = await fetch(`${API_URL}/assets`);
        
        console.log('Assets API Response Status:', response.status); // Debug log
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Assets API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const assets = await response.json();
        
        console.log('Assets API Response:', assets); // Debug log
        console.log('Number of assets:', assets.length); // Debug log
        
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
          { Field: 'Peripheral_Type', Type: 'text', Label: 'Peripheral Name' },
          { Field: 'Peripheral_Serial', Type: 'text', Label: 'Peripheral Serial Code' },
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

  // Handle checkbox selection
  const handleSelectAsset = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

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

  // Debug logging
  console.log('📊 Asset Data Debug:', {
    totalAssets: allAssets.length,
    filteredAssets: filteredAssets.length,
    paginatedAssets: paginatedAssets.length,
    firstAsset: paginatedAssets[0],
    hasAssetID: paginatedAssets[0]?.Asset_ID,
    selectedAssets: selectedAssets
  });

  // Handle select all checkbox (must be after paginatedAssets is defined)
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([]);
      setSelectAll(false);
    } else {
      const allAssetIds = paginatedAssets.map(asset => asset.Asset_ID);
      setSelectedAssets(allAssetIds);
      setSelectAll(true);
    }
  };

  // Check if all current page assets are selected (for checkbox state)
  const isAllSelected = paginatedAssets.length > 0 && 
    paginatedAssets.every(asset => selectedAssets.includes(asset.Asset_ID));

  // Bulk action handlers (must be after paginatedAssets is defined)
  const handleBulkView = () => {
    if (selectedAssets.length === 1) {
      navigate(`/asset-detail/${selectedAssets[0]}`);
    } else {
      alert('Please select exactly one asset to view');
    }
  };

  const handleBulkEdit = () => {
    if (selectedAssets.length === 1) {
      navigate(`/edit-asset/${selectedAssets[0]}`);
    } else {
      alert('Please select exactly one asset to edit');
    }
  };

  const handleBulkDelete = () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to delete');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} asset(s)?`)) {
      // Handle bulk delete logic here
      console.log('Deleting assets:', selectedAssets);
      // You can implement actual bulk delete API call here
    }
  };

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

  // Column resize handlers
  const handleMouseDown = (e, columnField) => {
    e.preventDefault();
    setResizingColumn(columnField);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnField] || 150);
  };

  const handleMouseMove = (e) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + diff); // Minimum width of 80px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  };

  const handleMouseUp = () => {
    setResizingColumn(null);
  };

  // Add event listeners for column resizing
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, startX, startWidth]);
  
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
    // Special handling for Peripheral columns - format with line breaks
    if (columnName === 'Peripheral_Type' || columnName === 'Peripheral_Serial') {
      if (!value || value === '' || value === null || value === undefined) {
        return 'N/A';
      }
      // Value already comes formatted with commas from backend, replace with line breaks
      return value.split(', ').join('\n');
    }
    
    // Special handling for Software column - show 'None' for assets without software
    if (columnName === 'Software') {
      if (!value || value === '' || value === null || value === undefined) {
        return 'None';
      }
      return value;
    }
    
    if (value === null || value === undefined) return 'N/A';
    
    // Format date columns to show only date (YYYY-MM-DD)
    if (columnName === 'Start_Date' || columnName === 'End_Date') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
        }
      } catch (e) {
        return value;
      }
    }
    
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
      displayColumns.map(col => {
        const value = asset[col.Field];
        // Special handling for Software: empty means no software, show 'None'
        if (col.Field === 'Software') {
          return value || 'None';
        }
        return value || 'N/A';
      })
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '3px solid #667eea',
        padding: '0 20px 15px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Boxes size={28} color="#667eea" />
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>
              Assets
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
              View complete asset information including project, customer, and maintenance details
            </p>
          </div>
        </div>
        <div className="actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/assets/import')}
            className="btn btn-secondary"
            style={headerButtonStyle}
            onMouseEnter={(e) => handleHeaderButtonHover(e, true)}
            onMouseLeave={(e) => handleHeaderButtonHover(e, false)}
          >
            <Download size={16} />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={headerButtonStyle}
            onMouseEnter={(e) => handleHeaderButtonHover(e, true)}
            onMouseLeave={(e) => handleHeaderButtonHover(e, false)}
          >
            <Upload size={16} />
            Export CSV
          </button>
          <Link
            to="/add-asset"
            className="btn btn-primary"
            style={headerButtonStyle}
            onMouseEnter={(e) => handleHeaderButtonHover(e, true)}
            onMouseLeave={(e) => handleHeaderButtonHover(e, false)}
          >
            <Plus size={16} />
            Add New Asset
          </Link>
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
        <div className="search-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search assets by name, ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
          
          {/* Bulk Action Buttons */}
          {selectedAssets.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleBulkView}
                disabled={selectedAssets.length !== 1}
                style={{
                  background: selectedAssets.length === 1 ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: selectedAssets.length === 1 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedAssets.length === 1 ? '0 2px 6px rgba(52, 152, 219, 0.3)' : 'none',
                  opacity: selectedAssets.length === 1 ? 1 : 0.6
                }}
                title="View selected asset"
              >
                <Eye size={14} />
                View
              </button>
              
              <button 
                onClick={handleBulkEdit}
                disabled={selectedAssets.length !== 1}
                style={{
                  background: selectedAssets.length === 1 ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: selectedAssets.length === 1 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedAssets.length === 1 ? '0 2px 6px rgba(243, 156, 18, 0.3)' : 'none',
                  opacity: selectedAssets.length === 1 ? 1 : 0.6
                }}
                title="Edit selected asset"
              >
                <Edit2 size={14} />
                Edit
              </button>
              
              <button 
                onClick={handleBulkDelete}
                style={{
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)'
                }}
                title={`Delete ${selectedAssets.length} selected asset(s)`}
              >
                <Trash size={14} />
                Delete ({selectedAssets.length})
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setShowColumnFilter(true)} 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              whiteSpace: 'nowrap',
              marginLeft: 'auto'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            }}
            title="Manage table columns"
          >
            <Settings2 size={16} />
            Manage Columns
          </button>
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
                  <th style={{ 
                    width: '60px', 
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '14px 10px',
                    background: 'linear-gradient(180deg, #5a67d8 0%, #6b46c1 100%)',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => {
                          console.log('Select All clicked, current state:', isAllSelected);
                          handleSelectAll();
                        }}
                        className="custom-checkbox"
                        style={{
                          display: 'block',
                          cursor: 'pointer',
                          width: '17px',
                          height: '17px',
                          accentColor: '#667eea',
                          borderRadius: '3px',
                          border: '2px solid rgba(255, 255, 255, 0.6)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        title="Select all on this page"
                      />
                    </div>
                  </th>
                  {displayColumns.map((column, columnIndex) => (
                    <th 
                      key={column.Field} 
                      style={{ 
                        position: 'relative',
                        width: columnWidths[column.Field] || 'auto',
                        minWidth: columnWidths[column.Field] || '150px',
                        maxWidth: columnWidths[column.Field] || 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        {column.Field === 'Model' ? (
                          <Link
                            to="/models/specs"
                            style={{
                              color: 'white',
                              textDecoration: 'none',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flex: 1
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.85';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            title="View all models with specifications"
                          >
                            {formatColumnName(column)}
                          </Link>
                        ) : (
                          <span>{formatColumnName(column)}</span>
                        )}
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
                      
                      {/* Resize Handle - Only show if not the last column */}
                      {columnIndex < displayColumns.length - 1 && (
                        <div
                          onMouseDown={(e) => handleMouseDown(e, column.Field)}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '8px',
                            cursor: 'col-resize',
                            backgroundColor: resizingColumn === column.Field ? '#667eea' : 'transparent',
                            transition: 'background-color 0.2s',
                            zIndex: 10,
                            userSelect: 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!resizingColumn) {
                              e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!resizingColumn) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          title="Drag to resize column"
                        />
                      )}
                      
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
                </tr>
              </thead>
              <tbody style={{ userSelect: resizingColumn ? 'none' : 'auto' }}>
                {paginatedAssets.length > 0 ? paginatedAssets.map((asset, index) => {
                  // Debug log for each asset
                  if (index === 0) {
                    console.log('🔍 First asset in render:', asset, 'Asset_ID:', asset.Asset_ID);
                  }
                  
                  return (
                  <React.Fragment key={asset.Inventory_ID || asset.Asset_ID || index}>
                    <tr>
                      <td style={{ 
                        textAlign: 'center', 
                        padding: '14px 10px',
                        width: '60px',
                        minWidth: '60px',
                        backgroundColor: index % 2 === 0 ? '#fafbfc' : '#ffffff',
                        verticalAlign: 'middle',
                        borderLeft: selectedAssets.includes(asset.Asset_ID) ? '3px solid #667eea' : '3px solid transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.Asset_ID)}
                            onChange={() => {
                              console.log('Checkbox clicked for Asset_ID:', asset.Asset_ID);
                              handleSelectAsset(asset.Asset_ID);
                            }}
                            className="custom-checkbox"
                            style={{
                              display: 'block',
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px',
                              accentColor: '#667eea',
                              borderRadius: '3px',
                              border: '1.5px solid #cbd5e0',
                              backgroundColor: selectedAssets.includes(asset.Asset_ID) ? '#667eea' : 'white',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              outline: 'none',
                              flexShrink: 0
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseOver={(e) => {
                              if (!selectedAssets.includes(asset.Asset_ID)) {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = '#f0f4ff';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!selectedAssets.includes(asset.Asset_ID)) {
                                e.currentTarget.style.borderColor = '#cbd5e0';
                                e.currentTarget.style.backgroundColor = 'white';
                              }
                            }}
                          />
                          {selectedAssets.includes(asset.Asset_ID) && (
                            <svg 
                              style={{
                                position: 'absolute',
                                width: '10px',
                                height: '10px',
                                pointerEvents: 'none',
                                fill: 'white'
                              }}
                              viewBox="0 0 16 16"
                            >
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      {displayColumns.map(column => (
                        <td 
                          key={column.Field}
                          style={{
                            width: columnWidths[column.Field] || 'auto',
                            minWidth: columnWidths[column.Field] || '150px',
                            maxWidth: columnWidths[column.Field] || 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {(column.Field === 'Status' || column.Field === 'assetStatus' || column.Field === 'Asset_Status') ? (
                            <span className={`status-badge status-${(asset[column.Field] || '').toLowerCase().replace(/\s+/g, '-')}`}>
                              {formatCellValue(asset[column.Field], column.Field)}
                            </span>
                          ) : column.Field === 'Model' ? (
                            asset.Model_ID ? (
                              <Link
                                to={`/models/${asset.Model_ID}/add-specs`}
                                style={{
                                  color: 'inherit',
                                  textDecoration: 'none',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#667eea';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'inherit';
                                }}
                                title={`Add/Edit specifications for ${asset.Model || 'this model'}`}
                              >
                                {formatCellValue(asset[column.Field], column.Field)}
                              </Link>
                            ) : (
                              <span>{formatCellValue(asset[column.Field], column.Field)}</span>
                            )
                          ) : column.Field === 'Peripheral_Type' || column.Field === 'Peripheral_Serial' ? (
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {formatCellValue(asset[column.Field], column.Field)}
                            </div>
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
                    </tr>
                  </React.Fragment>
                );
                }) : (
                  <tr>
                    <td colSpan="100%" style={{ textAlign: 'center', padding: '20px' }}>
                      No assets to display
                    </td>
                  </tr>
                )}
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
        
        /* Disable text selection while resizing */
        body.resizing-column {
          user-select: none;
          cursor: col-resize !important;
        }
        
        /* Column resize cursor */
        th {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default Assets;