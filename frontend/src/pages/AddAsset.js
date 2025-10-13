import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';

const AddAsset = ({ onAdd }) => {
  const navigate = useNavigate();
  const [asset, setAsset] = useState({
    name: '',
    category: '',
    status: 'Active',
    location: '',
    value: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...asset, value: parseFloat(asset.value) });
    navigate('/inventory');
  };

  const handleChange = (e) => {
    setAsset({ ...asset, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/inventory')} className="btn btn-secondary" style={{ marginRight: '15px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1>Add New Asset</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Asset Name *</label>
              <input
                type="text"
                name="name"
                value={asset.name}
                onChange={handleChange}
                placeholder="Enter asset name"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={asset.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Equipment">Equipment</option>
                <option value="Software">Software</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={asset.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={asset.location}
                onChange={handleChange}
                placeholder="Enter location"
                required
              />
            </div>

            <div className="form-group">
              <label>Value ($) *</label>
              <input
                type="number"
                name="value"
                value={asset.value}
                onChange={handleChange}
                placeholder="Enter value"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={asset.description}
              onChange={handleChange}
              placeholder="Enter asset description"
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} style={{ marginRight: '5px' }} />
              Save Asset
            </button>
            <button type="button" onClick={() => navigate('/inventory')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAsset;