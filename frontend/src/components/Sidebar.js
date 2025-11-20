import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Package, 
  Wrench, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const [username, setUsername] = useState('');

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

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/assets', icon: Package, label: 'Assets' },
    { path: '/maintenance', icon: Wrench, label: 'Preventive Maintenance' },
    { path: '/settings', icon: Settings, label: 'Account Settings' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Inventra</div>
        <div className="sidebar-subtitle">Asset Management System</div>
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
              >
                <IconComponent className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="sidebar-bottom-nav">
          <button onClick={onLogout} className="nav-item logout-item">
            <LogOut className="nav-icon" />
            <span>Logout</span>
          </button>
          
          <div className="nav-item user-item">
            <User className="nav-icon" />
            <span>{username}</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;