import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shuffle, X, Save, Image as ImageIcon } from 'lucide-react';

export default function ProductModal() {
  const { activeProductModal, setActiveProductModal, saveProduct } = useApp();

  const isEdit = activeProductModal && activeProductModal.id;
  
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [price, setPrice] = useState(19999);
  const [stock, setStock] = useState(15);
  const [minStock, setMinStock] = useState(5);
  const [category, setCategory] = useState('General');
  const [brand, setBrand] = useState('Other');
  const [photoData, setPhotoData] = useState('');

  useEffect(() => {
    if (isEdit) {
      setName(activeProductModal.name || '');
      setSku(activeProductModal.sku || '');
      setBatchNumber(activeProductModal.batch_number || `890${Math.floor(100000000 + Math.random() * 900000000)}`);
      setPrice(activeProductModal.price || 0);
      setStock(activeProductModal.stock || 0);
      setMinStock(activeProductModal.min_stock || 5);
      setCategory(activeProductModal.category || 'General');
      setBrand(activeProductModal.brand || 'Other');
      setPhotoData(activeProductModal.photo_data || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBatchNumber(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
      setPrice(19999);
      setStock(15);
      setMinStock(5);
      setCategory('General');
      setBrand('Other');
      setPhotoData('');
    }
  }, [activeProductModal, isEdit]);

  if (!activeProductModal) return null;

  const handleGenerateRandomBarcode = () => {
    const randomBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBatchNumber(randomBarcode);
  };

  const handleGenerateRandomSku = () => {
    const prefix = name ? name.toUpperCase().slice(0, 3) : 'SKU';
    const randomSku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSku(randomSku);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      batchNumber: batchNumber.trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 5,
      category,
      brand,
      photoData: photoData || '/images/products/samsungs24.jpg'
    };

    const ok = await saveProduct(payload, isEdit ? activeProductModal.id : null);
    if (ok) {
      setActiveProductModal(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setActiveProductModal(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e1e2d', margin: 0 }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={() => setActiveProductModal(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8c8fa7' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              placeholder="e.g., iPhone 15 Pro, Samsung S24"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>SKU</label>
                <button
                  type="button"
                  onClick={handleGenerateRandomSku}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Shuffle size={12} /> Random
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g., APL-15PRO"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Barcode / Batch #</label>
                <button
                  type="button"
                  onClick={handleGenerateRandomBarcode}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Shuffle size={12} /> Random
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g., 890123456789"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g., Smartphone, Accessories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                placeholder="e.g., Apple, Samsung, Xiaomi"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Selling Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Min Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ flex: 1, padding: '9px 14px' }}
              />
              {photoData && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPhotoData('')}
                >
                  Remove
                </button>
              )}
            </div>
            {photoData && (
              <div style={{ marginTop: '12px' }}>
                <img
                  src={photoData}
                  alt="Preview"
                  style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '14px', border: '1px solid #edeef6', background: 'white', padding: '6px' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveProductModal(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> {isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
