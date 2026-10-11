import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileBottomNav({ onToggleSidebar }) {
  const { activePage, setActivePage, currentCart, lowStockProducts } = useApp();

  const totalCartCount = currentCart.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'fas fa-home' },
    { id: 'products', label: 'Products', icon: 'fas fa-boxes' },
    { 
      id: 'billing', 
      label: 'Billing', 
      icon: 'fas fa-receipt', 
      isAction: true,
      badge: totalCartCount > 0 ? totalCartCount : null 
    },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { 
      id: 'menu', 
      label: 'Menu', 
      icon: 'fas fa-bars', 
      isMenu: true,
      badge: lowStockProducts.length > 0 ? '!' : null 
    }
  ];

  const handleTabClick = (item) => {
    if (item.isMenu) {
      if (onToggleSidebar) onToggleSidebar();
    } else {
      setActivePage(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-inner">
        {navItems.map((item) => {
          const isActive = !item.isMenu && (
            activePage === item.id || 
            (item.id === 'billing' && (activePage === 'billing-view' || activePage === 'billview'))
          );

          if (item.isAction) {
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-action-btn ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabClick(item);
                }}
                title={item.label}
              >
                <div className="action-circle">
                  <i className={item.icon}></i>
                  {item.badge && <span className="nav-action-badge">{item.badge}</span>}
                </div>
                <span className="action-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(item);
              }}
              title={item.label}
            >
              <div className="nav-icon-box">
                <i className={item.icon}></i>
                {item.badge && <span className="nav-dot-badge">{item.badge}</span>}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
