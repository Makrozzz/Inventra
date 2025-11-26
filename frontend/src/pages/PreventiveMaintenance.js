import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench, Filter, Building2, MapPin, Package, FileText, X, ClipboardCheck, Edit, Trash2, Plus, Save, Search, Download, ChevronRight, ChevronLeft } from 'lucide-react';

const PreventiveMaintenance = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  const savedBranch = useRef(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pmRecords, setPmRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // PM Form Modal States
  const [showPMForm, setShowPMForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [checklistItemRemarks, setChecklistItemRemarks] = useState({});
  const [pmRemarks, setPmRemarks] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Checklist Management Modal States
  const [showChecklistManager, setShowChecklistManager] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState('');
  const [checklistItemsForEdit, setChecklistItemsForEdit] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingItemTextLong, setEditingItemTextLong] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [newItemTextLong, setNewItemTextLong] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Bulk Download Modal States
  const [showBulkDownloadModal, setShowBulkDownloadModal] = useState(false);
  const [bulkDownloadSearch, setBulkDownloadSearch] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]); // Assets selected (left box)
  const [selectedPMRecords, setSelectedPMRecords] = useState({}); // PM records selected per asset {assetId: [pmId1, pmId2]}
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Initialize from URL parameters on mount
  useEffect(() => {
    const customerParam = searchParams.get('customer');
    const branchParam = searchParams.get('branch');
    
    if (customerParam) {
      setSelectedCustomer(customerParam);
      if (branchParam) {
        // Save branch to restore after branches are fetched
        savedBranch.current = branchParam;
      }
    }
    
    fetchStatistics();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchBranches(selectedCustomer);
      
      // Only clear branch if not initial mount with saved branch
      if (!isInitialMount.current || !savedBranch.current) {
        setSelectedBranch('');
      }
      setPmRecords([]);
    } else {
      setBranches([]);
      setSelectedBranch('');
      setPmRecords([]);
    }
  }, [selectedCustomer]);

  // Restore branch from URL after branches are fetched
  useEffect(() => {
    if (isInitialMount.current && savedBranch.current && branches.length > 0) {
      setSelectedBranch(savedBranch.current);
      savedBranch.current = null;
      isInitialMount.current = false;
    }
  }, [branches]);

  useEffect(() => {
    if (selectedCustomer && selectedBranch) {
      fetchPMRecords(selectedCustomer, selectedBranch);
    } else {
      setPmRecords([]);
    }
  }, [selectedCustomer, selectedBranch]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/pm/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/pm/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/customers/${customerId}/branches`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchPMRecords = async (customerId, branch) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/pm/filter?customerId=${customerId}&branch=${encodeURIComponent(branch)}`);
      if (!response.ok) throw new Error('Failed to fetch PM records');
      const data = await response.json();
      console.log('PM Records with Checklist:', data);
      setPmRecords(data);
    } catch (err) {
      console.error('Error fetching PM records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter PM records based on search query
  const filteredPmRecords = searchQuery 
    ? pmRecords.filter(record => {
        const query = searchQuery.toLowerCase().trim();
        return (
          record.Asset_Tag_ID?.toLowerCase().includes(query) ||
          record.Item_Name?.toLowerCase().includes(query) ||
          record.Asset_Serial_Number?.toLowerCase().includes(query) ||
          record.Recipient_Name?.toLowerCase().includes(query) ||
          record.Department?.toLowerCase().includes(query)
        );
      })
    : pmRecords;

  // Group PM records by category and asset, keeping only latest PM per asset
  const groupedByCategory = filteredPmRecords.reduce((acc, record) => {
    const category = record.Category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = {
        assets: {}, // Changed from records to assets (keyed by Asset_ID)
        checklistItems: []
      };
    }
    
    const assetId = record.Asset_ID;
    
    // Skip if no Asset_ID
    if (!assetId) return acc;
    
    // If this asset doesn't exist yet, initialize it
    if (!acc[category].assets[assetId]) {
      // Check if this asset has PM data
      if (record.PM_ID) {
        // Asset with PM data
        acc[category].assets[assetId] = {
          ...record,
          pmCount: 1,
          latestPMDate: record.PM_Date,
          allPMRecords: [{ PM_ID: record.PM_ID, PM_Date: record.PM_Date }]
        };
      } else {
        // Asset without PM data (never had PM performed)
        acc[category].assets[assetId] = {
          ...record,
          pmCount: 0,
          latestPMDate: null,
          allPMRecords: []
        };
      }
    } else {
      // Asset already exists - only process if this record has PM_ID
      if (record.PM_ID) {
        // Store current values
        const currentPmCount = acc[category].assets[assetId].pmCount;
        const currentAllPMRecords = acc[category].assets[assetId].allPMRecords;
        
        // Increment PM count and add new PM record
        acc[category].assets[assetId].pmCount = currentPmCount + 1;
        acc[category].assets[assetId].allPMRecords = [...currentAllPMRecords, { PM_ID: record.PM_ID, PM_Date: record.PM_Date }];
        
        // If this PM is newer, update to use its checklist results
        const existingDate = acc[category].assets[assetId].latestPMDate ? new Date(acc[category].assets[assetId].latestPMDate) : new Date(0);
        const currentDate = new Date(record.PM_Date);
        
        if (currentDate > existingDate) {
          acc[category].assets[assetId] = {
            ...record,
            pmCount: currentPmCount + 1,
            latestPMDate: record.PM_Date,
            allPMRecords: [...currentAllPMRecords, { PM_ID: record.PM_ID, PM_Date: record.PM_Date }]
          };
        }
      }
    }
    
    // Collect unique checklist items for this category
    if (record.checklist_results && Array.isArray(record.checklist_results)) {
      record.checklist_results.forEach(item => {
        if (!item || !item.Checklist_ID) return;
        const exists = acc[category].checklistItems.find(
          ci => ci.Checklist_ID === item.Checklist_ID
        );
        if (!exists && item.Check_Item) {
          acc[category].checklistItems.push({
            Checklist_ID: item.Checklist_ID,
            Check_Item: item.Check_Item
          });
        }
      });
    }
    
    return acc;
  }, {});

  // Sort checklist items by ID
  Object.keys(groupedByCategory).forEach(category => {
    groupedByCategory[category].checklistItems.sort((a, b) => a.Checklist_ID - b.Checklist_ID);
  });

  const getCheckResultIcon = (isOk) => {
    if (isOk === 1 || isOk === true) {
      return <CheckCircle size={18} color="#27ae60" style={{ display: 'inline-block' }} />;
    } else {
      return <X size={18} color="#e74c3c" style={{ display: 'inline-block' }} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ============ CHECKLIST MANAGEMENT HANDLERS ============
  
  const handleOpenChecklistManager = async () => {
    setShowChecklistManager(true);
    setLoadingChecklist(true);
    
    try {
      // Fetch all categories
      const response = await fetch('http://localhost:5000/api/v1/pm/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      alert('Failed to load categories');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleCategoryChangeForEdit = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategoryForEdit(categoryId);
    setChecklistItemsForEdit([]);
    setNewItemText('');
    setEditingItemId(null);
    
    if (!categoryId) return;
    
    setLoadingChecklist(true);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/all-checklist/${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch checklist items');
      const data = await response.json();
      setChecklistItemsForEdit(data);
    } catch (err) {
      console.error('Error fetching checklist items:', err);
      alert('Failed to load checklist items');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.Checklist_ID);
    setEditingItemText(item.Check_Item);
    setEditingItemTextLong(item.Check_item_Long || item.Check_Item);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemText('');
    setEditingItemTextLong('');
  };

  const handleConfirmEdit = () => {
    setPendingEdit({ 
      id: editingItemId, 
      text: editingItemText,
      textLong: editingItemTextLong 
    });
    setShowEditConfirm(true);
  };

  const handleSaveEdit = async () => {
    setShowEditConfirm(false);
    setLoadingChecklist(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/checklist/${pendingEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          checkItem: pendingEdit.text,
          checkItemLong: pendingEdit.textLong
        })
      });

      if (!response.ok) throw new Error('Failed to update checklist item');

      alert('Checklist item updated successfully!');
      
      // Refresh checklist
      await handleCategoryChangeForEdit({ target: { value: selectedCategoryForEdit } });
      setEditingItemId(null);
      setEditingItemText('');
      setEditingItemTextLong('');
      setPendingEdit(null);
    } catch (err) {
      console.error('Error updating checklist item:', err);
      alert('Failed to update checklist item');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setLoadingChecklist(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/checklist/${itemToDelete.Checklist_ID}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          alert(data.error || 'Cannot delete: This checklist item is used in existing PM records');
        } else {
          throw new Error(data.error || 'Failed to delete checklist item');
        }
        return;
      }

      alert('Checklist item deleted successfully!');
      
      // Refresh checklist
      await handleCategoryChangeForEdit({ target: { value: selectedCategoryForEdit } });
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting checklist item:', err);
      alert(err.message || 'Failed to delete checklist item');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleAddNewItem = () => {
    if (!newItemText.trim() || !newItemTextLong.trim()) {
      alert('Please enter both short and long version of checklist item');
      return;
    }
    setShowAddConfirm(true);
  };

  const handleConfirmAddItem = async () => {
    setShowAddConfirm(false);
    setLoadingChecklist(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/pm/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategoryForEdit,
          checkItem: newItemText,
          checkItemLong: newItemTextLong
        })
      });

      if (!response.ok) throw new Error('Failed to add checklist item');

      alert('Checklist item added successfully!');
      
      // Refresh checklist
      await handleCategoryChangeForEdit({ target: { value: selectedCategoryForEdit } });
      setNewItemText('');
      setNewItemTextLong('');
    } catch (err) {
      console.error('Error adding checklist item:', err);
      alert('Failed to add checklist item');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleCloseChecklistManager = () => {
    setShowChecklistManager(false);
    setSelectedCategoryForEdit('');
    setChecklistItemsForEdit([]);
    setEditingItemId(null);
    setNewItemText('');
    setNewItemTextLong('');
  };

  // Handlers for customer and branch selection with URL parameter updates
  const handleCustomerChange = (e) => {
    const newCustomer = e.target.value;
    setSelectedCustomer(newCustomer);
    
    // Update URL parameters
    if (newCustomer) {
      setSearchParams({ customer: newCustomer });
    } else {
      setSearchParams({});
    }
  };

  const handleBranchChange = (e) => {
    const newBranch = e.target.value;
    setSelectedBranch(newBranch);
    
    // Update URL parameters (keep customer parameter)
    if (newBranch && selectedCustomer) {
      setSearchParams({ customer: selectedCustomer, branch: newBranch });
    } else if (selectedCustomer) {
      setSearchParams({ customer: selectedCustomer });
    }
  };

  // PM Form Handlers
  const handleOpenPMForm = async (asset) => {
    setSelectedAsset(asset);
    setShowPMForm(true);
    setPmRemarks('');
    setChecklistResults({});
    setChecklistItemRemarks({});
    
    // Fetch checklist items for this asset's category
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/all-checklist/${asset.Category_ID}`);
      if (!response.ok) throw new Error('Failed to fetch checklist');
      const data = await response.json();
      setChecklistItems(data);
      
      // Initialize all checklist results to false (bad)
      const initialResults = {};
      data.forEach(item => {
        initialResults[item.Checklist_ID] = false;
      });
      setChecklistResults(initialResults);
    } catch (err) {
      console.error('Error fetching checklist:', err);
      alert('Failed to load checklist items');
    }
  };

  const handleClosePMForm = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    setShowPMForm(false);
    setSelectedAsset(null);
    setChecklistItems([]);
    setChecklistResults({});
    setChecklistItemRemarks({});
    setPmRemarks('');
  };

  const handleChecklistChange = (checklistId, isOk) => {
    setChecklistResults(prev => ({
      ...prev,
      [checklistId]: isOk
    }));
  };

  const handleChecklistRemarkChange = (checklistId, remark) => {
    setChecklistItemRemarks(prev => ({
      ...prev,
      [checklistId]: remark
    }));
  };

  const handleSubmitPMForm = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirmDialog(false);

    try {
      // Prepare checklist results array
      const resultsArray = Object.keys(checklistResults).map(checklistId => ({
        Checklist_ID: parseInt(checklistId),
        Is_OK_bool: checklistResults[checklistId] ? 1 : 0,
        Remarks: checklistItemRemarks[checklistId] || null
      }));

      // Get auth token
      const token = localStorage.getItem('authToken');
      
      // Submit PM record
      const response = await fetch('http://localhost:5000/api/v1/pm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assetId: selectedAsset.Asset_ID,
          pmDate: new Date().toISOString().split('T')[0],
          remarks: pmRemarks || null,
          checklistResults: resultsArray,
          status: 'In-Process'
        })
      });

      if (!response.ok) throw new Error('Failed to submit PM record');

      alert('PM record submitted successfully!');
      
      // Refresh PM records
      await fetchPMRecords(selectedCustomer, selectedBranch);
      
      // Close form
      setShowPMForm(false);
      setSelectedAsset(null);
      setChecklistItems([]);
      setChecklistResults({});
      setChecklistItemRemarks({});
      setPmRemarks('');
    } catch (err) {
      console.error('Error submitting PM record:', err);
      alert('Failed to submit PM record. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ 
            color: 'white', 
            margin: '0 0 10px 0',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Preventive Maintenance
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            margin: 0,
            fontSize: '16px'
          }}>
            Monitor and manage preventive maintenance schedules with detailed checklists
          </p>
        </div>
        <div className="actions">
          <button
            onClick={handleOpenChecklistManager}
            className="btn btn-primary"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              border: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '1rem'
            }}
          >
            <Edit size={18} />
            Edit Checklist Items
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

      {/* Statistics Cards */}
      {statistics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Package size={40} style={{ opacity: 0.9 }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{statistics.total}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total PM Records</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <AlertTriangle size={40} style={{ opacity: 0.9 }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{statistics.overdue}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Overdue</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Clock size={40} style={{ opacity: 0.9 }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{statistics.upcoming}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Upcoming (30 days)</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <CheckCircle size={40} style={{ opacity: 0.9 }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{statistics.completed}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Completed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #3498db' }}>
          <Filter size={24} color="#3498db" />
          <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>Filter PM Records</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
              <Building2 size={18} color="#3498db" />
              Step 1: Select Customer
            </label>
            <select value={selectedCustomer} onChange={handleCustomerChange} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '1rem', backgroundColor: 'white', cursor: 'pointer', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#3498db'} onBlur={(e) => e.target.style.borderColor = '#ddd'}>
              <option value="">-- Select Customer --</option>
              {customers.map((customer) => (
                <option key={customer.Customer_ID} value={customer.Customer_ID}>
                  {customer.Customer_Name} ({customer.Customer_Ref_Number})
                </option>
              ))}
            </select>
            {!selectedCustomer && (
              <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '5px', fontStyle: 'italic' }}>
                Please select a customer first
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
              <MapPin size={18} color="#e74c3c" />
              Step 2: Select Branch
            </label>
            <select value={selectedBranch} onChange={handleBranchChange} disabled={!selectedCustomer} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '1rem', backgroundColor: selectedCustomer ? 'white' : '#f5f5f5', cursor: selectedCustomer ? 'pointer' : 'not-allowed', opacity: selectedCustomer ? 1 : 0.6, transition: 'border-color 0.2s' }} onFocus={(e) => selectedCustomer && (e.target.style.borderColor = '#e74c3c')} onBlur={(e) => e.target.style.borderColor = '#ddd'}>
              <option value="">-- Select Branch --</option>
              {branches.map((branch, index) => (
                <option key={index} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {selectedCustomer && !selectedBranch && (
              <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '5px', fontStyle: 'italic' }}>
                Select a branch to view PM records
              </p>
            )}
          </div>
        </div>

        {selectedCustomer && selectedBranch && (
          <div style={{ marginTop: '20px', padding: '12px 16px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} color="#1565c0" />
            <span style={{ color: '#1565c0', fontWeight: '600' }}>
              Showing PM records for: {customers.find(c => c.Customer_ID == selectedCustomer)?.Customer_Name} - {selectedBranch}
            </span>
          </div>
        )}
      </div>

      {/* Search Bar and Download Button */}
      {selectedCustomer && selectedBranch && pmRecords.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#7f8c8d'
                }} 
              />
              <input
                type="text"
                placeholder="Search by Asset Tag ID, Serial Number, Item Name, Recipient, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3498db';
                  e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#bdbdbd'}
                  onMouseOut={(e) => e.target.style.background = '#e0e0e0'}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Download Form Button */}
            <button
              onClick={() => setShowBulkDownloadModal(true)}
              style={{
                padding: '14px 24px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#229954';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <Download size={18} />
              Download Form
            </button>
          </div>
          {searchQuery && (
            <p style={{ 
              margin: '12px 0 0 0', 
              color: '#666', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Search size={16} />
              Searching for: <strong>"{searchQuery}"</strong>
            </p>
          )}
        </div>
      )}

      {/* PM Records by Category with Checklist */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading PM records...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <AlertTriangle size={48} color="#e74c3c" style={{ marginBottom: '15px' }} />
          <p style={{ color: '#e74c3c', fontSize: '1.1rem' }}>Error: {error}</p>
        </div>
      ) : !selectedCustomer || !selectedBranch ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', background: '#f8f9fa' }}>
          <Filter size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#7f8c8d', marginBottom: '10px' }}>No Filters Selected</h3>
          <p style={{ color: '#95a5a6', fontSize: '0.95rem' }}>
            Please select both customer and branch to view PM records
          </p>
        </div>
      ) : pmRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <FileText size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#7f8c8d', marginBottom: '10px' }}>No PM Records Found</h3>
          <p style={{ color: '#95a5a6', fontSize: '0.95rem' }}>
            No preventive maintenance records found for the selected filters
          </p>
        </div>
      ) : (
        Object.keys(groupedByCategory).map((category) => {
          const { assets = {}, checklistItems = [] } = groupedByCategory[category] || {};
          const assetsList = Object.values(assets);
          
          // Skip if no assets in this category
          if (assetsList.length === 0) return null;
          
          return (
            <div key={category} className="card" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '3px solid #27ae60' }}>
                <Wrench size={28} color="#27ae60" />
                <div>
                  <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>
                    {category} ({assetsList.length})
                  </h2>
                  <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    Preventive maintenance checklist results for {category.toLowerCase()} assets
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        position: 'sticky', 
                        left: 0, 
                        top: 0,
                        background: 'linear-gradient(135deg, #2c3e50, #34495e)', 
                        zIndex: 20, 
                        minWidth: '140px', 
                        textAlign: 'center', 
                        padding: '16px 12px',
                        color: 'white',
                        fontWeight: '600',
                        boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
                      }}>
                        Tag ID
                      </th>
                      <th style={{ minWidth: '150px', textAlign: 'center' }}>Item Name</th>
                      <th style={{ minWidth: '150px', textAlign: 'center' }}>Serial Number</th>
                      <th style={{ minWidth: '120px', textAlign: 'center' }}>Latest PM Date</th>
                      <th style={{ minWidth: '80px', textAlign: 'center' }}>PM Count</th>
                      <th style={{ minWidth: '200px', textAlign: 'center' }}>PM Records</th>
                      <th style={{ minWidth: '140px', textAlign: 'center' }}>Actions</th>
                      {Array.isArray(checklistItems) && checklistItems.map((item) => (
                        <th key={item.Checklist_ID} style={{ 
                          minWidth: '120px', 
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          padding: '12px 8px'
                        }}>
                          {item.Check_Item}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assetsList.map((asset) => {
                      // Create a map of checklist results for quick lookup
                      const resultsMap = {};
                      if (asset.checklist_results && Array.isArray(asset.checklist_results)) {
                        asset.checklist_results.forEach(result => {
                          if (result && result.Checklist_ID !== undefined) {
                            resultsMap[result.Checklist_ID] = result.Is_OK_bool;
                          }
                        });
                      }

                      return (
                        <tr key={`${category}-${asset.Asset_ID}`}>
                          <td style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            zIndex: 5,
                            textAlign: 'center'
                          }}>
                            {asset.Asset_Tag_ID || 'N/A'}
                          </td>
                          <td style={{ fontWeight: '500', textAlign: 'center' }}>{asset.Item_Name || 'N/A'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
                            {asset.Asset_Serial_Number || 'N/A'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                              <Calendar size={14} color="#666" />
                              {asset.latestPMDate ? formatDate(asset.latestPMDate) : (
                                <span style={{ color: '#999', fontStyle: 'italic' }}>No PM Yet</span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {/* PM Count Badge */}
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '12px',
                              fontSize: '0.9rem',
                              fontWeight: '700',
                              background: asset.pmCount > 0 ? '#e3f2fd' : '#f5f5f5',
                              color: asset.pmCount > 0 ? '#1565c0' : '#999',
                              border: asset.pmCount > 0 ? '1px solid #90caf9' : '1px solid #ddd',
                              minWidth: '35px',
                              display: 'inline-block'
                            }}>
                              {asset.pmCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {/* Individual PM Buttons */}
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {asset.allPMRecords && asset.allPMRecords.length > 0 ? (
                                asset.allPMRecords
                                  .sort((a, b) => new Date(a.PM_Date) - new Date(b.PM_Date))
                                  .map((pm, index) => (
                                  <button
                                    key={pm.PM_ID}
                                    onClick={() => navigate(`/maintenance/detail/${pm.PM_ID}`)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#27ae60',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      transition: 'all 0.2s',
                                      minWidth: '70px',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.background = '#229954';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.background = '#27ae60';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    }}
                                    title={`View PM ${index + 1} details - ${new Date(pm.PM_Date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                                  >
                                    <FileText size={14} />
                                    PM{index + 1}
                                  </button>
                                ))
                              ) : (
                                <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                  No records
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenPMForm(asset)}
                              style={{
                                padding: '8px 16px',
                                background: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#2980b9'}
                              onMouseOut={(e) => e.target.style.background = '#3498db'}
                            >
                              <ClipboardCheck size={16} />
                              PM
                            </button>
                          </td>
                          {Array.isArray(checklistItems) && checklistItems.map((item) => (
                            <td key={item.Checklist_ID} style={{ 
                              textAlign: 'center',
                              background: resultsMap[item.Checklist_ID] === 1 ? '#f0f9f4' : '#fef2f2'
                            }}>
                              {resultsMap[item.Checklist_ID] !== undefined ? (
                                getCheckResultIcon(resultsMap[item.Checklist_ID])
                              ) : (
                                <span style={{ color: '#95a5a6', fontSize: '0.85rem' }}>-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Category Summary */}
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Total Assets:</span>
                    <strong style={{ marginLeft: '8px', color: '#2c3e50', fontSize: '1.1rem' }}>
                      {assetsList.length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Total PM Records:</span>
                    <strong style={{ marginLeft: '8px', color: '#27ae60', fontSize: '1.1rem' }}>
                      {assetsList.reduce((sum, asset) => sum + (asset.pmCount || 0), 0)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Checklist Items:</span>
                    <strong style={{ marginLeft: '8px', color: '#3498db', fontSize: '1.1rem' }}>
                      {checklistItems.length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Latest PM Date:</span>
                    <strong style={{ marginLeft: '8px', color: '#7f8c8d', fontSize: '1rem' }}>
                      {formatDate(assetsList[0]?.latestPMDate)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div> {/* End of padding wrapper (0 20px) */}

      {/* PM Form Modal */}
      {showPMForm && selectedAsset && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #e0e0e0',
              background: '#f8f9fa',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ClipboardCheck size={32} color="#3498db" />
                  <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>
                      Preventive Maintenance Form
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      Complete checklist for this asset
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePMForm}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  <X size={24} color="#666" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Asset Information */}
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.1rem', fontWeight: '600' }}>
                  Asset Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Serial Number:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Asset_Serial_Number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Asset Tag ID:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Asset_Tag_ID}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Item Name:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Item_Name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Category:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Category}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Recipient Name:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Recipient_Name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Department:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Department || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Model:</span>
                    <strong style={{ color: '#2c3e50', fontSize: '1rem' }}>{selectedAsset.Model || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.1rem', fontWeight: '600' }}>
                  PM Checklist ({checklistItems.length} items)
                </h3>
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.Checklist_ID}
                      style={{
                        padding: '16px',
                        borderBottom: index < checklistItems.length - 1 ? '1px solid #e0e0e0' : 'none',
                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: '#7f8c8d', fontSize: '0.75rem', marginRight: '8px' }}>
                            #{index + 1}
                          </span>
                          <span style={{ color: '#2c3e50', fontSize: '0.95rem', fontWeight: '500' }}>
                            {item.Check_item_Long}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleChecklistChange(item.Checklist_ID, true)}
                            style={{
                              padding: '8px 20px',
                              border: checklistResults[item.Checklist_ID] === true ? '2px solid #27ae60' : '2px solid #ddd',
                              borderRadius: '6px',
                              background: checklistResults[item.Checklist_ID] === true ? '#27ae60' : 'white',
                              color: checklistResults[item.Checklist_ID] === true ? 'white' : '#666',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              minWidth: '80px'
                            }}
                          >
                            Good
                          </button>
                          <button
                            onClick={() => handleChecklistChange(item.Checklist_ID, false)}
                            style={{
                              padding: '8px 20px',
                              border: checklistResults[item.Checklist_ID] === false ? '2px solid #e74c3c' : '2px solid #ddd',
                              borderRadius: '6px',
                              background: checklistResults[item.Checklist_ID] === false ? '#e74c3c' : 'white',
                              color: checklistResults[item.Checklist_ID] === false ? 'white' : '#666',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              minWidth: '80px'
                            }}
                          >
                            Bad
                          </button>
                        </div>
                      </div>
                      <div style={{ paddingLeft: '40px' }}>
                        <input
                          type="text"
                          placeholder="Remarks (optional)"
                          value={checklistItemRemarks[item.Checklist_ID] || ''}
                          onChange={(e) => handleChecklistRemarkChange(item.Checklist_ID, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            color: '#2c3e50',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600', fontSize: '0.95rem' }}>
                  Remarks (Optional)
                </label>
                <textarea
                  value={pmRemarks}
                  onChange={(e) => setPmRemarks(e.target.value)}
                  placeholder="Enter any additional remarks or notes..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClosePMForm}
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    color: '#666',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    opacity: submitting ? 0.5 : 1
                  }}
                  onMouseOver={(e) => !submitting && (e.target.style.background = '#f5f5f5')}
                  onMouseOut={(e) => !submitting && (e.target.style.background = 'white')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPMForm}
                  disabled={submitting}
                  style={{
                    padding: '12px 32px',
                    background: submitting ? '#95a5a6' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => !submitting && (e.target.style.background = '#229954')}
                  onMouseOut={(e) => !submitting && (e.target.style.background = '#27ae60')}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              Confirm Submission
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to submit this PM record? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              Cancel Form?
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to cancel? All your changes will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{
                  padding: '10px 20px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Manager Modal */}
      {showChecklistManager && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #ecf0f1',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px 12px 0 0',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Edit size={28} />
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                    Manage Checklist Items
                  </h2>
                </div>
                <button
                  onClick={handleCloseChecklistManager}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Category Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontSize: '1rem'
                }}>
                  <Package size={18} color="#667eea" />
                  Select Category
                </label>
                <select
                  value={selectedCategoryForEdit}
                  onChange={handleCategoryChangeForEdit}
                  disabled={loadingChecklist}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select a Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.Category_ID} value={cat.Category_ID}>
                      {cat.Category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checklist Items List */}
              {selectedCategoryForEdit && (
                <div>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    color: '#2c3e50',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <ClipboardCheck size={20} color="#667eea" />
                    Checklist Items
                  </h3>

                  {loadingChecklist ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* Existing Items */}
                      <div style={{ marginBottom: '20px' }}>
                        {checklistItemsForEdit.length === 0 ? (
                          <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#7f8c8d',
                            fontSize: '0.95rem',
                            background: '#f8f9fa',
                            borderRadius: '6px'
                          }}>
                            No checklist items found for this category
                          </div>
                        ) : (
                          checklistItemsForEdit.map((item) => (
                            <div
                              key={item.Checklist_ID}
                              style={{
                                padding: '12px',
                                marginBottom: '8px',
                                border: '2px solid #ecf0f1',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: editingItemId === item.Checklist_ID ? '#f0f7ff' : 'white'
                              }}
                            >
                              {editingItemId === item.Checklist_ID ? (
                                <>
                                  <div style={{ 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px',
                                    marginRight: '12px'
                                  }}>
                                    <div>
                                      <label style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#7f8c8d', 
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px',
                                        display: 'block'
                                      }}>
                                        Long Version
                                      </label>
                                      <input
                                        type="text"
                                        value={editingItemTextLong}
                                        onChange={(e) => setEditingItemTextLong(e.target.value)}
                                        style={{
                                          width: '100%',
                                          padding: '8px 12px',
                                          border: '2px solid #667eea',
                                          borderRadius: '4px',
                                          fontSize: '0.95rem'
                                        }}
                                        autoFocus
                                        placeholder="Enter long version"
                                      />
                                    </div>
                                    <div>
                                      <label style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#7f8c8d', 
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px',
                                        display: 'block'
                                      }}>
                                        Short Version
                                      </label>
                                      <input
                                        type="text"
                                        value={editingItemText}
                                        onChange={(e) => setEditingItemText(e.target.value)}
                                        style={{
                                          width: '100%',
                                          padding: '8px 12px',
                                          border: '2px solid #667eea',
                                          borderRadius: '4px',
                                          fontSize: '0.95rem'
                                        }}
                                        placeholder="Enter short version"
                                      />
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={handleConfirmEdit}
                                      style={{
                                        padding: '8px 16px',
                                        background: '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                      }}
                                    >
                                      <Save size={14} />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      style={{
                                        padding: '8px 16px',
                                        background: '#95a5a6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    flex: 1,
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ 
                                      flex: 2, 
                                      fontSize: '0.95rem', 
                                      color: '#2c3e50',
                                      fontWeight: '500'
                                    }}>
                                      <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#7f8c8d', 
                                        marginBottom: '4px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}>
                                        Long Version
                                      </div>
                                      {item.Check_item_Long || item.Check_Item}
                                    </div>
                                    <div style={{ 
                                      flex: 1, 
                                      fontSize: '0.9rem', 
                                      color: '#5a6268',
                                      paddingLeft: '12px',
                                      borderLeft: '2px solid #e9ecef'
                                    }}>
                                      <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#7f8c8d', 
                                        marginBottom: '4px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}>
                                        Short Version
                                      </div>
                                      {item.Check_Item}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      style={{
                                        padding: '6px 12px',
                                        background: '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      <Edit size={14} />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(item)}
                                      style={{
                                        padding: '6px 12px',
                                        background: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add New Item */}
                      <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '2px dashed #ddd'
                      }}>
                        <h4 style={{
                          margin: '0 0 12px 0',
                          color: '#2c3e50',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Plus size={18} color="#27ae60" />
                          Add New Checklist Item
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ 
                              fontSize: '0.75rem', 
                              color: '#7f8c8d', 
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              display: 'block'
                            }}>
                              Long Version
                            </label>
                            <input
                              type="text"
                              value={newItemTextLong}
                              onChange={(e) => setNewItemTextLong(e.target.value)}
                              placeholder="Enter long version of checklist item..."
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '2px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.95rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ 
                              fontSize: '0.75rem', 
                              color: '#7f8c8d', 
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '4px',
                              display: 'block'
                            }}>
                              Short Version
                            </label>
                            <input
                              type="text"
                              value={newItemText}
                              onChange={(e) => setNewItemText(e.target.value)}
                              placeholder="Enter short version of checklist item..."
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '2px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.95rem'
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newItemText.trim() && newItemTextLong.trim()) {
                                  handleAddNewItem();
                                }
                              }}
                            />
                          </div>
                          <button
                            onClick={handleAddNewItem}
                            disabled={!newItemText.trim() || !newItemTextLong.trim()}
                            style={{
                              padding: '10px 20px',
                              background: (newItemText.trim() && newItemTextLong.trim()) ? '#27ae60' : '#95a5a6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: (newItemText.trim() && newItemTextLong.trim()) ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontSize: '0.95rem',
                              fontWeight: '600'
                            }}
                          >
                            <Plus size={16} />
                            Add Item
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!selectedCategoryForEdit && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#7f8c8d',
                  fontSize: '1rem'
                }}>
                  Please select a category to view and manage checklist items
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '28px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#e74c3c', fontSize: '1.3rem' }}>
              Delete Checklist Item?
            </h3>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '1rem' }}>
              Are you sure you want to delete this checklist item?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#2c3e50', fontSize: '0.95rem', fontWeight: '600', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
              "{itemToDelete?.Check_Item}"
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#e74c3c', fontSize: '0.9rem', fontStyle: 'italic' }}>
              ⚠️ Warning: This action cannot be undone. If this item is used in existing PM records, deletion will fail.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 20px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Dialog */}
      {showEditConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '28px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#3498db', fontSize: '1.3rem' }}>
              Update Checklist Item?
            </h3>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '1rem' }}>
              Are you sure you want to update this checklist item?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#2c3e50', fontSize: '0.95rem', fontWeight: '600', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
              "{pendingEdit?.text}"
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#f39c12', fontSize: '0.9rem', fontStyle: 'italic' }}>
              ⚠️ This will affect all assets in this category for future PM records.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Confirmation Dialog */}
      {showAddConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '28px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#27ae60', fontSize: '1.3rem' }}>
              Add New Checklist Item?
            </h3>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '1rem' }}>
              Are you sure you want to add this checklist item?
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#2c3e50', fontSize: '0.95rem', fontWeight: '600', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
              "{newItemText}"
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#27ae60', fontSize: '0.9rem', fontStyle: 'italic' }}>
              ✓ This item will be available for all future PM records in this category.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddItem}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Yes, Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Download Modal */}
      {showBulkDownloadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '95%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Download size={28} color="#27ae60" />
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2c3e50' }}>
                  Download Bulk PM Forms
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkDownloadModal(false);
                  setSelectedAssets([]);
                  setSelectedPMRecords({});
                  setBulkDownloadSearch('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#7f8c8d'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search assets by Tag ID, Item Name, Serial Number..."
                  value={bulkDownloadSearch}
                  onChange={(e) => setBulkDownloadSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
            </div>

            {/* Two Boxes Container */}
            <div style={{
              flex: 1,
              display: 'flex',
              gap: '20px',
              padding: '20px 28px',
              overflow: 'hidden'
            }}>
              {/* Left Box - Available Assets */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid #3498db',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Available Assets ({(() => {
                    const allAssets = Object.values(groupedByCategory).flatMap(cat => 
                      Object.values(cat.assets)
                    );
                    const filtered = allAssets.filter(asset => {
                      if (!bulkDownloadSearch) return true;
                      const query = bulkDownloadSearch.toLowerCase();
                      return (
                        asset.Asset_Tag_ID?.toLowerCase().includes(query) ||
                        asset.Item_Name?.toLowerCase().includes(query) ||
                        asset.Asset_Serial_Number?.toLowerCase().includes(query)
                      );
                    });
                    return filtered.length;
                  })()})
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                  {(() => {
                    const allAssets = Object.values(groupedByCategory).flatMap(cat => 
                      Object.values(cat.assets)
                    );
                    const filteredAssets = allAssets.filter(asset => {
                      if (!bulkDownloadSearch) return true;
                      const query = bulkDownloadSearch.toLowerCase();
                      return (
                        asset.Asset_Tag_ID?.toLowerCase().includes(query) ||
                        asset.Item_Name?.toLowerCase().includes(query) ||
                        asset.Asset_Serial_Number?.toLowerCase().includes(query)
                      );
                    });

                    if (filteredAssets.length === 0) {
                      return (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#999'
                        }}>
                          <Package size={48} color="#ddd" style={{ marginBottom: '12px' }} />
                          <p>No assets found</p>
                        </div>
                      );
                    }

                    return filteredAssets.map(asset => {
                      const isSelected = selectedAssets.some(a => a.Asset_ID === asset.Asset_ID);
                      return (
                        <div
                          key={asset.Asset_ID}
                          style={{
                            padding: '14px 16px',
                            marginBottom: '8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            background: isSelected ? '#e8f5e9' : 'white',
                            transition: 'all 0.2s',
                            minHeight: '70px'
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssets(selectedAssets.filter(a => a.Asset_ID !== asset.Asset_ID));
                              // Remove PM selections for this asset
                              const newPMRecords = { ...selectedPMRecords };
                              delete newPMRecords[asset.Asset_ID];
                              setSelectedPMRecords(newPMRecords);
                            } else {
                              setSelectedAssets([...selectedAssets, asset]);
                            }
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'white';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
                                {asset.Asset_Tag_ID}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>
                                {asset.Asset_Serial_Number || 'N/A'}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {asset.Item_Name}
                            </div>
                          </div>
                          {isSelected && <ChevronRight size={20} color="#27ae60" style={{ flexShrink: 0 }} />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Box - Selected Assets with PM Records */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid #27ae60',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #27ae60, #229954)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Selected Assets ({selectedAssets.length})
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                  {selectedAssets.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#999'
                    }}>
                      <ChevronLeft size={48} color="#ddd" style={{ marginBottom: '12px' }} />
                      <p>Select assets from the left to add PM records</p>
                    </div>
                  ) : (
                    selectedAssets.map(asset => {
                      const assetPMRecords = asset.allPMRecords || [];
                      const selectedPMs = selectedPMRecords[asset.Asset_ID] || [];
                      
                      return (
                        <div
                          key={asset.Asset_ID}
                          style={{
                            marginBottom: '8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Asset Row with PM Selection Inline */}
                          <div style={{
                            padding: '14px 16px',
                            background: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            justifyContent: 'space-between',
                            minHeight: '70px'
                          }}>
                            {/* Asset Info */}
                            <div style={{ flex: '0 0 auto', minWidth: '180px', maxWidth: '180px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
                                  {asset.Asset_Tag_ID}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>
                                  {asset.Asset_Serial_Number || 'N/A'}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {asset.Item_Name}
                              </div>
                            </div>

                            {/* PM Records Selection - Horizontal in same row */}
                            {assetPMRecords.length === 0 ? (
                              <div style={{ 
                                fontSize: '0.85rem', 
                                color: '#999',
                                fontStyle: 'italic',
                                flex: 1
                              }}>
                                No PM records available
                              </div>
                            ) : (
                              <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  fontSize: '0.85rem',
                                  color: '#666',
                                  fontWeight: '600',
                                  marginRight: '4px'
                                }}>
                                  PM:
                                </span>
                                {assetPMRecords.map((pm, index) => {
                                  const isPMSelected = selectedPMs.includes(pm.PM_ID);
                                  return (
                                    <div
                                      key={pm.PM_ID}
                                      style={{
                                        padding: '6px 12px',
                                        border: isPMSelected ? '2px solid #3498db' : '1px solid #ddd',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        background: isPMSelected ? '#e3f2fd' : 'white',
                                        transition: 'all 0.2s',
                                        fontSize: '0.85rem',
                                        fontWeight: isPMSelected ? '600' : '500',
                                        color: isPMSelected ? '#2c3e50' : '#666',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isPMSelected ? '0 2px 4px rgba(52, 152, 219, 0.2)' : 'none'
                                      }}
                                      onClick={() => {
                                        const currentPMs = selectedPMRecords[asset.Asset_ID] || [];
                                        if (isPMSelected) {
                                          setSelectedPMRecords({
                                            ...selectedPMRecords,
                                            [asset.Asset_ID]: currentPMs.filter(id => id !== pm.PM_ID)
                                          });
                                        } else {
                                          setSelectedPMRecords({
                                            ...selectedPMRecords,
                                            [asset.Asset_ID]: [...currentPMs, pm.PM_ID]
                                          });
                                        }
                                      }}
                                      onMouseOver={(e) => {
                                        if (!isPMSelected) {
                                          e.currentTarget.style.background = '#f0f0f0';
                                          e.currentTarget.style.borderColor = '#3498db';
                                        }
                                      }}
                                      onMouseOut={(e) => {
                                        if (!isPMSelected) {
                                          e.currentTarget.style.background = 'white';
                                          e.currentTarget.style.borderColor = '#ddd';
                                        }
                                      }}
                                      title={`PM Date: ${formatDate(pm.PM_Date)}`}
                                    >
                                      {isPMSelected && <span style={{ marginRight: '4px', color: '#27ae60' }}>✓</span>}
                                      {index + 1}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Remove Button */}
                            <button
                              onClick={() => {
                                setSelectedAssets(selectedAssets.filter(a => a.Asset_ID !== asset.Asset_ID));
                                const newPMRecords = { ...selectedPMRecords };
                                delete newPMRecords[asset.Asset_ID];
                                setSelectedPMRecords(newPMRecords);
                              }}
                              style={{
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'background 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#c0392b'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#e74c3c'}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Download Button */}
            <div style={{
              padding: '20px 28px',
              borderTop: '2px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ color: '#666', fontSize: '0.95rem' }}>
                {(() => {
                  const totalSelected = Object.values(selectedPMRecords).reduce((sum, pms) => sum + pms.length, 0);
                  return (
                    <>
                      <strong>{selectedAssets.length}</strong> asset{selectedAssets.length !== 1 ? 's' : ''} selected, 
                      <strong> {totalSelected}</strong> PM record{totalSelected !== 1 ? 's' : ''} to download
                    </>
                  );
                })()}
              </div>
              <button
                onClick={async () => {
                  // TODO: Implement PDF download
                  const totalSelected = Object.values(selectedPMRecords).reduce((sum, pms) => sum + pms.length, 0);
                  if (totalSelected === 0) {
                    alert('Please select at least one PM record to download');
                    return;
                  }
                  
                  setDownloadingPDF(true);
                  try {
                    // Get customer and branch names
                    const customerName = customers.find(c => c.Customer_ID == selectedCustomer)?.Customer_Name || 'Customer';
                    const branchName = selectedBranch;
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    const filename = `${customerName}_${branchName}_${timestamp}.pdf`;
                    
                    // Prepare data for backend
                    const pmIds = Object.values(selectedPMRecords).flat();
                    
                    // Call backend API to generate PDF
                    const token = localStorage.getItem('authToken');
                    const response = await fetch('http://localhost:5000/api/v1/pm/bulk-download', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ pmIds })
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      const errorMessage = errorData.message || errorData.error || 'Failed to generate PDF';
                      throw new Error(errorMessage);
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    // Close modal and reset
                    setShowBulkDownloadModal(false);
                    setSelectedAssets([]);
                    setSelectedPMRecords({});
                    setBulkDownloadSearch('');
                  } catch (error) {
                    console.error('Error downloading PDF:', error);
                    alert(`Failed to download PDF: ${error.message}`);
                  } finally {
                    setDownloadingPDF(false);
                  }
                }}
                disabled={downloadingPDF || Object.values(selectedPMRecords).reduce((sum, pms) => sum + pms.length, 0) === 0}
                style={{
                  padding: '14px 32px',
                  background: downloadingPDF ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: downloadingPDF ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  if (!downloadingPDF && Object.values(selectedPMRecords).reduce((sum, pms) => sum + pms.length, 0) > 0) {
                    e.currentTarget.style.background = '#229954';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!downloadingPDF) {
                    e.currentTarget.style.background = '#27ae60';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <Download size={18} />
                {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreventiveMaintenance;