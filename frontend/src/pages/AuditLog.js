import React from 'react';
import { Activity } from 'lucide-react';

const AuditLog = () => {
  console.log('✅ AuditLog component loaded successfully');
  
  return (
    <div style={{ padding: '30px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <Activity size={32} style={{ marginRight: '12px', color: '#3498db' }} />
        <h1 style={{ margin: 0, fontSize: '32px', color: '#2c3e50' }}>
          Audit Log
        </h1>
      </div>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '40px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '2px dashed #dee2e6'
      }}>
        <Activity size={64} style={{ color: '#3498db', marginBottom: '20px', opacity: 0.5 }} />
        <h2 style={{ color: '#6c757d', marginBottom: '10px' }}>Audit Log Page</h2>
        <p style={{ color: '#6c757d', fontSize: '16px' }}>
          This page is ready for development. More features will be added soon.
        </p>
      </div>
    </div>
  );
};

export default AuditLog;
