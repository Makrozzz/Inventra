import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench, Filter, Building2, MapPin, Package, FileText, X, ClipboardCheck } from 'lucide-react';

const PreventiveMaintenance = () => {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
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
  const [pmRemarks, setPmRemarks] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchBranches(selectedCustomer);
      setSelectedBranch('');
      setPmRecords([]);
    } else {
      setBranches([]);
      setSelectedBranch('');
      setPmRecords([]);
    }
  }, [selectedCustomer]);

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

  // Group PM records by category and asset, keeping only latest PM per asset
  const groupedByCategory = pmRecords.reduce((acc, record) => {
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
    
    // If this asset doesn't exist yet, or if this record is newer, update it
    if (!acc[category].assets[assetId]) {
      acc[category].assets[assetId] = {
        ...record,
        pmCount: 1,
        latestPMDate: record.PM_Date,
        allPMRecords: [{ PM_ID: record.PM_ID, PM_Date: record.PM_Date }]
      };
    } else {
      // Store current values
      const currentPmCount = acc[category].assets[assetId].pmCount;
      const currentAllPMRecords = acc[category].assets[assetId].allPMRecords;
      
      // Increment PM count and add new PM record
      acc[category].assets[assetId].pmCount = currentPmCount + 1;
      acc[category].assets[assetId].allPMRecords = [...currentAllPMRecords, { PM_ID: record.PM_ID, PM_Date: record.PM_Date }];
      
      // If this PM is newer, update to use its checklist results
      const existingDate = new Date(acc[category].assets[assetId].latestPMDate);
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

  // PM Form Handlers
  const handleOpenPMForm = async (asset) => {
    setSelectedAsset(asset);
    setShowPMForm(true);
    setPmRemarks('');
    setChecklistResults({});
    
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
    setPmRemarks('');
  };

  const handleChecklistChange = (checklistId, isOk) => {
    setChecklistResults(prev => ({
      ...prev,
      [checklistId]: isOk
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
        Remarks: null
      }));

      // Submit PM record
      const response = await fetch('http://localhost:5000/api/v1/pm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      setPmRemarks('');
    } catch (err) {
      console.error('Error submitting PM record:', err);
      alert('Failed to submit PM record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Preventive Maintenance</h1>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
            Monitor and manage preventive maintenance schedules with detailed checklists
          </p>
        </div>
      </div>

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
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '1rem', backgroundColor: 'white', cursor: 'pointer', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#3498db'} onBlur={(e) => e.target.style.borderColor = '#ddd'}>
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
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} disabled={!selectedCustomer} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '1rem', backgroundColor: selectedCustomer ? 'white' : '#f5f5f5', cursor: selectedCustomer ? 'pointer' : 'not-allowed', opacity: selectedCustomer ? 1 : 0.6, transition: 'border-color 0.2s' }} onFocus={(e) => selectedCustomer && (e.target.style.borderColor = '#e74c3c')} onBlur={(e) => e.target.style.borderColor = '#ddd'}>
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
                      <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 10, minWidth: '120px', textAlign: 'center' }}>Asset Tag ID</th>
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
                              {formatDate(asset.latestPMDate)}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {/* PM Count Badge */}
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '12px',
                              fontSize: '0.9rem',
                              fontWeight: '700',
                              background: '#e3f2fd',
                              color: '#1565c0',
                              border: '1px solid #90caf9',
                              minWidth: '35px',
                              display: 'inline-block'
                            }}>
                              {asset.pmCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {/* Individual PM Buttons */}
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {asset.allPMRecords && asset.allPMRecords
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
                                ))}
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
                        background: index % 2 === 0 ? 'white' : '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#7f8c8d', fontSize: '0.75rem', marginRight: '8px' }}>
                          #{index + 1}
                        </span>
                        <span style={{ color: '#2c3e50', fontSize: '0.95rem', fontWeight: '500' }}>
                          {item.Check_Item}
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
    </div>
  );
};

export default PreventiveMaintenance;