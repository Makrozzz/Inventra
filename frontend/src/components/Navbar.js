import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Package, Plus } from 'lucide-react';

const Navbar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <Package size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Inventory System
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <Home size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
              <Package size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Inventory
            </Link>
          </li>
          <li>
            <Link to="/add-asset" className={location.pathname === '/add-asset' ? 'active' : ''}>
              <Plus size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Add Asset
            </Link>
          </li>
          <li>
            <button onClick={onLogout} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;