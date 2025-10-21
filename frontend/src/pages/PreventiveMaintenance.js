import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench, Filter, Building2, MapPin, Package, FileText, X } from 'lucide-react';

const PreventiveMaintenance = () => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pmRecords, setPmRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Group PM records by category and collect checklist items
  const groupedByCategory = pmRecords.reduce((acc, record) => {
    const category = record.Category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = {
        records: [],
        checklistItems: []
      };
    }
    acc[category].records.push(record);
    
    // Collect unique checklist items for this category
    if (record.checklist_results && record.checklist_results.length > 0) {
      record.checklist_results.forEach(item => {
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
          const { records, checklistItems } = groupedByCategory[category];
          
          return (
            <div key={category} className="card" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '3px solid #27ae60' }}>
                <Wrench size={28} color="#27ae60" />
                <div>
                  <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>
                    {category} ({records.length})
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
                      <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 10, minWidth: '120px' }}>Asset Tag ID</th>
                      <th style={{ minWidth: '150px' }}>Item Name</th>
                      <th style={{ minWidth: '150px' }}>Serial Number</th>
                      <th style={{ minWidth: '100px' }}>PM Date</th>
                      {checklistItems.map((item) => (
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
                    {records.map((record) => {
                      // Create a map of checklist results for quick lookup
                      const resultsMap = {};
                      if (record.checklist_results) {
                        record.checklist_results.forEach(result => {
                          resultsMap[result.Checklist_ID] = result.Is_OK_bool;
                        });
                      }

                      return (
                        <tr key={record.PM_ID}>
                          <td style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            position: 'sticky',
                            left: 0,
                            background: 'white',
                            zIndex: 5
                          }}>
                            {record.Asset_Tag_ID || 'N/A'}
                          </td>
                          <td style={{ fontWeight: '500' }}>{record.Item_Name || 'N/A'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                            {record.Asset_Serial_Number || 'N/A'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Calendar size={14} color="#666" />
                              {formatDate(record.PM_Date)}
                            </div>
                          </td>
                          {checklistItems.map((item) => (
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
                      {records.length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Checklist Items:</span>
                    <strong style={{ marginLeft: '8px', color: '#3498db', fontSize: '1.1rem' }}>
                      {checklistItems.length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>PM Date:</span>
                    <strong style={{ marginLeft: '8px', color: '#7f8c8d', fontSize: '1rem' }}>
                      {formatDate(records[0]?.PM_Date)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PreventiveMaintenance;