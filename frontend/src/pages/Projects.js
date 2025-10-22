import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, Users, Calendar, Package, Award, Shield, Wrench, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, project: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch projects from API
  const fetchProjects = async () => {
    console.log('🔄 Starting Projects API call to Node.js backend');
    
    try {
      // Use direct fetch with correct API endpoint
      const response = await fetch('http://localhost:5000/api/v1/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ Projects API call successful, projects found:', data.length);
      setProjects(data);
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      console.error('❌ Error details:', error.message);
      
      // Fallback to mock data if API fails
      console.log('🔄 Using fallback mock projects data');
      setProjects([
        {
          Project_ID: 1,
          Project_Ref_Number: "PRJ-2024-001",
          Project_Title: "Office Digital Transformation",
          Solution_Principal: "John Smith",
          Warranty: "2 Years Extended",
          Preventive_Maintenance: "Quarterly Service",
          Start_Date: "2024-01-15",
          End_Date: "2024-12-31"
        },
        {
          Project_ID: 2,
          Project_Ref_Number: "PRJ-2024-002",
          Project_Title: "IT Infrastructure Upgrade",
          Solution_Principal: "Sarah Johnson",
          Warranty: "1 Year Standard",
          Preventive_Maintenance: "Monthly Checkup",
          Start_Date: "2024-03-01",
          End_Date: "2025-02-28"
        },
        {
          Project_ID: 3,
          Project_Ref_Number: "PRJ-2024-003",
          Project_Title: "Security System Implementation",
          Solution_Principal: "Mike Wilson",
          Warranty: "3 Years Premium",
          Preventive_Maintenance: "Bi-weekly Monitoring",
          Start_Date: "2024-06-01",
          End_Date: "2024-11-30"
        }
      ]);
    } finally {
      console.log('⏰ Projects API call completed, loading set to false');
      setLoading(false);
    }
  };

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle delete button click - show confirmation
  const handleDeleteClick = (project) => {
    setDeleteConfirm({ show: true, project });
  };

  // Handle delete confirmation - actually delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.project) return;

    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/projects/${deleteConfirm.project.Project_ID}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      console.log('Project deleted successfully');
      
      // Refresh the project list
      await fetchProjects();
      
      // Close the confirmation dialog
      setDeleteConfirm({ show: false, project: null });
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, project: null });
  };

  // Create status based on end date
  const getProjectStatus = (endDate) => {
    if (!endDate) return 'Unknown';
    const today = new Date();
    const projectEndDate = new Date(endDate);
    return projectEndDate >= today ? 'Active' : 'Completed';
  };

  // Filter projects by search term and status
  const filteredProjects = projects
    .filter(project => {
      // Search filter
      const matchesSearch = (
        (project.Customer_Name && project.Customer_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.Project_Title && project.Project_Title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.Project_Ref_Number && project.Project_Ref_Number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.Solution_Principal && project.Solution_Principal.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      // Status filter
      const projectStatus = getProjectStatus(project.End_Date);
      const matchesStatus = !statusFilter || projectStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

  const statuses = ['Active', 'Completed', 'Unknown'];

  const getStatusColor = (status) => {
    const colors = {
      'Active': { bg: '#d4edda', text: '#155724' },
      'Completed': { bg: '#e2e3e5', text: '#383d41' },
      'Unknown': { bg: '#f8f9fa', text: '#495057' }
    };
    return colors[status] || { bg: '#f8f9fa', text: '#495057' };
  };

  // Show loading state
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => navigate('/projects/add')} disabled>
              <Plus size={16} style={{ marginRight: '5px' }} />
              Add New Project
            </button>
          </div>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading projects...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section with Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px 40px',
        marginBottom: '30px',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              margin: '0 0 10px 0',
              fontSize: '32px',
              fontWeight: '700'
            }}>
              Projects Management
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              fontSize: '16px'
            }}>
              Total Projects: <strong>{projects.length}</strong> | Active: <strong>{projects.filter(p => getProjectStatus(p.End_Date) === 'Active').length}</strong>
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/projects/add')}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            <Plus size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Add New Project
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
        {/* Search and Filter Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                placeholder="Search by customer, project title, ref number, or solution principal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 45px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
              <Filter size={20} style={{ color: '#667eea' }} />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <Package size={64} style={{ color: '#d1d5db', marginBottom: '20px' }} />
            <h3 style={{ color: '#6b7280', marginBottom: '10px' }}>No Projects Found</h3>
            <p style={{ color: '#9ca3af' }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first project'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '25px',
            marginBottom: '40px'
          }}>
            {filteredProjects.map(project => {
              const projectStatus = getProjectStatus(project.End_Date);
              const statusConfig = {
                'Active': { 
                  icon: CheckCircle, 
                  bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  iconColor: '#10b981'
                },
                'Completed': { 
                  icon: CheckCircle, 
                  bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  iconColor: '#6b7280'
                },
                'Unknown': { 
                  icon: AlertCircle, 
                  bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  iconColor: '#f59e0b'
                }
              };
              const config = statusConfig[projectStatus];
              const StatusIcon = config.icon;

              return (
                <div 
                  key={project.Project_ID}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid #f3f4f6'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  {/* Card Header with Gradient */}
                  <div style={{
                    background: config.bg,
                    padding: '25px 25px 20px 25px',
                    color: 'white',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <StatusIcon size={14} />
                      {projectStatus}
                    </div>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      fontSize: '20px',
                      fontWeight: '700',
                      paddingRight: '100px',
                      lineHeight: '1.3'
                    }}>
                      {project.Customer_Name || 'No Customer'}
                    </h3>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '13px',
                      opacity: 0.85,
                      fontWeight: '400',
                      lineHeight: '1.4',
                      paddingRight: '100px'
                    }}>
                      {project.Project_Title || 'No Project Title'}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      opacity: 0.75,
                      fontWeight: '500'
                    }}>
                      Ref: {project.Project_Ref_Number || 'N/A'}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '25px' }}>
                    {/* Info Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '10px'
                      }}>
                        <Calendar size={18} style={{ color: '#667eea', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            Duration
                          </div>
                          <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {project.Start_Date ? new Date(project.Start_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} 
                            {' → '}
                            {project.End_Date ? new Date(project.End_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '10px'
                      }}>
                        <Users size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            Solution Principal
                          </div>
                          <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {project.Solution_Principal || 'Not Assigned'}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '10px'
                      }}>
                        <Shield size={18} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            Warranty
                          </div>
                          <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {project.Warranty || 'No Warranty'}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '10px'
                      }}>
                        <Wrench size={18} style={{ color: '#8b5cf6', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            Preventive Maintenance
                          </div>
                          <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {project.Preventive_Maintenance || 'Not Scheduled'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid #f3f4f6',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      <button 
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(project)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Enhanced */}
      {deleteConfirm.show && (
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
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '35px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={30} style={{ color: '#ef4444' }} />
            </div>
            
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '15px', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Delete Project?
            </h3>
            
            <p style={{ 
              marginBottom: '20px', 
              color: '#6b7280', 
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              This action will permanently delete this project and all related records.
            </p>
            
            {deleteConfirm.project && (
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '2px solid #f3f4f6'
              }}>
                <p style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '15px',
                  color: '#1f2937',
                  fontWeight: '600'
                }}>
                  <strong>Customer:</strong> {deleteConfirm.project.Customer_Name || 'Unknown'}
                </p>
                <p style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <strong>Project:</strong> {deleteConfirm.project.Project_Title || 'No Title'}
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <strong>Ref Number:</strong> {deleteConfirm.project.Project_Ref_Number}
                </p>
              </div>
            )}
            
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '25px',
              border: '1px solid #fecaca'
            }}>
              <p style={{ 
                margin: 0, 
                color: '#991b1b', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} />
                <strong>Warning:</strong> This action cannot be undone!
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'stretch'
            }}>
              <button 
                onClick={handleCancelDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => !deleting && (e.target.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => !deleting && (e.target.style.backgroundColor = '#f3f4f6')}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: deleting ? 0.7 : 1
                }}
                onMouseEnter={(e) => !deleting && (e.target.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => !deleting && (e.target.style.backgroundColor = '#ef4444')}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;