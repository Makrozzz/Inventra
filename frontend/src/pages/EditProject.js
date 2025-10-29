import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, FileText, User, Shield, Wrench, Building2, MapPin, X } from 'lucide-react';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [project, setProject] = useState({
    Project_Ref_Number: '',
    Project_Title: '',
    Solution_Principal: '',
    Warranty: '',
    Preventive_Maintenance: '',
    Start_Date: '',
    End_Date: ''
  });
  
  // Customer information (read-only, cannot be edited)
  const [customer, setCustomer] = useState({
    Customer_Ref_Number: '',
    Customer_Name: ''
  });
  
  // Branches (read-only, cannot be edited)
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await fetch(`http://localhost:5000/api/v1/projects/${id}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project');
      const projectData = await projectResponse.json();
      
      // Set project data
      setProject({
        Project_Ref_Number: projectData.Project_Ref_Number || '',
        Project_Title: projectData.Project_Title || '',
        Solution_Principal: projectData.Solution_Principal || '',
        Warranty: projectData.Warranty || '',
        Preventive_Maintenance: projectData.Preventive_Maintenance || '',
        Start_Date: projectData.Start_Date ? projectData.Start_Date.split('T')[0] : '',
        End_Date: projectData.End_Date ? projectData.End_Date.split('T')[0] : ''
      });

      // Set customer data (from the joined query)
      if (projectData.Customer_Name && projectData.Customer_Ref_Number) {
        setCustomer({
          Customer_Ref_Number: projectData.Customer_Ref_Number,
          Customer_Name: projectData.Customer_Name
        });
      }

      // Fetch branches from inventory
      const inventoryResponse = await fetch(`http://localhost:5000/api/v1/inventory/project/${id}`);
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        const uniqueBranches = [...new Set(inventoryData.map(item => item.Branch))];
        setBranches(uniqueBranches);
      }

    } catch (error) {
      console.error('Error fetching project data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    setError(null);

    try {
      console.log('Updating project data:', project);
      
      const response = await fetch(`http://localhost:5000/api/v1/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
      }

      const updatedProject = await response.json();
      console.log('Project updated successfully:', updatedProject);
      
      // Navigate back to project detail page
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.message || 'Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
  };

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>Loading project data...</p>
      </div>
    );
  }

  if (error && !project.Project_Title) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#ef4444' }}>Error: {error}</p>
        <button 
          onClick={() => navigate('/projects')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '22px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              Confirm Changes
            </h3>
            <p style={{
              margin: '0 0 25px 0',
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Are you sure you want to save the changes to this project? This action will update the project details.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelSave}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                <Save size={18} />
                Yes, Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px 40px',
        marginBottom: '30px',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => navigate(`/projects/${id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '15px'
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          <h1 style={{ 
            color: 'white', 
            margin: '0',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Edit Project
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            margin: '8px 0 0 0',
            fontSize: '16px'
          }}>
            Update project information
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 40px' }}>
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Information (Read-Only) */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '25px',
            boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <Building2 size={24} style={{ color: '#667eea' }} />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                Customer Information (Read-Only)
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customer.Customer_Name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Customer Reference Number
                </label>
                <input
                  type="text"
                  value={customer.Customer_Ref_Number}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Branches (Read-Only) */}
            {branches.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MapPin size={16} style={{ color: '#667eea' }} />
                  Branches
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {branches.map((branch, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Information (Editable) */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '25px',
            boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <FileText size={24} style={{ color: '#10b981' }} />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                Project Information
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Project Reference Number */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Project Reference Number
                </label>
                <input
                  type="text"
                  name="Project_Ref_Number"
                  value={project.Project_Ref_Number}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Solution Principal */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <User size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                  Solution Principal
                </label>
                <input
                  type="text"
                  name="Solution_Principal"
                  value={project.Solution_Principal}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Project Title (Full Width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Project Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="Project_Title"
                  value={project.Project_Title}
                  onChange={handleChange}
                  required
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Warranty */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <Shield size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                  Warranty
                </label>
                <input
                  type="text"
                  name="Warranty"
                  value={project.Warranty}
                  onChange={handleChange}
                  placeholder="e.g., 3 Years"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Preventive Maintenance */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <Wrench size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                  Preventive Maintenance
                </label>
                <input
                  type="text"
                  name="Preventive_Maintenance"
                  value={project.Preventive_Maintenance}
                  onChange={handleChange}
                  placeholder="e.g., Quarterly"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Start Date */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                  Start Date
                </label>
                <input
                  type="date"
                  name="Start_Date"
                  value={project.Start_Date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* End Date */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                  End Date
                </label>
                <input
                  type="date"
                  name="End_Date"
                  value={project.End_Date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
