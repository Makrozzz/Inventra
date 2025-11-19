import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle, CheckCircle, X } from 'lucide-react';

const EditAsset = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('asset');
  
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    // Asset Info
    Asset_Serial_Number: '',
    Asset_Tag_ID: '',
    Item_Name: '',
    Status: 'Active',
    Windows: '',
    Microsoft_Office: '',
    Monthly_Prices: '',
    
    // Customer Info
    Customer_Name: '',
    Customer_Ref_Number: '',
    Branch: '',
    Recipient_Name: '',
    Department: '',
    Position: '',
    
    // Project Info
    Project_Ref_Number: '',
    Warranty: '',
    Start_Date: '',
    End_Date: ''
  });

  // Fetch asset data on component mount
  useEffect(() => {
    fetchAssetData();
  }, [id]);

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching asset data for editing, ID:', id);
      
      const response = await fetch(`http://localhost:5000/api/v1/assets/detail/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Asset data loaded:', data);
      
      // Store original data for comparison
      setOriginalData(data);
      
      // Populate form with current data
      setFormData({
        Asset_Serial_Number: data.Asset_Serial_Number || '',
        Asset_Tag_ID: data.Asset_Tag_ID || '',
        Item_Name: data.Item_Name || '',
        Status: data.Status || 'Active',
        Windows: data.Windows || '',
        Microsoft_Office: data.Microsoft_Office || '',
        Monthly_Prices: data.Monthly_Prices || '',
        Customer_Name: data.Customer_Name || '',
        Customer_Ref_Number: data.Customer_Ref_Number || '',
        Branch: data.Branch || '',
        Recipient_Name: data.Recipient_Name || '',
        Department: data.Department || '',
        Position: data.Position || '',
        Project_Ref_Number: data.Project_Ref_Number || '',
        Warranty: data.Warranty || '',
        Start_Date: data.Start_Date ? data.Start_Date.split('T')[0] : '',
        End_Date: data.End_Date ? data.End_Date.split('T')[0] : ''
      });
      
    } catch (err) {
      console.error('❌ Error fetching asset:', err);
      setError(err.message || 'Failed to load asset data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.Asset_Serial_Number || !formData.Asset_Tag_ID || !formData.Item_Name) {
      setError('Serial Number, Tag ID, and Item Name are required fields');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      console.log('🔄 Updating asset:', formData);
      
      const response = await fetch(`http://localhost:5000/api/v1/assets/id/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update asset');
      }
      
      const result = await response.json();
      console.log('✅ Asset updated successfully:', result);
      
      setSuccess('Asset updated successfully!');
      
      // Redirect to asset detail page after 1.5 seconds
      setTimeout(() => {
        navigate(`/asset-detail/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error updating asset:', err);
      setError(err.message || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/assets');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading asset data...</div>
        </div>
      </div>
    );
  }

  if (error && !formData.Asset_Serial_Number) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={48} color="#e74c3c" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>Error Loading Asset</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate('/assets')} className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <button onClick={handleCancel} className="btn btn-secondary" style={{ marginBottom: '10px' }}>
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back
          </button>
          <h1 className="page-title">Edit Asset</h1>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
            Update asset information • ID: {id}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '15px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '15px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#721c24'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '20px', padding: 0 }}>
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e9ecef',
          background: '#f8f9fa'
        }}>
          <button
            onClick={() => setActiveTab('asset')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: activeTab === 'asset' ? 'white' : 'transparent',
              borderBottom: activeTab === 'asset' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'asset' ? '#667eea' : '#6c757d',
              fontWeight: activeTab === 'asset' ? '600' : '500',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📦 Asset Info
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: activeTab === 'customer' ? 'white' : 'transparent',
              borderBottom: activeTab === 'customer' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'customer' ? '#667eea' : '#6c757d',
              fontWeight: activeTab === 'customer' ? '600' : '500',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            🏢 Customer Info
          </button>
          <button
            onClick={() => setActiveTab('project')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: activeTab === 'project' ? 'white' : 'transparent',
              borderBottom: activeTab === 'project' ? '3px solid #667eea' : '3px solid transparent',
              color: activeTab === 'project' ? '#667eea' : '#6c757d',
              fontWeight: activeTab === 'project' ? '600' : '500',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📋 Project Info
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Tab 1: Asset Info */}
          {activeTab === 'asset' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Asset Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div className="form-group">
                  <label>Serial Number <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    name="Asset_Serial_Number"
                    value={formData.Asset_Serial_Number}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tag ID <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    name="Asset_Tag_ID"
                    value={formData.Asset_Tag_ID}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Item Name <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    name="Item_Name"
                    value={formData.Item_Name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="Status"
                    value={formData.Status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Windows Version</label>
                  <select
                    name="Windows"
                    value={formData.Windows}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      {originalData?.Windows ? ` ${originalData.Windows}` : 'Select Windows Version'}
                    </option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="Windows Server">Windows Server</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Microsoft Office</label>
                  <select
                    name="Microsoft_Office"
                    value={formData.Microsoft_Office}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      {originalData?.Microsoft_Office ? ` ${originalData.Microsoft_Office}` : 'Select Office Version'}
                    </option>
                    <option value="Office 2019">Office 2019</option>
                    <option value="Office 2021">Office 2021</option>
                    <option value="Microsoft 365">Microsoft 365</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Monthly Price (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="Monthly_Prices"
                    value={formData.Monthly_Prices}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Customer Info */}
          {activeTab === 'customer' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Customer & Recipient Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="Customer_Name"
                    value={formData.Customer_Name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Reference</label>
                  <input
                    type="text"
                    name="Customer_Ref_Number"
                    value={formData.Customer_Ref_Number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Branch / Location</label>
                  <input
                    type="text"
                    name="Branch"
                    value={formData.Branch}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Recipient Name</label>
                  <input
                    type="text"
                    name="Recipient_Name"
                    value={formData.Recipient_Name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="Position"
                    value={formData.Position}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Department</label>
                  <input
                    type="text"
                    name="Department"
                    value={formData.Department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Project Info */}
          {activeTab === 'project' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Project Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Project Reference Number</label>
                  <input
                    type="text"
                    name="Project_Ref_Number"
                    value={formData.Project_Ref_Number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Warranty</label>
                  <input
                    type="text"
                    name="Warranty"
                    value={formData.Warranty}
                    onChange={handleInputChange}
                    placeholder="e.g., 3 years manufacturer warranty"
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="Start_Date"
                    value={formData.Start_Date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="End_Date"
                    value={formData.End_Date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'flex-end' 
        }}>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={saving}
          >
            <X size={16} style={{ marginRight: '5px' }} />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={16} style={{ marginRight: '5px' }} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAsset;
