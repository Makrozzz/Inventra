import React, { useState, useEffect } from 'react';
import { Activity, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalRecords: 0,
    recordsPerPage: 100,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchHistoryLogs(currentPage);
  }, [currentPage]);

  const fetchHistoryLogs = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHistoryLogs(page, 100);
      
      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const buildDetailedDescription = (log) => {
    // Just return the Action_Desc as is - no modifications needed
    return log.Action_Desc;
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'INSERT':
        return '#27ae60'; // Green
      case 'UPDATE':
        return '#3498db'; // Blue
      case 'DELETE':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '30px',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Activity size={32} style={{ marginRight: '12px', color: '#3498db' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
            Audit Log
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
            Track all system changes and user activities
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          color: '#c33'
        }}>
          <AlertCircle size={20} style={{ marginRight: '10px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '18px', color: '#7f8c8d' }}>Loading audit logs...</div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', width: '80px' }}>
                    Number
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', width: '150px' }}>
                    User
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', width: '100px' }}>
                    Action
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>
                    Description
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', width: '180px' }}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#95a5a6',
                      fontSize: '16px'
                    }}>
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr 
                      key={log.Log_ID}
                      style={{
                        borderBottom: '1px solid #ecf0f1',
                        transition: 'background-color 0.2s',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '15px', color: '#7f8c8d' }}>
                        {(currentPage - 1) * 100 + index + 1}
                      </td>
                      <td style={{ padding: '15px', color: '#2c3e50', fontWeight: '500' }}>
                        {log.Username || 'Unknown User'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: getActionColor(log.Action_Type),
                          display: 'inline-block'
                        }}>
                          {log.Action_Type}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#2c3e50', lineHeight: '1.5' }}>
                        {buildDetailedDescription(log)}
                      </td>
                      <td style={{ padding: '15px', color: '#7f8c8d', fontSize: '13px' }}>
                        {formatTimestamp(log.Timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderTop: '1px solid #ecf0f1',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                Showing {((currentPage - 1) * pagination.recordsPerPage) + 1} to{' '}
                {Math.min(currentPage * pagination.recordsPerPage, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} records
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: pagination.hasPrevPage ? 'white' : '#ecf0f1',
                    color: pagination.hasPrevPage ? '#2c3e50' : '#95a5a6',
                    cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (pagination.hasPrevPage) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pagination.hasPrevPage) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div style={{ 
                  padding: '8px 16px',
                  color: '#2c3e50',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Page {currentPage} of {pagination.totalPages}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: pagination.hasNextPage ? 'white' : '#ecf0f1',
                    color: pagination.hasNextPage ? '#2c3e50' : '#95a5a6',
                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (pagination.hasNextPage) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pagination.hasNextPage) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
