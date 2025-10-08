import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, Users, Calendar, Package } from 'lucide-react';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Configuration
  const API_BASE = 'https://www.ivms2006.com/api';

  // Fetch projects from API
  const fetchProjects = async () => {
    console.log('🔄 Starting Projects API call to:', `${API_BASE}/getProjects.php`);
    
    try {
      const response = await fetch(`${API_BASE}/getProjects.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log('📡 Projects API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawText = await response.text();
      console.log('📦 Raw Projects API Response:', rawText);
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from Projects API');
      }
      
      console.log('📦 Parsed Projects API Response data:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log('✅ Projects API call successful, projects found:', data.data.length);
        setProjects(data.data);
      } else {
        console.log('⚠️ Projects API returned success: false or no data array');
        console.log('⚠️ Using fallback data due to API structure issue');
        throw new Error('API returned invalid data structure');
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      console.error('❌ Error details:', error.message);
      
      // Fallback to mock data if API fails
      console.log('🔄 Using fallback mock projects data');
      setProjects([
        {
          id: 1,
          name: 'Office Digitalization - ABC Corp',
          client: 'ABC Corporation',
          status: 'Active',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          postSupport: 'Premium Support',
          assetsCount: 15,
          description: 'Complete office digitalization with laptops and networking equipment'
        },
        {
          id: 2,
          name: 'IT Infrastructure - XYZ Ltd',
          client: 'XYZ Limited',
          status: 'In Progress',
          startDate: '2024-03-01',
          endDate: '2025-02-28',
          postSupport: 'Standard Support',
          assetsCount: 8,
          description: 'IT infrastructure setup and maintenance for regional offices'
        },
        {
          id: 3,
          name: 'Security System - Tech Solutions',
          client: 'Tech Solutions Inc',
          status: 'Planning',
          startDate: '2024-06-01',
          endDate: '2024-11-30',
          postSupport: 'Basic Support',
          assetsCount: 12,
          description: 'Security cameras and access control system implementation'
        },
        {
          id: 4,
          name: 'Network Upgrade - Global Systems',
          client: 'Global Systems Ltd',
          status: 'Completed',
          startDate: '2023-09-01',
          endDate: '2024-02-29',
          postSupport: 'Extended Support',
          assetsCount: 20,
          description: 'Complete network infrastructure upgrade and optimization'
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

  const filteredProjects = projects.filter(project => {
    return (
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === '' || project.status === statusFilter)
    );
  });

  const statuses = [...new Set(projects.map(project => project.status))];

  const getStatusColor = (status) => {
    const colors = {
      'Active': { bg: '#d4edda', text: '#155724' },
      'In Progress': { bg: '#cce5ff', text: '#004085' },
      'Planning': { bg: '#fff3cd', text: '#856404' },
      'Completed': { bg: '#e2e3e5', text: '#383d41' }
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
            <button className="btn btn-primary" disabled>
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
          <button className="btn btn-primary">
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
            const statusColor = getStatusColor(project.status);
            return (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3 className="project-title">{project.name}</h3>
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                
                <div className="project-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span><strong>Client:</strong> {project.client}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} />
                    <span><strong>Duration:</strong> {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <Package size={16} />
                    <span><strong>Assets:</strong> {project.assetsCount} items</span>
                  </div>
                </div>

                <p className="project-description">{project.description}</p>
                
                <div className="project-support">
                  <strong>Post Support:</strong> {project.postSupport}
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
                  <button className="btn btn-danger btn-sm">
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
    </div>
  );
};

export default Projects;