import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Search, Plus, ArrowLeft, AlertCircle, Package } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const ModelSpecifications = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchModelsWithSpecs();
  }, []);

  const fetchModelsWithSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/models/with-specs`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const result = await response.json();
      setModels(result.data || []);
    } catch (err) {
      console.error('Error fetching models with specs:', err);
      setError(err.message || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleModelClick = (modelId) => {
    navigate(`/models/${modelId}/add-specs`);
  };

  // Filter models based on search term
  const filteredModels = models.filter(model => 
    model.Model_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.Category_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px',
        marginBottom: '32px',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/assets')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <ArrowLeft color="white" size={24} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Cpu size={36} />
              Model Specifications
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px'
            }}>
              Manage technical specifications for all models
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '24px' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} 
          />
          <input
            type="text"
            placeholder="Search by model name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              fontSize: '15px',
              border: 'none',
              borderRadius: '12px',
              outline: 'none',
              background: 'white',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: '0 32px 32px' }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            Loading models...
          </div>
        ) : error ? (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle color="#dc2626" size={24} />
            <div>
              <strong style={{ color: '#dc2626' }}>Error:</strong>
              <p style={{ margin: '4px 0 0 0', color: '#991b1b' }}>{error}</p>
            </div>
          </div>
        ) : filteredModels.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <Package size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {searchTerm ? 'No models found' : 'No models available'}
            </h3>
            <p style={{ margin: 0, color: '#9ca3af' }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Add models to get started'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {filteredModels.map((model) => (
              <div
                key={model.Model_ID}
                onClick={() => handleModelClick(model.Model_ID)}
                style={{
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Cpu size={20} color="#667eea" />
                      {model.Model_Name}
                    </h3>
                    {model.Category_Name && (
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {model.Category_Name}
                      </p>
                    )}
                  </div>
                  <div style={{
                    background: model.Spec_Count > 0 ? '#ecfdf5' : '#f3f4f6',
                    color: model.Spec_Count > 0 ? '#059669' : '#6b7280',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    minWidth: '50px'
                  }}>
                    {model.Spec_Count}
                    <div style={{ fontSize: '11px', fontWeight: '400' }}>specs</div>
                  </div>
                </div>

                {model.specifications && model.specifications.length > 0 ? (
                  <div style={{
                    marginTop: '16px'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Specifications Overview
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '8px'
                    }}>
                      {model.specifications.map((spec, index) => (
                        <div key={index} style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          color: '#667eea',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                          whiteSpace: 'nowrap'
                        }}>
                          {spec.Attribute_Name || spec.Attributes_Name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#fef3c7',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '16px',
                    textAlign: 'center'
                  }}>
                    <Plus size={20} color="#d97706" style={{ margin: '0 auto 8px' }} />
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#92400e',
                      fontWeight: '500'
                    }}>
                      No specifications yet
                    </p>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#b45309'
                    }}>
                      Click to add specifications
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ModelSpecifications;
