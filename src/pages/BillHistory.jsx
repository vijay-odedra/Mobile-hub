import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, Printer, Trash2, Plus, FileSpreadsheet, Search, History, Receipt } from 'lucide-react';

const WhatsAppIcon = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.12-.519-1.821-.755-3.003-2.617-3.094-2.738-.092-.121-.735-.979-.735-1.867 0-.888.467-1.326.633-1.506.166-.18.363-.226.484-.226.12 0 .241.002.346.007.11.005.257-.042.403.308.147.351.503 1.228.547 1.318.044.09.073.196.015.312-.059.117-.088.19-.176.293-.088.103-.186.23-.266.309-.088.087-.181.182-.078.358.103.176.459.757 1.002 1.241.7.624 1.29.817 1.472.907.182.09.289.076.396-.048.106-.124.457-.533.58-.716.122-.182.244-.152.41-.091.167.061 1.057.498 1.238.589.182.09.303.136.348.213.045.077.045.448-.099.853z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.396C8.423 21.524 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.155-.49-4.431-1.332l-.318-.21-2.956.828.832-2.887-.229-.338C4.015 15.006 3.5 13.547 3.5 12c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
  </svg>
);

export default function BillHistory() {
  const { bills, deleteBill, setActiveInvoiceModal, setActivePage } = useApp();
  const [search, setSearch] = useState('');

  const filteredBills = bills.filter(b =>
    (b.bill_no && b.bill_no.toLowerCase().includes(search.toLowerCase())) ||
    (b.customer_name && b.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (b.customer_phone && b.customer_phone.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    if (bills.length === 0) return;
    const headers = ['bill_no', 'customer_name', 'customer_phone', 'grand_total', 'subtotal', 'gst_total', 'discount_total', 'date'];
    let csv = headers.join(',') + '\n';
    bills.forEach(b => {
      csv += [
        b.bill_no,
        `"${b.customer_name || ''}"`,
        b.customer_phone || '',
        b.grand_total || 0,
        b.subtotal || 0,
        b.gst_total || 0,
        b.discount_total || 0,
        `"${b.date || ''}"`
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-${Date.now()}.csv`;
    a.click();
  };

  const shareOnWhatsApp = (bill) => {
    let cleanPhone = (bill.customer_phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const dateStr = bill.date ? new Date(bill.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

    const msg = `📱 *STOCKLY - TAX INVOICE* 📱\n` +
      `--------------------------------\n` +
      `🧾 *Invoice No:* #${bill.bill_no}\n` +
      `👤 *Customer:* ${bill.customer_name || 'Customer'}\n` +
      `📞 *Phone:* ${bill.customer_phone || 'N/A'}\n` +
      `📅 *Date:* ${dateStr}\n` +
      `--------------------------------\n` +
      `💰 *Subtotal:* ₹${Number(bill.subtotal || 0).toFixed(2)}\n` +
      `🏷️ *GST Total:* ₹${Number(bill.gst_total || 0).toFixed(2)}\n` +
      `🎁 *Discount Total:* ₹${Number(bill.discount_total || 0).toFixed(2)}\n` +
      `✨ *Grand Total:* ₹${Number(bill.grand_total || 0).toFixed(2)}\n` +
      `--------------------------------\n` +
      `Thank you for shopping with Stockly! 🙏`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} style={{ color: '#6d54fe' }} /> Bill History
          </h1>
          <p className="page-subtitle">Track, reprint, download, and export customer sales receipts</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setActivePage('billing')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> New Bill
          </button>
          <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="page-card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-bar-custom" style={{ marginBottom: 0, width: '380px', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="count-badge">{filteredBills.length} of {bills.length} Invoices</span>
        </div>

        {filteredBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8c8fa7' }}>
            <Receipt size={48} style={{ color: '#cbd5e1', marginBottom: '10px', display: 'inline-block' }} />
            <strong style={{ fontSize: '1.05rem', color: '#1e1e2d', display: 'block' }}>No Invoices Found</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>No sales records match your current search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cart-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(bill => {
                  return (
                    <tr key={bill.id}>
                      <td><strong>#{bill.bill_no}</strong></td>
                      <td><strong style={{ color: '#1e1e2d' }}>{bill.customer_name}</strong></td>
                      <td>{bill.customer_phone || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#6d54fe', fontSize: '1rem' }}>
                          ₹ {Number(bill.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {bill.date ? new Date(bill.date).toLocaleString('en-GB') : 'N/A'}
                      </td>
                      <td>
                        <div className="action-cell" style={{ justifyContent: 'flex-end', display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-view-sm"
                            title="View Tax Invoice"
                            onClick={() => setActiveInvoiceModal(bill)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn-print-sm"
                            title="Print Invoice"
                            onClick={() => {
                              setActiveInvoiceModal(bill);
                              setTimeout(() => window.print(), 300);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            className="btn-whatsapp-sm"
                            title="Share directly on WhatsApp"
                            onClick={() => shareOnWhatsApp(bill)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}
                          >
                            <WhatsAppIcon size={16} color="#16a34a" />
                          </button>
                          <button
                            className="btn-delete-sm"
                            title="Move to Trash"
                            onClick={() => deleteBill(bill.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
