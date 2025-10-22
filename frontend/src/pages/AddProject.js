import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, FileText, User, Shield, Wrench, Building2, MapPin, X } from 'lucide-react';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [project, setProject] = useState({
    Project_Ref_Number: '',
    Project_Title: '',
    Solution_Principal: '',
    Warranty: '',
    Preventive_Maintenance: '',
    Start_Date: '',
    End_Date: ''
  });
  
  // Customer information
  const [customer, setCustomer] = useState({
    Customer_Ref_Number: '',
    Customer_Name: ''
  });
  
  // Branches as an array
  const [branches, setBranches] = useState(['']);
  const [branchInput, setBranchInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate branches
    const validBranches = branches.filter(b => b.trim() !== '');
    if (validBranches.length === 0) {
      setError('Please add at least one branch');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        project,
        customer: {
          ...customer,
          branches: validBranches
        }
      };
      
      console.log('Submitting project data:', payload);
      
      const response = await fetch('http://localhost:5000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
      }

      const newProject = await response.json();
      console.log('Project created successfully:', newProject);
      
      // Navigate back to projects page
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message || 'Failed to create project. Please try again. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const addBranch = () => {
    if (branchInput.trim() !== '') {
      setBranches([...branches, branchInput.trim()]);
      setBranchInput('');
    }
  };

  const removeBranch = (index) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  const handleBranchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBranch();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/projects')} className="btn btn-secondary" style={{ marginRight: '15px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title">Add New Project</h1>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Customer Information Section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '20px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #4CAF50',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Building2 size={20} />
              Customer Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>
                  <FileText size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  Customer Reference Number *
                </label>
                <input
                  type="text"
                  name="Customer_Ref_Number"
                  value={customer.Customer_Ref_Number}
                  onChange={handleCustomerChange}
                  placeholder="e.g., M24051"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Building2 size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="Customer_Name"
                  value={customer.Customer_Name}
                  onChange={handleCustomerChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
            </div>

            {/* Branches Section */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>
                <MapPin size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Branches * (Press Enter or click Add to add multiple branches)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  onKeyPress={handleBranchKeyPress}
                  placeholder="e.g., Putrajaya"
                />
                <button 
                  type="button" 
                  onClick={addBranch}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Add Branch
                </button>
              </div>
              
              {/* Display added branches */}
              {branches.filter(b => b.trim() !== '').length > 0 && (
                <div style={{ 
                  marginTop: '15px', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '10px' 
                }}>
                  {branches.map((branch, index) => 
                    branch.trim() !== '' && (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#e8f5e9',
                          border: '1px solid #4CAF50',
                          borderRadius: '20px',
                          fontSize: '14px'
                        }}
                      >
                        <MapPin size={14} color="#4CAF50" />
                        <span>{branch}</span>
                        <button
                          type="button"
                          onClick={() => removeBranch(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X size={16} color="#666" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Project Information Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '20px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #2196F3',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FileText size={20} />
              Project Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>
                <FileText size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Project Reference Number *
              </label>
              <input
                type="text"
                name="Project_Ref_Number"
                value={project.Project_Ref_Number}
                onChange={handleChange}
                placeholder="e.g., PRJ-2024-001"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FileText size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Project Title *
              </label>
              <input
                type="text"
                name="Project_Title"
                value={project.Project_Title}
                onChange={handleChange}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <User size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Solution Principal
              </label>
              <input
                type="text"
                name="Solution_Principal"
                value={project.Solution_Principal}
                onChange={handleChange}
                placeholder="Enter solution principal name"
              />
            </div>

            <div className="form-group">
              <label>
                <Shield size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Warranty
              </label>
              <input
                type="text"
                name="Warranty"
                value={project.Warranty}
                onChange={handleChange}
                placeholder="e.g., 2 Years Extended"
              />
            </div>

            <div className="form-group">
              <label>
                <Wrench size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Preventive Maintenance
              </label>
              <input
                type="text"
                name="Preventive_Maintenance"
                value={project.Preventive_Maintenance}
                onChange={handleChange}
                placeholder="e.g., Quarterly Service"
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Start Date *
              </label>
              <input
                type="date"
                name="Start_Date"
                value={project.Start_Date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                End Date *
              </label>
              <input
                type="date"
                name="End_Date"
                value={project.End_Date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} style={{ marginRight: '5px' }} />
              {loading ? 'Saving...' : 'Save Project'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/projects')} 
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '14px', color: '#666' }}>
        <strong>Note:</strong> Project ID will be automatically generated by the system. Fields marked with * are required.
      </div>
    </div>
  );
};

export default AddProject;
