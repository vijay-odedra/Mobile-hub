import React, { useRef, useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { useApp } from '../context/AppContext';
import { Download, Printer, X } from 'lucide-react';

const WhatsAppIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.12-.519-1.821-.755-3.003-2.617-3.094-2.738-.092-.121-.735-.979-.735-1.867 0-.888.467-1.326.633-1.506.166-.18.363-.226.484-.226.12 0 .241.002.346.007.11.005.257-.042.403.308.147.351.503 1.228.547 1.318.044.09.073.196.015.312-.059.117-.088.19-.176.293-.088.103-.186.23-.266.309-.088.087-.181.182-.078.358.103.176.459.757 1.002 1.241.7.624 1.29.817 1.472.907.182.09.289.076.396-.048.106-.124.457-.533.58-.716.122-.182.244-.152.41-.091.167.061 1.057.498 1.238.589.182.09.303.136.348.213.045.077.045.448-.099.853z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.396C8.423 21.524 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.155-.49-4.431-1.332l-.318-.21-2.956.828.832-2.887-.229-.338C4.015 15.006 3.5 13.547 3.5 12c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
  </svg>
);

export default function TaxInvoiceModal() {
  const { activeInvoiceModal, setActiveInvoiceModal } = useApp();
  const invoiceRef = useRef(null);
  const [billData, setBillData] = useState(null);
  const [pdfPopup, setPdfPopup] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!activeInvoiceModal) {
      setBillData(null);
      setPdfPopup(null);
      return;
    }

    if (activeInvoiceModal.items && activeInvoiceModal.items.length > 0) {
      setBillData(activeInvoiceModal);
    } else if (activeInvoiceModal.id) {
      // Fetch full bill details including items
      fetch(`/api/bills/${activeInvoiceModal.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setBillData(data);
          } else {
            setBillData(activeInvoiceModal);
          }
        })
        .catch(() => setBillData(activeInvoiceModal));
    } else {
      setBillData(activeInvoiceModal);
    }
  }, [activeInvoiceModal]);

  if (!activeInvoiceModal || !billData) return null;

  const bill = billData;
  const items = bill.items || [];
  const billDate = bill.date ? new Date(bill.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = async () => {
    // 1. Invoke native or window printing
    if (window.AndroidNative && typeof window.AndroidNative.print === 'function') {
      window.AndroidNative.print();
    } else if (window.electronAPI && typeof window.electronAPI.printInvoice === 'function') {
      window.electronAPI.printInvoice();
    } else {
      window.print();
    }

    // 2. Generate PDF blob and display status popup with Open PDF button
    if (!invoiceRef.current) return;
    const billNumber = bill.bill_no || bill.billNo || '001';
    const fileName = `Stockly-Invoice-${billNumber}.pdf`;

    const opt = {
      margin: 8,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const worker = html2pdf().from(invoiceRef.current).set(opt);
      const pdfBlob = await worker.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      setPdfPopup({
        type: 'print',
        title: 'Invoice Sent to Printer',
        fileName,
        fileSize: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        blobUrl,
        downloadPathMobile: `Print Spooler / Internal Storage / Download / ${fileName}`,
        downloadPathDesktop: `Printer Spooler / Downloads (${fileName})`
      });
    } catch (err) {
      console.warn('Print blob generation error:', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || isGenerating) return;
    setIsGenerating(true);
    const billNumber = bill.bill_no || bill.billNo || '001';
    const fileName = `Stockly-Invoice-${billNumber}.pdf`;

    const opt = {
      margin: 8,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // Generate blob
      const worker = html2pdf().from(invoiceRef.current).set(opt);
      const pdfBlob = await worker.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Trigger automatic file download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open Download popup showing saved place & Open PDF button
      setPdfPopup({
        type: 'download',
        title: 'Invoice PDF Downloaded Successfully!',
        fileName,
        fileSize: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        blobUrl,
        downloadPathMobile: `Internal Storage / Download / ${fileName}`,
        downloadPathDesktop: `Downloads Folder (C:\\Users\\...\\Downloads\\${fileName})`
      });
    } catch (err) {
      console.error('PDF error:', err);
      html2pdf().from(invoiceRef.current).set(opt).save();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    let cleanPhone = (bill.customer_phone || bill.customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const itemsList = items.map((it, idx) => {
      const name = it.product_name || it.productName || it.name || 'Item';
      const qty = it.quantity || it.qty || 1;
      const price = Number(it.price || 0);
      return `${idx + 1}. ${name} (x${qty}) - ₹${(price * qty).toFixed(2)}`;
    }).join('\n');

    const msg = `📱 *STOCKLY - TAX INVOICE* 📱\n` +
      `--------------------------------\n` +
      `🧾 *Invoice No:* #${bill.bill_no || bill.billNo || '001'}\n` +
      `👤 *Customer:* ${bill.customer_name || bill.customerName || 'Customer'}\n` +
      `📞 *Phone:* ${bill.customer_phone || bill.customerPhone || 'N/A'}\n` +
      `📅 *Date:* ${billDate}\n` +
      (itemsList ? `--------------------------------\n*ITEMS:* \n${itemsList}\n` : '') +
      `--------------------------------\n` +
      `💰 *Subtotal:* ₹${Number(bill.subtotal || 0).toFixed(2)}\n` +
      `🏷️ *GST:* ₹${Number(bill.gst_total || bill.gstTotal || 0).toFixed(2)}\n` +
      `🎁 *Discount:* ₹${Number(bill.discount_total || bill.discountTotal || 0).toFixed(2)}\n` +
      `✨ *Grand Total:* ₹${Number(bill.grand_total || bill.grandTotal || 0).toFixed(2)}\n` +
      `--------------------------------\n` +
      `Thank you for shopping with Stockly! 🙏`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={() => setActiveInvoiceModal(null)}>
      <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }} className="no-print">
          <button
            style={{
              background: '#25D366',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '24px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37,211,102,0.3)'
            }}
            onClick={handleShareWhatsApp}
          >
            <WhatsAppIcon size={18} color="white" /> Share on WhatsApp
          </button>
          <button className="btn-secondary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Download PDF
          </button>
          <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} /> Print Invoice
          </button>
          <button className="btn-secondary" onClick={() => setActiveInvoiceModal(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={16} /> Close
          </button>
        </div>

        {/* IMAGE 5 REPLICA */}
        <div ref={invoiceRef} className="tax-invoice-sheet print-target">
          {/* Header */}
          <div className="invoice-top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: '#f5f3ff', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #edeef6' }}>
                <img src="/images/logo.png" alt="Stockly Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div className="store-brand-title">
                  Stockly
                </div>
                <div className="store-tagline">Retail &amp; Inventory Management Suite</div>
                <div className="store-meta-line">123 Business Street, Rajkot, Gujarat - 360001</div>
                <div className="store-meta-line">Phone: +91 98765 43210 &bull; GST No: 24ABCDE1234F1Z5</div>
              </div>
            </div>

            <div className="tax-invoice-badge-box">
              <div className="tax-invoice-pill">TAX INVOICE</div>
              <table className="invoice-meta-table">
                <tbody>
                  <tr>
                    <td>Invoice No.</td>
                    <td>:</td>
                    <td><strong>{bill.bill_no || bill.billNo || 'INV-01006'}</strong></td>
                  </tr>
                  <tr>
                    <td>Invoice Date</td>
                    <td>:</td>
                    <td><strong>{billDate}</strong></td>
                  </tr>
                  <tr>
                    <td>Payment Status</td>
                    <td>:</td>
                    <td><span className="status-paid-pill">Paid</span></td>
                  </tr>
                  <tr>
                    <td>Due Date</td>
                    <td>:</td>
                    <td>{billDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="purple-divider-line"></div>

          {/* Customer Details Card (Single clean card - Store Details removed to prevent duplicate display) */}
          <div className="invoice-section-card" style={{ marginBottom: '18px' }}>
            <div className="invoice-section-header">Customer Details</div>
            <div className="invoice-section-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '140px', color: '#64748b', padding: '6px 0' }}>Customer Name</td>
                    <td style={{ width: '15px' }}>:</td>
                    <td style={{ padding: '6px 0' }}><strong>{bill.customer_name || bill.customer?.name || 'Customer'}</strong></td>
                    <td style={{ width: '140px', color: '#64748b', padding: '6px 0' }}>Payment Mode</td>
                    <td style={{ width: '15px' }}>:</td>
                    <td style={{ padding: '6px 0' }}><strong>Cash / POS Counter</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', padding: '6px 0' }}>Phone Number</td>
                    <td>:</td>
                    <td style={{ padding: '6px 0' }}><strong>{bill.customer_phone || bill.customer?.phone || 'N/A'}</strong></td>
                    <td style={{ color: '#64748b', padding: '6px 0' }}>Invoice Type</td>
                    <td>:</td>
                    <td style={{ padding: '6px 0' }}><span className="status-paid-pill" style={{ fontSize: '0.75rem', padding: '2px 10px' }}>Regular Retail Sale</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', verticalAlign: 'top', padding: '6px 0' }}>Billing Address</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td colSpan={4} style={{ padding: '6px 0' }}>123 Main Street, Rajkot, Gujarat - 360001</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                <th>Product Name</th>
                <th style={{ textAlign: 'center' }}>SKU</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'center' }}>GST %</th>
                <th style={{ textAlign: 'center' }}>Discount %</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const itemTotal = (item.price || 0) * (item.quantity || item.qty || 1);
                const gstAmt = itemTotal * (item.gst_rate || item.gstRate || 0) / 100;
                const discAmt = itemTotal * (item.discount || item.discountRate || 0) / 100;
                const finalAmount = itemTotal + gstAmt - discAmt;

                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                    <td><strong>{item.product_name || item.productName || item.name}</strong></td>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{item.sku || 'PRD' + (idx + 1)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity || item.qty || 1}</td>
                    <td style={{ textAlign: 'right' }}>₹ {Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'center' }}>{item.gst_rate || item.gstRate || 0}%</td>
                    <td style={{ textAlign: 'center' }}>{item.discount || item.discountRate || 0}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>
                      ₹ {finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Payment Details & Bill Summary */}
          <div className="invoice-two-col-grid">
            <div className="invoice-section-card">
              <div className="invoice-section-header">Payment Details</div>
              <div className="invoice-section-body">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '130px', color: '#64748b' }}>Payment Method</td>
                      <td style={{ width: '15px' }}>:</td>
                      <td><strong>Cash</strong></td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b' }}>Transaction ID</td>
                      <td>:</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b' }}>Payment Date</td>
                      <td>:</td>
                      <td><strong>{billDate}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b' }}>Received Amount</td>
                      <td>:</td>
                      <td><strong>₹ {Number(bill.grand_total || bill.grand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b' }}>Payment Status</td>
                      <td>:</td>
                      <td><span className="status-paid-pill">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="invoice-section-card">
              <div className="invoice-section-header">Bill Summary</div>
              <div className="invoice-section-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span><strong>₹ {Number(bill.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>GST Total (18%)</span>
                  <span><strong>₹ {Number(bill.gst_total || bill.gstTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Discount Total</span>
                  <span style={{ color: '#ef4444' }}><strong>-₹ {Number(bill.discount_total || bill.discountTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                </div>

                <div className="invoice-grand-total-banner">
                  <span>Grand Total</span>
                  <span>₹ {Number(bill.grand_total || bill.grand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="invoice-section-card" style={{ marginBottom: '16px' }}>
            <div className="invoice-section-header">Notes & Terms</div>
            <div className="invoice-section-body">
              <ol className="terms-list">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Warranty is subject to manufacturer terms and conditions.</li>
                <li>This is a computer-generated invoice and does not require a signature.</li>
                <li>For any queries, please contact the store.</li>
              </ol>
            </div>
          </div>

          <div className="purple-divider-line" style={{ margin: '14px 0 10px' }}></div>

          {/* Footer */}
          <div className="invoice-footer-centered">
            <p>Thank you for shopping with <span>Stockly</span></p>
            <span className="invoice-footer-sub">COMPUTER-GENERATED INVOICE</span>
          </div>
        </div>
      </div>

      {/* PDF Download & Print Status Popup ("popo") */}
      {pdfPopup && (
        <div 
          className="modal-overlay" 
          style={{ 
            zIndex: 10000, 
            background: 'rgba(15, 23, 42, 0.75)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
          onClick={() => setPdfPopup(null)}
        >
          <div 
            className="modal-card pdf-status-popup" 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              background: '#ffffff', 
              borderRadius: '24px', 
              padding: '28px 24px', 
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status Icon */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>
              {pdfPopup.type === 'print' ? '🖨️' : '📄'}
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {pdfPopup.title}
            </h3>
            
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '18px' }}>
              Invoice document has been generated and saved to your device.
            </p>

            {/* Saved Location Details Box */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'left', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>FILE NAME</span>
                <span style={{ fontSize: '0.78rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{pdfPopup.fileSize}</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', marginBottom: '12px' }}>
                {pdfPopup.fileName}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                SAVED LOCATION
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', fontSize: '0.85rem', color: '#334155' }}>
                <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>📁</span>
                <div style={{ wordBreak: 'break-all', lineHeight: 1.4 }}>
                  <strong style={{ color: '#2563eb' }}>Downloads Folder</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>
                    {/Android|iPhone|iPad/i.test(navigator.userAgent) ? pdfPopup.downloadPathMobile : pdfPopup.downloadPathDesktop}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (pdfPopup.blobUrl) {
                    window.open(pdfPopup.blobUrl, '_blank');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '30px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.45)'
                }}
              >
                📂 Open PDF Document
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.AndroidNative && typeof window.AndroidNative.print === 'function') {
                      window.AndroidNative.print();
                    } else if (window.electronAPI && typeof window.electronAPI.printInvoice === 'function') {
                      window.electronAPI.printInvoice();
                    } else {
                      window.print();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '24px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  🖨️ Print Again
                </button>

                <button
                  type="button"
                  data-close-pdf-popup="true"
                  onClick={() => setPdfPopup(null)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '24px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  ✖ Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
