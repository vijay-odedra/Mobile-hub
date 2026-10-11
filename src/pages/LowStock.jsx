import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, XCircle, PackageCheck, Layers, Edit3, ArrowRight } from 'lucide-react';

export default function LowStock() {
  const { products, lowStockItems, setActivePage, setProductModalState } = useApp();

  const outOfStock = lowStockItems.filter(p => Number(p.stock) === 0);
  const lowStock = lowStockItems.filter(p => Number(p.stock) > 0);
  const healthyCount = Math.max(0, products.length - lowStockItems.length);

  const handleRestock = (product) => {
    setProductModalState({ isOpen: true, product });
  };

  return (
    <div className="fade-in">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <AlertTriangle style={{ color: '#ef4444' }} /> Low Stock Alerts
          </h1>
          <p className="page-subtitle">Critical inventory alerts requiring immediate purchase orders</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setActivePage('products')}>
            <Layers size={16} /> View All Products <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="lowstock-summary-grid">
        <div className="lowstock-stat-card ls-red">
          <div className="num">{outOfStock.length}</div>
          <div className="label">Out of Stock</div>
        </div>
        <div className="lowstock-stat-card ls-orange">
          <div className="num">{lowStock.length}</div>
          <div className="label">Low Stock (Critical)</div>
        </div>
        <div className="lowstock-stat-card ls-blue">
          <div className="num">{lowStockItems.length}</div>
          <div className="label">Total Action Items</div>
        </div>
        <div className="lowstock-stat-card ls-purple">
          <div className="num">{healthyCount}</div>
          <div className="label">Healthy Inventory</div>
        </div>
      </div>

      <div className="page-card-container">
        {lowStockItems.length === 0 ? (
          <div className="empty-state-card">
            <PackageCheck size={48} style={{ color: '#10b981', marginBottom: 12 }} />
            <h3>All Products Have Healthy Stock!</h3>
            <p>No inventory items are currently below their minimum threshold.</p>
          </div>
        ) : (
          <>
            {outOfStock.length > 0 && (
              <div>
                <h3 style={{ color: '#b91c1c', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={18} /> Out of Stock ({outOfStock.length} items)
                </h3>
                {outOfStock.map(p => (
                  <div key={p.id} className="lowstock-item-card" style={{ borderLeft: '6px solid #ef4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img 
                        src={p.photo_data || 'https://placehold.co/400x400/e2e8f0?text=No+Image'} 
                        alt={p.name}
                        style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://placehold.co/400x400/e2e8f0?text=No+Image'; }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#1e1e2d' }}>{p.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#78829d', marginTop: 2 }}>
                          SKU: <span className="sku-pill">{p.sku || 'N/A'}</span> &bull; Min required: {p.min_stock || 5}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="stock-badge out">0 units in stock</span>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                        onClick={() => handleRestock(p)}
                      >
                        <Edit3 size={14} /> Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lowStock.length > 0 && (
              <div style={{ marginTop: outOfStock.length > 0 ? '24px' : '0' }}>
                <h3 style={{ color: '#b45309', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> Low Stock Threshold Reached ({lowStock.length} items)
                </h3>
                {lowStock.map(p => (
                  <div key={p.id} className="lowstock-item-card" style={{ borderLeft: '6px solid #f59e0b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img 
                        src={p.photo_data || 'https://placehold.co/400x400/e2e8f0?text=No+Image'} 
                        alt={p.name}
                        style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://placehold.co/400x400/e2e8f0?text=No+Image'; }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#1e1e2d' }}>{p.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#78829d', marginTop: 2 }}>
                          SKU: <span className="sku-pill">{p.sku || 'N/A'}</span> &bull; Min threshold: {p.min_stock || 5}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="stock-badge low">
                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} /> {p.stock} left
                      </span>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                        onClick={() => handleRestock(p)}
                      >
                        <Edit3 size={14} /> Update Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
