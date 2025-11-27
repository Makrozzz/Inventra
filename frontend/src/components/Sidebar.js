import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Package, 
  Wrench, 
  Settings,
  Activity,
  LogOut,
  User,
  Users
} from 'lucide-react';

const Sidebar = ({ onLogout, onMinimizeChange }) => {
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Get username from localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUsername(user.username || 'User');
      } catch (error) {
        setUsername('User');
      }
    }
  }, []);

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    if (onMinimizeChange) {
      onMinimizeChange(newMinimizedState);
    }
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/assets', icon: Package, label: 'Assets' },
    { path: '/maintenance', icon: Wrench, label: 'Preventive Maintenance' },
    { path: '/solution-principal', icon: Users, label: 'Solution Principal' },
    { path: '/settings', icon: Settings, label: 'Account Settings' },
    { path: '/audit-log', icon: Activity, label: 'Audit Log' }
  ];

  return (
    <div className={`sidebar ${isMinimized ? 'minimized' : ''}`} style={{ width: isMinimized ? '80px' : '250px', transition: 'width 0.3s ease' }}>
      <div className="sidebar-header">
        {isMinimized ? (
          <div className="sidebar-logo" style={{ textAlign: 'center', fontSize: '24px' }}>I</div>
        ) : (
          <>
            <div className="sidebar-logo">Inventra</div>
            <div className="sidebar-subtitle">Asset Management System</div>
          </>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-main-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={isMinimized ? item.label : ''}
                style={{
                  justifyContent: isMinimized ? 'center' : 'flex-start',
                  padding: isMinimized ? '12px' : '12px 20px'
                }}
              >
                <IconComponent className="nav-icon" />
                {!isMinimized && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        <div className="sidebar-bottom-nav" style={{ borderTop: 'none', paddingTop: '0' }}>
          <button 
            onClick={toggleMinimize}
            className="nav-item minimize-item"
            style={{
              justifyContent: 'center',
              padding: '10px 12px',
              color: '#95a5a6',
              fontSize: '13px',
              fontStyle: 'italic',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              textAlign: 'center',
              marginBottom: '10px',
              letterSpacing: '3px'
            }}
          >
            {!isMinimized && '- minimize -'}
            {isMinimized && '>'}
          </button>

          <button 
            onClick={onLogout} 
            className="nav-item logout-item"
            title={isMinimized ? 'Logout' : ''}
            style={{
              justifyContent: isMinimized ? 'center' : 'flex-start',
              padding: isMinimized ? '12px' : '12px 20px'
            }}
          >
            <LogOut className="nav-icon" />
            {!isMinimized && <span>Logout</span>}
          </button>
          
          <div 
            className="nav-item user-item"
            title={isMinimized ? username : ''}
            style={{
              justifyContent: isMinimized ? 'center' : 'flex-start',
              padding: isMinimized ? '12px' : '12px 20px'
            }}
          >
            <User className="nav-icon" />
            {!isMinimized && <span>{username}</span>}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;