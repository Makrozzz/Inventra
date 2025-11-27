import React from 'react';
import { Users } from 'lucide-react';

const SolutionPrincipal = () => {
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
        <Users size={32} style={{ marginRight: '12px', color: '#3498db' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
            Solution Principal
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
            Manage solution principals and their information
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '40px',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Blank content area */}
      </div>
    </div>
  );
};

export default SolutionPrincipal;
