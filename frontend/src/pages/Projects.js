import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, Users, Calendar, Package } from 'lucide-react';

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

  const filteredProjects = projects.filter(project => {
    return (
      (project.Project_Title && project.Project_Title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.Project_Ref_Number && project.Project_Ref_Number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.Solution_Principal && project.Solution_Principal.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Create status based on end date
  const getProjectStatus = (endDate) => {
    if (!endDate) return 'Unknown';
    const today = new Date();
    const projectEndDate = new Date(endDate);
    return projectEndDate >= today ? 'Active' : 'Completed';
  };

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
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => navigate('/projects/add')}>
            <Plus size={16} style={{ marginRight: '5px' }} />
            Add New Project
          </button>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
        </div>

        <div className="filters">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} />
            <span>Filters:</span>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="projects-grid">
          {filteredProjects.map(project => {
            const projectStatus = getProjectStatus(project.End_Date);
            const statusColor = getStatusColor(projectStatus);
            return (
              <div key={project.Project_ID} className="project-card">
                <div className="project-header">
                  <h3 className="project-title">{project.Project_Title}</h3>
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}
                  >
                    {projectStatus}
                  </span>
                </div>
                
                <div className="project-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span><strong>Ref Number:</strong> {project.Project_Ref_Number || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} />
                    <span><strong>Duration:</strong> {project.Start_Date ? new Date(project.Start_Date).toLocaleDateString() : 'N/A'} - {project.End_Date ? new Date(project.End_Date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <Package size={16} />
                    <span><strong>Solution Principal:</strong> {project.Solution_Principal || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <Users size={16} />
                    <span><strong>Warranty:</strong> {project.Warranty || 'N/A'}</span>
                  </div>
                </div>

                <div className="project-support">
                  <strong>Preventive Maintenance:</strong> {project.Preventive_Maintenance || 'N/A'}
                </div>

                <div className="project-actions">
                  <button className="btn btn-secondary btn-sm">
                    <Eye size={14} style={{ marginRight: '5px' }} />
                    View
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Edit size={14} style={{ marginRight: '5px' }} />
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(project)}>
                    <Trash2 size={14} style={{ marginRight: '5px' }} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No projects found matching your criteria.
          </div>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirm.show && (
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
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
              Confirm Delete
            </h3>
            <p style={{ marginBottom: '10px', color: '#666', lineHeight: '1.6' }}>
              Are you sure you want to delete this project?
            </p>
            {deleteConfirm.project && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Project:</strong> {deleteConfirm.project.Project_Title}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Ref Number:</strong> {deleteConfirm.project.Project_Ref_Number}
                </p>
              </div>
            )}
            <p style={{ marginBottom: '20px', color: '#dc3545', fontSize: '14px' }}>
              <strong>Warning:</strong> This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                No, Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
                disabled={deleting}
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