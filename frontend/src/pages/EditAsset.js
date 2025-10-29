import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Info, AlertCircle, CheckCircle, X } from 'lucide-react';
import apiService from '../services/apiService';

const EditAsset = ({ onUpdate }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [updating, setUpdating] = useState(false);
  const [asset, setAsset] = useState({
    Asset_Serial_Number: '',
    Asset_Tag_ID: '',
    Item_Name: '',
    Status: 'Active',
    Recipients_ID: '',
    Category_ID: '',
    Model_ID: '',
    Recipient_Name: '',
    Department: '',
    Category: '',
    Model: ''
  });

  // Fetch the current asset data
  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching asset data (bypassing authentication)...');
        
        const assetData = await apiService.getAssetByIdDirect(id);
        
        setCurrentAsset(assetData);
        // Keep form fields blank for editing, but store current data for placeholders
        setAsset({
          Asset_Serial_Number: '',
          Asset_Tag_ID: '',
          Item_Name: '',
          Status: '',
          Recipients_ID: '',
          Category_ID: '',
          Model_ID: '',
          Recipient_Name: '',
          Department: '',
          Category: '',
          Model: ''
        });
      } catch (err) {
        console.error('Error fetching asset:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Bypassing authentication - login is in mock mode');
      
      // Filter out empty fields - only send fields that have been modified
      const updateData = {};
      Object.keys(asset).forEach(key => {
        if (asset[key] && asset[key].trim() !== '') {
          updateData[key] = asset[key];
        }
      });

      // If no fields were modified, show a message
      if (Object.keys(updateData).length === 0) {
        setError('No changes made to update.');
        return;
      }

      // Store pending changes and show confirmation modal
      setPendingChanges(updateData);
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Error preparing update:', err);
      setError(`Failed to prepare update: ${err.message}`);
    }
  };

  const handleConfirmUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);

      console.log('Attempting to update asset with data:', pendingChanges);
      const updatedAsset = await apiService.updateAssetByIdDirect(id, pendingChanges);
      console.log('Asset updated successfully:', updatedAsset);

      // Call the parent component's onUpdate if provided
      if (onUpdate) {
        onUpdate(id, updatedAsset);
      }

      setShowConfirmModal(false);
      navigate(-1);
    } catch (err) {
      console.error('Error updating asset:', err);
      setError(`Failed to update asset: ${err.message}`);
      setUpdating(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowConfirmModal(false);
    setPendingChanges({});
    console.log('Asset update cancelled by user');
  };

  const handleChange = (e) => {
    setAsset({ ...asset, [e.target.name]: e.target.value });
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;

    const changedFields = Object.keys(pendingChanges).map(key => ({
      field: key.replace(/_/g, ' '),
      currentValue: currentAsset?.[key] || 'N/A',
      newValue: pendingChanges[key]
    }));

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid #e1e8ed'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              padding: '12px',
              marginRight: '16px'
            }}>
              <AlertCircle size={24} color="#d97706" />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                Confirm Asset Update
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                Review the changes before updating the asset
              </p>
            </div>
          </div>

          {/* Changes List */}
          <div style={{
            marginBottom: '24px'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#374151',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              Changes to be made:
            </h4>
            
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {changedFields.map((change, index) => (
                <div key={index} style={{
                  marginBottom: index < changedFields.length - 1 ? '12px' : '0',
                  paddingBottom: index < changedFields.length - 1 ? '12px' : '0',
                  borderBottom: index < changedFields.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {change.field}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{
                      color: '#6b7280',
                      backgroundColor: '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {change.currentValue}
                    </span>
                    <ArrowLeft size={16} color="#6b7280" style={{ transform: 'rotate(180deg)' }} />
                    <span style={{
                      color: '#059669',
                      backgroundColor: '#ecfdf5',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: '600',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {change.newValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{
              margin: 0,
              color: '#dc2626',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              ⚠️ This action cannot be undone. Make sure all changes are correct.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleCancelUpdate}
              disabled={updating}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: updating ? 0.6 : 1
              }}
            >
              <X size={16} />
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleConfirmUpdate}
              disabled={updating}
              style={{
                padding: '12px 24px',
                backgroundColor: updating ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {updating ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm Update
                </>
              )}
            </button>
          </div>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginRight: '15px' }}>
            <ArrowLeft size={16} />
          </button>
          <h1>Edit Asset</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading asset data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginRight: '15px' }}>
            <ArrowLeft size={16} />
          </button>
          <h1>Edit Asset</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
            <AlertCircle size={48} style={{ marginBottom: '20px' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Error: {error}</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginRight: '15px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1>Edit Asset: {currentAsset?.Item_Name}</h1>
      </div>

      {/* Current Asset Information Display */}
      <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', border: '2px solid #e9ecef' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <Info size={20} style={{ marginRight: '8px', color: '#3498db' }} />
          <span style={{ 
            marginLeft: 'auto', 
            padding: '4px 8px', 
            backgroundColor: '#ffeaa7', 
            color: '#d63031', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            Asset ID is Read-Only
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', fontSize: '0.9rem' }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff5f5', 
            borderRadius: '6px', 
            border: '2px solid #fed7d7',
            position: 'relative'
          }}>
            <strong style={{ color: '#c53030', display: 'block', marginBottom: '4px' }}>Asset ID (Read-Only):</strong>
            <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '1.1rem' }}>{currentAsset?.Asset_ID}</span>
            <div style={{ 
              position: 'absolute', 
              top: '5px', 
              right: '5px', 
              fontSize: '0.7rem', 
              color: '#c53030',
              fontWeight: '600'
            }}>
              🔒
            </div>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Serial Number:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Asset_Serial_Number || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Tag ID:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Asset_Tag_ID || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Category:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Category || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Model:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Model || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Assigned Recipient:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Recipient_Name || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Department:</strong>
            <span style={{ color: '#2c3e50', fontWeight: '600' }}>{currentAsset?.Department || 'N/A'}</span>
          </div>
          
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <strong style={{ color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>Current Status:</strong>
            <span className={`status-badge status-${(currentAsset?.Status || '').toLowerCase()}`}>
              {currentAsset?.Status || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Asset Attributes Form */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e9ecef', paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Edit Asset Attributes</h3>
          <span style={{ 
            marginLeft: 'auto', 
            padding: '6px 12px', 
            backgroundColor: '#dff0d8', 
            color: '#3c763d', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            ✏️ Editable Fields
          </span>
        </div>
        
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #bbdefb', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#1565c0'
        }}>
          💡 <strong>How to edit:</strong> Fill in only the fields you want to change. Leave fields blank to keep current values. Current values are shown in grey placeholders for reference.
        </div>

        <style>
          {`
            .edit-form input::placeholder,
            .edit-form select::placeholder,
            .edit-form select option:first-child {
              color: #9ca3af !important;
              opacity: 0.8;
            }
            .edit-form input::-webkit-input-placeholder {
              color: #9ca3af !important;
              opacity: 0.8;
            }
            .edit-form input::-moz-placeholder {
              color: #9ca3af !important;
              opacity: 0.8;
            }
            .edit-form input:-ms-input-placeholder {
              color: #9ca3af !important;
              opacity: 0.8;
            }
            .edit-form select option:first-child {
              color: #9ca3af !important;
            }
            .edit-form select:invalid {
              color: #9ca3af;
            }
            .edit-form select:valid {
              color: #2c3e50;
            }
            .form-group {
              margin-bottom: 20px;
            }
            .form-group label {
              display: block;
              margin-bottom: 5px;
              font-weight: 600;
              color: #2c3e50;
            }
            .form-group input,
            .form-group select {
              width: 100%;
              padding: 12px;
              border: 2px solid #e1e8ed;
              border-radius: 6px;
              font-size: 14px;
              transition: border-color 0.3s ease;
            }
            .form-group input:focus,
            .form-group select:focus {
              outline: none;
              border-color: #3498db;
              box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            .current-value-hint {
              color: #6c757d;
              font-size: 0.8rem;
              margin-top: 4px;
              font-style: italic;
            }
          `}
        </style>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Asset Serial Number</label>
              <input
                type="text"
                name="Asset_Serial_Number"
                value={asset.Asset_Serial_Number}
                onChange={handleChange}
                placeholder={currentAsset?.Asset_Serial_Number || 'Enter serial number...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Asset_Serial_Number || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Asset Tag ID</label>
              <input
                type="text"
                name="Asset_Tag_ID"
                value={asset.Asset_Tag_ID}
                onChange={handleChange}
                placeholder={currentAsset?.Asset_Tag_ID || 'Enter tag ID...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Asset_Tag_ID || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                name="Item_Name"
                value={asset.Item_Name}
                onChange={handleChange}
                placeholder={currentAsset?.Item_Name || 'Enter item name...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Item_Name || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select 
                name="Status" 
                value={asset.Status} 
                onChange={handleChange}
              >
                <option value="">
                  {currentAsset?.Status ? `Current: ${currentAsset.Status}` : 'Select status...'}
                </option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
                <option value="Under Repair">Under Repair</option>
              </select>
              <div className="current-value-hint">
                Current: {currentAsset?.Status || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Assigned Recipient</label>
              <input
                type="text"
                name="Recipient_Name"
                value={asset.Recipient_Name || ''}
                onChange={handleChange}
                placeholder={currentAsset?.Recipient_Name || 'Enter recipient name...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Recipient_Name || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="Department"
                value={asset.Department || ''}
                onChange={handleChange}
                placeholder={currentAsset?.Department || 'Enter department...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Department || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="Category"
                value={asset.Category || ''}
                onChange={handleChange}
                placeholder={currentAsset?.Category || 'Enter category...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Category || 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="Model"
                value={asset.Model || ''}
                onChange={handleChange}
                placeholder={currentAsset?.Model || 'Enter model...'}
              />
              <div className="current-value-hint">
                Current: {currentAsset?.Model || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              <Save size={16} style={{ marginRight: '8px' }} />
              Update Asset
            </button>
            <button type="button" onClick={() => navigate('/assets')} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal />
    </div>
  );
};

export default EditAsset;