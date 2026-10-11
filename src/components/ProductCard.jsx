import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, X, Check, Barcode as BarcodeIcon, Edit3 } from 'lucide-react';

export default function ProductCard({ 
  product, 
  isPOSMode = false, 
  cartQty = 0, 
  onCardClick, 
  onRemoveFromCart 
}) {
  const { setActiveProductModal, deleteProduct, setActiveBarcodeModal } = useApp();

  const isLowStock = (product.stock || 0) <= (product.min_stock || 5);
  const isOutOfStock = (product.stock || 0) <= 0;

  const fallbackImage = 'https://placehold.co/400x400/f8fafc/64748b?text=No+Image';

  return (
    <div
      className={`product-card-erp ${isPOSMode ? 'pos-product-card' : ''} ${cartQty > 0 ? 'selected' : ''}`}
      onClick={isPOSMode ? () => onCardClick(product) : undefined}
    >
      <div className="product-card-img-box">
        {isPOSMode && cartQty > 0 && (
          <div className="pos-qty-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} strokeWidth={3} />
              {cartQty} in cart
            </span>
            {onRemoveFromCart && (
              <button
                type="button"
                title="Remove from bill"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromCart(product);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.2s',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
          </div>
        )}

        <img
          src={product.photo_data || fallbackImage}
          alt={product.name}
          className="product-card-img"
          onError={(e) => { e.target.src = fallbackImage; }}
        />
      </div>

      <h3 className="product-card-title" title={product.name}>
        {product.name}
      </h3>

      <div className="product-card-sku">
        SKU: {product.sku || 'N/A'}
      </div>

      <div className="product-card-price">
        ₹ {Number(product.price || 0).toLocaleString('en-IN')}
      </div>

      <div className="product-card-footer">
        <div className="product-card-stock">
          <i className="fas fa-box-open"></i>
          <span>Stock: {product.stock || 0}</span>
        </div>

        <div>
          {isOutOfStock ? (
            <span className="stock-pill-badge low-stock">Out of Stock</span>
          ) : isLowStock ? (
            <span className="stock-pill-badge low-stock">Low Stock</span>
          ) : (
            <span className="stock-pill-badge in-stock">In Stock</span>
          )}
        </div>
      </div>

      {/* When in POS Mode and card is selected: Provide a prominent Remove button */}
      {isPOSMode && cartQty > 0 && onRemoveFromCart && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-delete-sm"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '20px',
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Remove from current bill"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromCart(product);
            }}
          >
            <Trash2 size={13} /> Remove Card
          </button>
        </div>
      )}

      {/* Catalog Mode Actions */}
      {!isPOSMode && (
        <div className="product-card-actions">
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="Generate Barcode"
            onClick={(e) => {
              e.stopPropagation();
              setActiveBarcodeModal(product);
            }}
          >
            <BarcodeIcon size={14} style={{ display: 'inline', marginRight: 4 }} /> Barcode
          </button>
          <button
            className="btn-edit-sm"
            title="Edit Product"
            onClick={(e) => {
              e.stopPropagation();
              setActiveProductModal(product);
            }}
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn-delete-sm"
            title="Delete Product"
            onClick={(e) => {
              e.stopPropagation();
              deleteProduct(product.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
