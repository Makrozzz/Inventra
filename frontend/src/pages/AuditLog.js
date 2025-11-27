import React from 'react';
import { Activity, Clock } from 'lucide-react';

const AuditLog = () => {
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

      {/* Coming Soon Message */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '80px 40px',
        textAlign: 'center',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#e3f2fd',
          marginBottom: '24px'
        }}>
          <Clock size={40} color="#3498db" />
        </div>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#2c3e50',
          marginBottom: '12px'
        }}>
          Coming Soon!
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: '#7f8c8d',
          lineHeight: '1.6',
          marginBottom: '0'
        }}>
          We are working on this page right now, Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default AuditLog;
