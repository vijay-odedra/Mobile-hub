import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TopNavbar({ onToggleSidebar }) {
  const { currentUser, lowStockProducts, setActivePage, firebaseStatus, logout } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="top-navbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="top-navbar-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 0,
          flexWrap: 'nowrap',
          flexShrink: 0
        }}
      >
        <button className="menu-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation Menu">
          <i className="fas fa-bars"></i>
        </button>

        {/* Mobile App Branding (visible on mobile headers) */}
        <div className="mobile-header-brand" onClick={() => setActivePage('dashboard')}>
          <div className="mobile-header-logo">
            <img src="/images/logo.png" alt="Stockly" />
          </div>
          <span className="mobile-header-title">Stockly</span>
        </div>

        <div className="top-search-bar">
          <i className="fas fa-search" style={{ color: '#8c8fa7' }}></i>
          <input
            type="text"
            placeholder="Search products, orders, bills..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setActivePage('products');
              }
            }}
          />
        </div>
      </div>

      <div
        className="top-navbar-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'nowrap',
          flexShrink: 0
        }}
      >
        {/* Firebase Live Cloud Status Pill */}
        <div
          className="firebase-status-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1.5px solid #10b981',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#047857',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title={`Firebase Cloud Firestore Live (${firebaseStatus?.projectId || 'stockly-dcbdb'})`}
        >
          <span
            className="firebase-status-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          <span className="firebase-status-text-full">Firebase Live</span>
          <span className="firebase-status-text-mobile">Live</span>
        </div>

        <div
          className="notification-btn"
          title="Low Stock Alerts"
          onClick={() => setActivePage('lowstock')}
        >
          <i className="far fa-bell"></i>
          {lowStockProducts.length > 0 && (
            <span className="notification-dot">
              {lowStockProducts.length}
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div 
            className="top-user-pill" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="top-user-avatar">
              {(currentUser?.name?.[0] || 'A').toUpperCase()}
            </div>
            <span className="top-user-name">
              {currentUser?.name?.split(' ')[0] || 'Admin'}
            </span>
            <i className={`fas fa-chevron-${userMenuOpen ? 'up' : 'down'} top-user-chevron`}></i>
          </div>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                border: '1px solid #e2e8f0',
                padding: '12px',
                minWidth: '180px',
                zIndex: 1000
              }}
            >
              <div style={{ padding: '4px 8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e1e2d' }}>{currentUser?.name || 'Admin'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{currentUser?.email || currentUser?.username || 'admin@stockly.com'}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          )}
        </div>

        <button
          className="top-logout-btn"
          onClick={logout}
          title="Sign out of Stockly"
          style={{
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '20px',
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
