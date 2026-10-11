import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { activePage, setActivePage, currentUser, logout, lowStockProducts } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { id: 'products', label: 'Products', icon: 'fas fa-boxes' },
    // Note: Stock Management intentionally removed as requested by user
    { id: 'billing', label: 'Billing', icon: 'fas fa-receipt' },
    { id: 'history', label: 'Bill History', icon: 'fas fa-history' },
    { id: 'deleted', label: 'Deleted Records', icon: 'fas fa-trash-alt' },
    { id: 'repairs', label: 'Repairs', icon: 'fas fa-tools' },
    { id: 'staff', label: 'Staff Management', icon: 'fas fa-users' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-line' },
    {
      id: 'lowstock',
      label: 'Low Stock Alerts',
      icon: 'fas fa-exclamation-triangle',
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null
    }
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-badge" style={{ padding: '4px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/images/logo.png" alt="Stockly Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#1e1e2d', lineHeight: 1.2 }}>
              Stockly
            </h2>
            <span style={{ fontSize: '0.65rem', color: '#6d54fe', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              RETAIL & INVENTORY
            </span>
          </div>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map(item => (
          <button
            type="button"
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActivePage(item.id);
              if (onClose) onClose();
            }}
          >
            <i className={item.icon}></i>
            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  background: activePage === item.id ? 'white' : '#ef4444',
                  color: activePage === item.id ? '#6d54fe' : 'white',
                  borderRadius: '20px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-avatar-pill">
            {(currentUser?.name?.[0] || currentUser?.username?.[0] || 'A').toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1e2d', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser?.name || 'Admin User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8c8fa7', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser?.email || 'Administrator'}
            </div>
          </div>
        </div>

        <button className="sidebar-logout-btn" onClick={logout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>
  );
}
