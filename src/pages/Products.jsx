import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const { products, setActiveProductModal } = useApp();
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Header matching Image 1 */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage all your products in one place</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-bar-custom" style={{ marginBottom: 0, width: '280px', padding: '6px 18px' }}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            style={{ background: '#1e293b', borderRadius: '12px', padding: '10px 20px', boxShadow: 'none' }}
            onClick={() => setActiveProductModal({ isNew: true })}
          >
            <i className="fas fa-plus"></i> Add Product
          </button>
        </div>
      </div>

      {/* Product Cards Grid matching Image 1 */}
      {filtered.length === 0 ? (
        <div className="page-card-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '14px', display: 'block' }}></i>
          <h3 style={{ fontSize: '1.2rem', color: '#1e1e2d', fontWeight: 700 }}>No Products Found</h3>
          <p style={{ color: '#78829d', fontSize: '0.9rem', marginTop: '6px' }}>
            {search ? 'Try adjusting your search criteria.' : 'Click "Add Product" above to create your first catalog item.'}
          </p>
        </div>
      ) : (
        <div className="product-cards-grid">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
