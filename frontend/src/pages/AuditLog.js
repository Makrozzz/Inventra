import React from 'react';
import { Activity, Clock, BookOpen } from 'lucide-react';

const AuditLog = () => {
  return (
    <div style={{ padding: '0', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '3px solid #e74c3c',
        padding: '0 20px 15px 20px'
      }}>
        <BookOpen size={28} color="#e74c3c" />
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem' }}>
            Audit Log
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
            Track all system changes and user activities
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div style={{ padding: '0 20px' }}>
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
    </div>
  );
};

export default AuditLog;