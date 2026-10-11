import React from 'react';
import { useApp } from '../context/AppContext';

export default function DeletedRecords() {
  const { deletedBills, restoreBill, setActivePage } = useApp();

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <i className="fas fa-trash-alt" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i> Deleted Records
          </h1>
          <p className="page-subtitle">Restore or permanently manage deleted sales invoices</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setActivePage('history')}>
            <i className="fas fa-arrow-left"></i> Back to Bill History
          </button>
        </div>
      </div>

      <div className="page-card-container">
        {deletedBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8c8fa7' }}>
            <i className="fas fa-trash-restore" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '10px', display: 'block' }}></i>
            <strong style={{ fontSize: '1.05rem', color: '#1e1e2d' }}>Trash is Empty</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Invoices moved to trash will appear here for recovery.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cart-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th>Deleted At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deletedBills.map(b => (
                  <tr key={b.id}>
                    <td><strong>#{b.bill_no}</strong></td>
                    <td><strong>{b.customer_name}</strong></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#6d54fe' }}>
                      ₹ {Number(b.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {b.deleted_at || 'Recently'}
                    </td>
                    <td>
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-success" onClick={() => restoreBill(b.id)}>
                          <i className="fas fa-undo"></i> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
