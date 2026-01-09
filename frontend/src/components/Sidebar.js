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
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

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

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 80 && newWidth <= 400) {
        setSidebarWidth(newWidth);
        // Update CSS variable for main content margin
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

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
    <div className={`sidebar ${isMinimized ? 'minimized' : ''}`} style={{ width: `${sidebarWidth}px`, transition: isResizing ? 'none' : 'width 0.3s ease' }}>
      <div className="sidebar-header">
        {sidebarWidth < 150 ? (
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
                title={sidebarWidth < 150 ? item.label : ''}
                style={{
                  justifyContent: sidebarWidth < 150 ? 'center' : 'flex-start',
                  padding: sidebarWidth < 150 ? '12px' : '12px 20px'
                }}
              >
                <IconComponent className="nav-icon" />
                {sidebarWidth >= 150 && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        <div className="sidebar-bottom-nav" style={{ borderTop: 'none', paddingTop: '0' }}>
          <button 
            type="button"
            onClick={onLogout} 
            className="nav-item logout-item"
            title={sidebarWidth < 150 ? 'Logout' : ''}
            style={{
              justifyContent: sidebarWidth < 150 ? 'center' : 'flex-start',
              padding: sidebarWidth < 150 ? '12px' : '12px 20px'
            }}
          >
            <LogOut className="nav-icon" />
            {sidebarWidth >= 150 && <span>Logout</span>}
          </button>
          
          <div 
            className="nav-item user-item"
            title={sidebarWidth < 150 ? username : ''}
            style={{
              justifyContent: sidebarWidth < 150 ? 'center' : 'flex-start',
              padding: sidebarWidth < 150 ? '12px' : '12px 20px'
            }}
          >
            <User className="nav-icon" />
            {sidebarWidth >= 150 && <span>{username}</span>}
          </div>
        </div>
      </nav>
      
      {/* Resize Handle */}
      <div 
        className="sidebar-resize-handle"
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'ew-resize',
          backgroundColor: isResizing ? 'rgba(52, 152, 219, 0.5)' : 'transparent',
          transition: 'background-color 0.2s ease',
          zIndex: 1001
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.3)'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
    </div>
  );
};

export default Sidebar;