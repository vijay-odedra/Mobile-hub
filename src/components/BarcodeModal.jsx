import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import html2pdf from 'html2pdf.js';
import { useApp } from '../context/AppContext';
import { Printer, Download, X, Shuffle, Barcode as BarcodeIcon } from 'lucide-react';

export default function BarcodeModal() {
  const { activeBarcodeModal, setActiveBarcodeModal, saveProduct, showToast } = useApp();
  const [labelCount, setLabelCount] = useState(12);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const containerRef = useRef(null);

  const product = activeBarcodeModal;

  useEffect(() => {
    if (product) {
      setCurrentBarcode(product.batch_number || product.sku || `PROD-${Date.now().toString().slice(-6)}`);
    }
  }, [product]);

  const renderBarcodes = () => {
    if (!containerRef.current || !currentBarcode) return;
    const svgs = containerRef.current.querySelectorAll('.barcode-svg');
    svgs.forEach(svg => {
      try {
        JsBarcode(svg, currentBarcode, {
          format: 'CODE128',
          width: 1.6,
          height: 46,
          displayValue: true,
          fontSize: 11,
          font: 'monospace',
          margin: 0
        });
      } catch (e) {
        console.error('JsBarcode rendering error:', e);
      }
    });
  };

  useEffect(() => {
    renderBarcodes();
  }, [currentBarcode, labelCount, product]);

  if (!product) return null;

  // Generates a proper GS1/EAN 12-digit or Code128 random number
  const handleGenerateRandomBarcode = async () => {
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const newCode = `890${randomSuffix}`;
    setCurrentBarcode(newCode);

    // Save to backend SQLite database via AJAX without reloading page
    const updatedPayload = {
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      minStock: product.min_stock,
      category: product.category,
      brand: product.brand,
      photoData: product.photo_data,
      batchNumber: newCode
    };

    const ok = await saveProduct(updatedPayload, product.id);
    if (ok) {
      showToast(`Generated & saved barcode: ${newCode}`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!containerRef.current) return;
    const opt = {
      margin: 10,
      filename: `barcode-${product.name.replace(/\s+/g, '_')}-${currentBarcode}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(containerRef.current).set(opt).save();
  };

  return (
    <div className="modal-overlay" onClick={() => setActiveBarcodeModal(null)}>
      <div className="modal-card" style={{ maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarcodeIcon size={24} style={{ color: 'var(--primary)' }} /> Barcode Label Sheet
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
              <strong>{product.name}</strong> &bull; SKU: <span className="sku-pill">{product.sku || 'N/A'}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} /> Download PDF
            </button>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} /> Print Sheet
            </button>
            <button
              onClick={() => setActiveBarcodeModal(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barcode Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', background: '#fafaff', padding: '14px 20px', borderRadius: '16px', border: '1px solid #edeef6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e1e2d' }}>Active Barcode:</span>
            <code style={{ background: '#ede9fe', color: '#5846eb', padding: '5px 12px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 800 }}>
              {currentBarcode}
            </code>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleGenerateRandomBarcode}
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px' }}
              title="Generate a new random barcode number"
            >
              <Shuffle size={13} /> Generate Random Barcode
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e1e2d' }}>Labels:</label>
            <select
              value={labelCount}
              onChange={(e) => setLabelCount(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, background: 'white' }}
            >
              <option value="6">6 Labels</option>
              <option value="12">12 Labels</option>
              <option value="24">24 Labels</option>
              <option value="36">36 Labels</option>
            </select>
          </div>
        </div>

        {/* Printable Grid Target */}
        <div
          ref={containerRef}
          className="print-target"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            maxHeight: '460px',
            overflowY: 'auto',
            padding: '16px',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px dashed #cbd5e1'
          }}
        >
          {Array.from({ length: labelCount }).map((_, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e1e2d', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {product.name}
              </div>
              <svg className="barcode-svg" style={{ maxWidth: '100%', maxHeight: '55px' }}></svg>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e1e2d', marginTop: '4px' }}>
                ₹ {Number(product.price || 0).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
