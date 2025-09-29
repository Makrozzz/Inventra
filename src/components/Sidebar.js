import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Package, 
  Wrench, 
  Settings, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

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
        <div className="sidebar-logo">AssetPro</div>
        <div className="sidebar-subtitle">Asset Management System</div>
      </div>
      
      <nav className="sidebar-nav">
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
        
        <button onClick={onLogout} className="nav-item" style={{ marginTop: '20px' }}>
          <LogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;