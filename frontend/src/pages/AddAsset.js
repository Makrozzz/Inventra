import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Package, Building2, MapPin } from 'lucide-react';
import apiService from '../services/apiService';

const AddAsset = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Dropdowns data
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);

  // Form data
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const [asset, setAsset] = useState({
    Asset_Serial_Number: '',
    Asset_Tag_ID: '',
    Item_Name: '',
    Status: 'Active',
    Category_ID: '',
    Model_ID: ''
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchModels();
  }, []);

  // Fetch branches when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchBranches(selectedProject);
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects();
      setProjects(response || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    }
  };

  const fetchBranches = async (projectId) => {
    try {
      // Get inventory records for this project to find branches
      const response = await apiService.getInventoryByProject(projectId);

      // Extract unique branches from inventory
      const uniqueBranches = response.reduce((acc, inv) => {
        const key = `${inv.Customer_ID}-${inv.Branch}`;
        if (!acc.find(b => b.key === key)) {
          acc.push({
            key: key,
            Customer_ID: inv.Customer_ID,
            Customer_Ref_Number: inv.Customer_Ref_Number,
            Customer_Name: inv.Customer_Name,
            Branch: inv.Branch
          });
        }
        return acc;
      }, []);

      setBranches(uniqueBranches);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches');
    }
  };

  const fetchCategories = async () => {
    try {
      // You'll need to create this endpoint or use existing data
      // For now, using hardcoded categories
      setCategories([
        { Category_ID: 1, Category: 'Desktop' },
        { Category_ID: 2, Category: 'Printer' },
        { Category_ID: 3, Category: 'Laptop' },
        { Category_ID: 4, Category: 'Server' }
      ]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchModels = async () => {
    try {
      // You'll need to create this endpoint or use existing data
      // For now, using hardcoded models
      setModels([
        { Model_ID: 1, Model: 'Dell OptiPlex All-in-One Plus 7420' },
        { Model_ID: 2, Model: 'HP Color LaserJet Enterprise MFP M480f' },
        { Model_ID: 3, Model: 'Lenovo ThinkPad X1 Carbon' },
        { Model_ID: 4, Model: 'Dell PowerEdge R740' }
      ]);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    if (!selectedBranch) {
      setError('Please select a branch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create the asset
      const assetResponse = await apiService.createAsset(asset);
      console.log('Asset created:', assetResponse);

      // Step 2: Update INVENTORY record with the new Asset_ID
      const selectedBranchData = branches.find(b => b.key === selectedBranch);

      await apiService.updateInventoryWithAsset(
        selectedProject,
        selectedBranchData.Customer_ID,
        assetResponse.data.Asset_ID
      );

      setSuccess(true);
      setTimeout(() => {
        navigate('/assets');
      }, 1500);

    } catch (err) {
      console.error('Error creating asset:', err);
      setError(err.message || 'Failed to create asset');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAsset({ ...asset, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2>✅ Asset Created Successfully!</h2>
          <p>Redirecting to assets page...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/assets')} className="btn btn-secondary" style={{ marginRight: '15px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1>Add New Asset</h1>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Project and Branch Selection Section */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '25px'
          }}>
            <h3 style={{
              color: '#1976d2',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Building2 size={20} />
              Project & Branch Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Project *</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.Project_ID} value={project.Project_ID}>
                      {project.Project_Ref_Number} - {project.Project_Title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Branch *</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  required
                  disabled={!selectedProject}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.key} value={branch.key}>
                      {branch.Customer_Name} - {branch.Branch}
                    </option>
                  ))}
                </select>
                {!selectedProject && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Please select a project first
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Asset Information Section */}
          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '25px'
          }}>
            <h3 style={{
              color: '#7b1fa2',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Package size={20} />
              Asset Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  name="Asset_Serial_Number"
                  value={asset.Asset_Serial_Number}
                  onChange={handleChange}
                  placeholder="e.g., 78HT574"
                  required
                />
              </div>

              <div className="form-group">
                <label>Asset Tag ID *</label>
                <input
                  type="text"
                  name="Asset_Tag_ID"
                  value={asset.Asset_Tag_ID}
                  onChange={handleChange}
                  placeholder="e.g., NADMA-A25001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  name="Item_Name"
                  value={asset.Item_Name}
                  onChange={handleChange}
                  placeholder="e.g., Komputer Meja (All-in-One)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="Status" value={asset.Status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="Category_ID"
                  value={asset.Category_ID}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.Category_ID} value={cat.Category_ID}>
                      {cat.Category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Model *</label>
                <select
                  name="Model_ID"
                  value={asset.Model_ID}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Model</option>
                  {models.map(model => (
                    <option key={model.Model_ID} value={model.Model_ID}>
                      {model.Model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} style={{ marginRight: '5px' }} />
              {loading ? 'Saving...' : 'Save Asset'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAsset;