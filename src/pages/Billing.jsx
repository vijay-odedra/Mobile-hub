import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ShoppingBag, Receipt, Plus, Trash2, Search, ArrowRight, User, Phone, Check } from 'lucide-react';

export default function Billing() {
  const {
    products,
    currentCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createBill,
    setActiveInvoiceModal,
    showToast
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [search, setSearch] = useState('');
  const [showBillView, setShowBillView] = useState(() => {
    return window.location.hash.toLowerCase().includes('view');
  });

  React.useEffect(() => {
    const handleHash = () => {
      setShowBillView(window.location.hash.toLowerCase().includes('view'));
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  // Totals calculation according to Image 2 formulas
  // Line Total = Price * Qty * (1 - Discount/100) * (1 + GST/100)
  const lineCalculations = currentCart.map(item => {
    const base = (Number(item.price) || 0) * (Number(item.qty) || 1);
    const discPct = Number(item.discount) || 0;
    const gstPct = Number(item.gstRate !== undefined ? item.gstRate : 18);
    const afterDisc = base * (1 - discPct / 100);
    const gstAmt = afterDisc * (gstPct / 100);
    const discAmt = base * (discPct / 100);
    const lineTotal = afterDisc + gstAmt;
    return { base, discAmt, gstAmt, lineTotal };
  });

  const subtotal = lineCalculations.reduce((acc, c) => acc + c.base, 0);
  const gstTotal = lineCalculations.reduce((acc, c) => acc + c.gstAmt, 0);
  const discountTotal = lineCalculations.reduce((acc, c) => acc + c.discAmt, 0);
  const grandTotal = subtotal - discountTotal + gstTotal;
  const totalItemsCount = currentCart.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);

  const handleGenerateBill = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter customer name and mobile number', 'error');
      setShowBillView(true);
      return;
    }
    if (currentCart.length === 0) {
      showToast('Please add at least one product to the cart', 'error');
      return;
    }

    const billNo = `INV-${Date.now().toString().slice(-6)}`;
    const billItems = currentCart.map(item => ({
      productId: item.id,
      name: item.name,
      productName: item.name,
      sku: item.sku,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
      quantity: Number(item.qty) || 1,
      gstRate: Number(item.gstRate !== undefined ? item.gstRate : 18),
      discountRate: Number(item.discount || 0)
    }));

    const payload = {
      billNo,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: billItems,
      subtotal,
      gstTotal,
      discountTotal,
      grandTotal,
      date: new Date().toISOString().split('T')[0]
    };

    // AJAX POST request handled smoothly in background
    const result = await createBill(payload);
    if (result) {
      setActiveInvoiceModal({
        id: result.id,
        bill_no: result.bill_no || billNo,
        customer_name: result.customer_name || customerName,
        customer_phone: result.customer_phone || customerPhone,
        items: billItems,
        subtotal: result.subtotal || subtotal,
        gst_total: result.gst_total || gstTotal,
        discount_total: result.discount_total || discountTotal,
        grand_total: result.grand_total || grandTotal,
        date: result.date || payload.date
      });
      setCustomerName('');
      setCustomerPhone('');
      setShowBillView(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Title Header matching Image 1 & 2 */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Smart Billing System</h1>
          <p className="page-subtitle">Build your bill quickly with live totals, editable GST and discount.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={showBillView ? 'btn-secondary' : 'btn-primary'}
            onClick={() => {
              const next = !showBillView;
              setShowBillView(next);
              window.location.hash = next ? 'billview' : 'billing';
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Receipt size={16} />
            {showBillView ? 'Browse Product Cards' : `View Bill (${totalItemsCount} items)`}
          </button>
        </div>
      </div>

      {/* Customer Information Card (Always visible across both views) */}
      <div className="customer-info-box" style={{ background: 'white', borderRadius: '20px', padding: '20px 24px', border: '1px solid #edeef6', marginBottom: '22px', boxShadow: '0 4px 20px rgba(109,84,254,0.03)' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '14px', color: '#1e1e2d', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} style={{ color: 'var(--primary)' }} /> Customer Information
        </h4>
        <div className="customer-grid-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: '100%', padding: '12px 18px', borderRadius: '30px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="tel"
              placeholder="Mobile Number *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: '100%', padding: '12px 18px', borderRadius: '30px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: PRODUCT CARDS CATALOG (MATCHES IMAGE 1)          */}
      {/* ======================================================== */}
      {!showBillView && (
        <div>
          {/* Search bar & Hint Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search products to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 18px 10px 42px', borderRadius: '30px', border: '1px solid #e2e8f0', background: 'white', outline: 'none', fontSize: '0.88rem' }}
              />
            </div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💡</span> Click on any card below to add to invoice
            </div>
          </div>

          {/* 4/5 Column Product Cards Grid matching Image 1 */}
          <div className="product-cards-grid">
            {filteredProducts.map(product => {
              const cartItem = currentCart.find(i => i.id === product.id);
              const qtyInCart = cartItem ? cartItem.qty : 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isPOSMode={true}
                  cartQty={qtyInCart}
                  onCardClick={(p) => {
                    addToCart(p, 1);
                    showToast(`Added ${p.name} to cart`, 'info');
                  }}
                  onRemoveFromCart={(p) => {
                    removeFromCart(p.id);
                    showToast(`Removed ${p.name} from bill`, 'info');
                  }}
                />
              );
            })}
          </div>

          {/* Floating Bottom Selection Bar matching Image 1 */}
          {currentCart.length > 0 && (
            <div
              style={{
                position: 'sticky',
                bottom: '20px',
                background: '#181829',
                color: 'white',
                borderRadius: '36px',
                padding: '14px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 12px 40px rgba(24, 24, 41, 0.45)',
                zIndex: 60,
                marginTop: '30px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Current Bill Selection
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                    {totalItemsCount} Item(s) • ₹ {grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowBillView(true);
                  window.location.hash = 'billview';
                }}
                style={{
                  background: 'linear-gradient(135deg, #6d54fe 0%, #7b61ff 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: '30px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(109,84,254,0.45)',
                  transition: '0.2s'
                }}
              >
                <Receipt size={18} /> View Bill / Checkout
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: INVOICE ITEMS TABLE (MATCHES IMAGE 2)            */}
      {/* ======================================================== */}
      {showBillView && (
        <div className="page-card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e1e2d', margin: 0 }}>
              Invoice Items ({totalItemsCount})
            </h3>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowBillView(false);
                window.location.hash = 'billing';
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '24px' }}
            >
              <Plus size={16} /> Add More Products
            </button>
          </div>

          {currentCart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8c8fa7' }}>
              <ShoppingBag size={48} style={{ color: '#cbd5e1', marginBottom: '14px', display: 'inline-block' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#1e1e2d', fontWeight: 700 }}>Your bill cart is empty</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px', marginBottom: '18px' }}>Click "+ Add More Products" to add devices and accessories.</p>
              <button className="btn-primary" onClick={() => {
                setShowBillView(false);
                window.location.hash = 'billing';
              }}>
                Go to Products
              </button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                <table className="cart-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #edf2f7' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>Product</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>Price (₹)</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>Quantity</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>GST (%)</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>Discount (%)</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>Total (₹)</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCart.map((item, idx) => {
                      const base = (Number(item.price) || 0) * (Number(item.qty) || 1);
                      const discPct = Number(item.discount) || 0;
                      const gstPct = Number(item.gstRate !== undefined ? item.gstRate : 18);
                      const afterDisc = base * (1 - discPct / 100);
                      const gstAmt = afterDisc * (gstPct / 100);
                      const lineTotal = afterDisc + gstAmt;

                      return (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 700, color: '#1e1e2d', fontSize: '0.95rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>SKU: {item.sku || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => updateCartItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              style={{ width: '90px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={item.qty === 0 || item.qty === '' ? '' : item.qty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  updateCartItem(item.id, 'qty', '');
                                } else {
                                  const parsed = parseInt(val, 10);
                                  updateCartItem(item.id, 'qty', isNaN(parsed) ? '' : Math.max(1, parsed));
                                }
                              }}
                              onBlur={() => {
                                if (!item.qty || item.qty < 1) {
                                  updateCartItem(item.id, 'qty', 1);
                                }
                              }}
                              style={{
                                width: '85px',
                                minWidth: '80px',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '2px solid #cbd5e1',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                color: '#1e1e2d',
                                outline: 'none',
                                background: '#ffffff',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                boxSizing: 'border-box'
                              }}
                            />
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.gstRate !== undefined ? item.gstRate : 18}
                              onChange={(e) => updateCartItem(item.id, 'gstRate', parseFloat(e.target.value) || 0)}
                              style={{ width: '70px', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount || 0}
                              onChange={(e) => updateCartItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              style={{ width: '70px', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#1e1e2d', fontSize: '0.98rem' }}>
                            ₹ {lineTotal.toFixed(2)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              style={{ background: '#fef2f2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bill Summary matching Image 2 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '360px', background: '#fafaff', padding: '20px 24px', borderRadius: '18px', border: '1px solid #edeef6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>Items in Cart</span>
                    <strong style={{ color: '#1e1e2d' }}>{totalItemsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <strong style={{ color: '#1e1e2d' }}>₹ {subtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>GST Total</span>
                    <strong style={{ color: '#1e1e2d' }}>₹ {gstTotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.9rem', color: '#10b981' }}>
                    <span>Discount Total</span>
                    <strong>-₹ {discountTotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1e2d' }}>Grand Total</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#5846eb' }}>
                      ₹ {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons matching Image 2 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearCart}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '30px' }}
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGenerateBill}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px', borderRadius: '30px', background: 'linear-gradient(135deg, #6d54fe 0%, #7b61ff 100%)', boxShadow: '0 4px 18px rgba(109,84,254,0.4)' }}
                >
                  <Receipt size={18} /> Generate Bill
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
