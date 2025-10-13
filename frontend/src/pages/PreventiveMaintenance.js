import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench, Search, Filter, Plus, Eye } from 'lucide-react';

const PreventiveMaintenance = ({ assets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Mock maintenance data
  const [maintenanceSchedule] = useState([
    {
      id: 1,
      assetId: 1,
      assetName: 'Laptop Dell XPS',
      customer: 'ABC Corp',
      scheduledDate: '2024-12-15',
      lastMaintenance: '2024-06-15',
      status: 'Scheduled',
      type: 'Bi-Annual',
      priority: 'Medium',
      technician: 'John Smith',
      estimatedDuration: '2 hours',
      checklistItems: ['Hardware inspection', 'Software updates', 'Performance testing']
    },
    {
      id: 2,
      assetId: 2,
      assetName: 'Office Chair',
      customer: 'XYZ Ltd',
      scheduledDate: '2024-11-20',
      lastMaintenance: '2024-05-20',
      status: 'Overdue',
      type: 'Bi-Annual',
      priority: 'High',
      technician: 'Sarah Johnson',
      estimatedDuration: '1 hour',
      checklistItems: ['Physical inspection', 'Mechanism check', 'Cleaning']
    },
    {
      id: 3,
      assetId: 3,
      assetName: 'Printer HP LaserJet',
      customer: 'Tech Solutions',
      scheduledDate: '2025-01-10',
      lastMaintenance: '2024-07-10',
      status: 'Completed',
      type: 'Bi-Annual',
      priority: 'Low',
      technician: 'Mike Wilson',
      estimatedDuration: '1.5 hours',
      checklistItems: ['Print quality check', 'Toner replacement', 'Calibration']
    }
  ]);

  const filteredMaintenance = maintenanceSchedule.filter(maintenance => {
    return (
      maintenance.assetName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === '' || maintenance.status === statusFilter) &&
      (typeFilter === '' || maintenance.type === typeFilter)
    );
  });

  const statuses = [...new Set(maintenanceSchedule.map(m => m.status))];
  const types = [...new Set(maintenanceSchedule.map(m => m.type))];

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': { bg: '#cce5ff', text: '#004085' },
      'Overdue': { bg: '#f8d7da', text: '#721c24' },
      'Completed': { bg: '#d4edda', text: '#155724' },
      'In Progress': { bg: '#fff3cd', text: '#856404' }
    };
    return colors[status] || { bg: '#f8f9fa', text: '#495057' };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': '#dc3545',
      'Medium': '#ffc107',
      'Low': '#28a745'
    };
    return colors[priority] || '#6c757d';
  };

  const getDaysUntilMaintenance = (scheduledDate) => {
    const today = new Date();
    const scheduled = new Date(scheduledDate);
    const diffTime = scheduled - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Preventive Maintenance</h1>
        <div className="actions">
          <button className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '5px' }} />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{maintenanceSchedule.filter(m => m.status === 'Scheduled').length}</div>
            <div className="stat-label">Scheduled</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{maintenanceSchedule.filter(m => m.status === 'Overdue').length}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{maintenanceSchedule.filter(m => m.status === 'Completed').length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Wrench size={40} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{maintenanceSchedule.length}</div>
            <div className="stat-label">Total Maintenance</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search by asset name or customer..."
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
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="maintenance-grid">
          {filteredMaintenance.map(maintenance => {
            const statusColor = getStatusColor(maintenance.status);
            const daysUntil = getDaysUntilMaintenance(maintenance.scheduledDate);
            
            return (
              <div key={maintenance.id} className="maintenance-card">
                <div className="maintenance-header">
                  <div className="asset-info">
                    <h3 className="asset-name">{maintenance.assetName}</h3>
                    <p className="customer-name">{maintenance.customer}</p>
                  </div>
                  <div className="priority-badge" style={{ backgroundColor: getPriorityColor(maintenance.priority) }}>
                    {maintenance.priority}
                  </div>
                </div>

                <div className="maintenance-details">
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span><strong>Scheduled:</strong> {new Date(maintenance.scheduledDate).toLocaleDateString()}</span>
                    {daysUntil <= 7 && daysUntil > 0 && (
                      <span className="days-warning">({daysUntil} days left)</span>
                    )}
                  </div>
                  
                  <div className="detail-row">
                    <Clock size={16} />
                    <span><strong>Duration:</strong> {maintenance.estimatedDuration}</span>
                  </div>
                  
                  <div className="detail-row">
                    <Wrench size={16} />
                    <span><strong>Technician:</strong> {maintenance.technician}</span>
                  </div>

                  <div className="detail-row">
                    <span><strong>Last Maintenance:</strong> {new Date(maintenance.lastMaintenance).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="checklist-preview">
                  <strong>Checklist Items:</strong>
                  <ul>
                    {maintenance.checklistItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="maintenance-footer">
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}
                  >
                    {maintenance.status}
                  </span>
                  
                  <div className="maintenance-actions">
                    <button className="btn btn-secondary btn-sm">
                      <Eye size={14} style={{ marginRight: '5px' }} />
                      View Details
                    </button>
                    {maintenance.status !== 'Completed' && (
                      <button className="btn btn-primary btn-sm">
                        <CheckCircle size={14} style={{ marginRight: '5px' }} />
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMaintenance.length === 0 && (
          <div className="empty-state">
            <p>No maintenance records found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreventiveMaintenance;