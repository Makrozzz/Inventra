import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, X, Calendar, FileText, Package, 
  Wrench, AlertTriangle, ClipboardCheck
} from 'lucide-react';

const PMDetail = () => {
  const { pmId } = useParams();
  const navigate = useNavigate();
  const [pmData, setPmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPMDetail();
  }, [pmId]);

  const fetchPMDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/v1/pm/detail/${pmId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('PM Detail:', data);
      setPmData(data);
    } catch (err) {
      console.error('Error fetching PM detail:', err);
      setError(err.message || 'Failed to load PM details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCheckResultIcon = (isOk) => {
    if (isOk === 1 || isOk === true) {
      return <CheckCircle size={20} color="#27ae60" />;
    } else {
      return <X size={20} color="#e74c3c" />;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading PM details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <AlertTriangle size={48} color="#e74c3c" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>Error Loading PM Details</h3>
          <p style={{ color: '#666' }}>{error}</p>
          <button onClick={fetchPMDetail} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!pmData) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <FileText size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#666' }}>PM Record Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '10px' }}>
            <ArrowLeft size={16} style={{ marginRight: '5px' }} />
            Back
          </button>
          <h1 className="page-title" style={{ marginTop: '10px', marginBottom: '5px' }}>
            Preventive Maintenance Details
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: 0 }}>
            PM Record #{pmData.PM_ID}
          </p>
        </div>
      </div>

      {/* PM Overview Card */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <Wrench size={40} />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Preventive Maintenance</h2>
                <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '1rem' }}>
                  {pmData.Asset_Tag_ID || 'Asset'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '5px' }}>PM Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} />
                  {formatDate(pmData.PM_Date)}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '5px' }}>Category</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  {pmData.Category || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ 
            padding: '12px 24px', 
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            background: pmData.Status === 'Completed' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}>
            {pmData.Status || 'In-Process'}
          </div>
        </div>
      </div>

      {/* Asset Information */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #3498db'
        }}>
          <Package size={24} color="#3498db" />
          <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>Asset Information</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Asset Tag ID
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem', fontFamily: 'monospace', fontWeight: '600' }}>
              {pmData.Asset_Tag_ID || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Serial Number
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem', fontFamily: 'monospace' }}>
              {pmData.Asset_Serial_Number || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Item Name
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem' }}>
              {pmData.Item_Name || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Category
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem' }}>
              {pmData.Category || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Model
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem' }}>
              {pmData.Model || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Recipient
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem' }}>
              {pmData.Recipient_Name || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '600' }}>
              Department
            </div>
            <div style={{ color: '#2c3e50', fontSize: '1rem' }}>
              {pmData.Department || 'N/A'}
            </div>
          </div>
        </div>

        {pmData.Remarks && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <div style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>
              Remarks
            </div>
            <div style={{ 
              color: '#2c3e50', 
              fontSize: '0.95rem',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontStyle: 'italic'
            }}>
              {pmData.Remarks}
            </div>
          </div>
        )}
      </div>

      {/* Checklist Results */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #27ae60'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardCheck size={24} color="#27ae60" />
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>
              Checklist Results ({pmData.checklist_results?.length || 0} items)
            </h3>
          </div>
          {pmData.checklist_results && pmData.checklist_results.length > 0 && (
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#27ae60" />
                <span style={{ color: '#27ae60', fontWeight: '600' }}>
                  {pmData.checklist_results.filter(r => r.Is_OK_bool === 1).length} Good
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={16} color="#e74c3c" />
                <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                  {pmData.checklist_results.filter(r => r.Is_OK_bool === 0).length} Bad
                </span>
              </div>
            </div>
          )}
        </div>

        {!pmData.checklist_results || pmData.checklist_results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
            <ClipboardCheck size={48} color="#95a5a6" style={{ marginBottom: '15px' }} />
            <h4 style={{ color: '#7f8c8d', margin: '0 0 10px 0' }}>No Checklist Results</h4>
            <p style={{ color: '#95a5a6', margin: 0, fontSize: '0.9rem' }}>
              No checklist items were recorded for this PM
            </p>
          </div>
        ) : (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'hidden' 
          }}>
            {pmData.checklist_results.map((result, index) => (
              <div
                key={result.PM_Result_ID}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < pmData.checklist_results.length - 1 ? '1px solid #e9ecef' : 'none',
                  background: index % 2 === 0 ? 'white' : '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    minWidth: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: result.Is_OK_bool === 1 ? '#d4edda' : '#f8d7da',
                    color: result.Is_OK_bool === 1 ? '#155724' : '#721c24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ color: '#2c3e50', fontSize: '1rem', fontWeight: '500', marginBottom: '4px' }}>
                      {result.Check_Item}
                    </div>
                    {result.Remarks && (
                      <div style={{ color: '#7f8c8d', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        Note: {result.Remarks}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: result.Is_OK_bool === 1 ? '#d4edda' : '#f8d7da',
                  border: result.Is_OK_bool === 1 ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
                }}>
                  {getCheckResultIcon(result.Is_OK_bool)}
                  <span style={{ 
                    color: result.Is_OK_bool === 1 ? '#155724' : '#721c24',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {result.Is_OK_bool === 1 ? 'Good' : 'Bad'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PMDetail;
