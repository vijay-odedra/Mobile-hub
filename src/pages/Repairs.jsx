import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Repairs() {
  const { repairs, saveRepair, deleteRepair } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState(null); // null or { isNew: true } or repair object

  const pendingCount = repairs.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const inProgCount = repairs.filter(r => (r.status || '').toLowerCase() === 'in-progress').length;
  const completedCount = repairs.filter(r => (r.status || '').toLowerCase() === 'completed').length;

  const filtered = repairs.filter(r => {
    const matchesSearch =
      (r.customer_name && r.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.device_model && r.device_model.toLowerCase().includes(search.toLowerCase())) ||
      (r.phone && r.phone.includes(search)) ||
      (r.issue && r.issue.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    return (r.status || '').toLowerCase() === filter;
  });

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">
            <i className="fas fa-tools" style={{ color: '#6d54fe', fontSize: '1.5rem' }}></i> Repair Services
          </h1>
          <p className="page-subtitle">Track device diagnostics, repair statuses, cost estimates, and customer deliveries</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveModal({ isNew: true })}>
          <i className="fas fa-plus"></i> New Repair Order
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '22px' }}>
        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Total Repairs</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e1e2d', marginTop: '2px' }}>{repairs.length}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-tools"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{pendingCount}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-clock"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>In Progress</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#6d54fe', marginTop: '2px' }}>{inProgCount}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-cogs"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Completed</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{completedCount}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-check-circle"></i>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'in-progress', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                border: '1.5px solid #e2e8f0',
                background: filter === tab ? '#1e1e2d' : 'white',
                color: filter === tab ? 'white' : '#525c76',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'all' ? 'All Orders' : tab}
            </button>
          ))}
        </div>

        <div className="search-bar-custom" style={{ marginBottom: 0, width: '320px', padding: '6px 16px' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search device, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Repairs Grid */}
      {filtered.length === 0 ? (
        <div className="page-card-container" style={{ textAlign: 'center', padding: '50px 20px', color: '#8c8fa7' }}>
          <i className="fas fa-tools" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '10px', display: 'block' }}></i>
          <strong style={{ fontSize: '1.05rem', color: '#1e1e2d' }}>No Repair Orders</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>No orders found for this filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map(r => {
            const st = (r.status || 'pending').toLowerCase();
            const badgeBg = st === 'completed' ? '#ecfdf5' : st === 'in-progress' ? '#f4f3ff' : '#fffbeb';
            const badgeColor = st === 'completed' ? '#15803d' : st === 'in-progress' ? '#6d54fe' : '#b45309';

            return (
              <div
                key={r.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid #edeef6',
                  padding: '20px',
                  boxShadow: '0 4px 18px rgba(109,84,254,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f2f3f9', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#6d54fe', fontSize: '0.88rem' }}>Ticket #{r.id}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e1e2d', marginTop: '2px' }}>{r.device_model}</h4>
                  </div>
                  <span style={{ background: badgeBg, color: badgeColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {r.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-user" style={{ color: '#8c8fa7', width: '16px' }}></i>
                    <div>
                      <strong>{r.customer_name}</strong> &bull; {r.phone || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', width: '16px' }}></i>
                    <div>{r.issue || 'No issue description'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-rupee-sign" style={{ color: '#10b981', width: '16px' }}></i>
                    <div>
                      Est. Cost: <strong style={{ color: '#1e1e2d' }}>₹ {Number(r.estimated_cost || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #f2f3f9' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', justifyContent: 'center' }}
                    onClick={() => setActiveModal(r)}
                  >
                    <i className="fas fa-edit"></i> Edit Ticket
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => deleteRepair(r.id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Repair Modal */}
      {activeModal && (
        <RepairModal
          repair={activeModal.isNew ? null : activeModal}
          onClose={() => setActiveModal(null)}
          onSave={async (data) => {
            const ok = await saveRepair(data, activeModal.isNew ? null : activeModal.id);
            if (ok) setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}

function RepairModal({ repair, onClose, onSave }) {
  const [customerName, setCustomerName] = useState(repair?.customer_name || '');
  const [phone, setPhone] = useState(repair?.phone || '');
  const [deviceModel, setDeviceModel] = useState(repair?.device_model || '');
  const [issue, setIssue] = useState(repair?.issue || '');
  const [estimatedCost, setEstimatedCost] = useState(repair?.estimated_cost || 0);
  const [status, setStatus] = useState(repair?.status || 'pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName || !deviceModel) {
      alert('Customer Name and Device Model are required');
      return;
    }
    onSave({
      customerName,
      phone,
      deviceModel,
      issue,
      estimatedCost: parseFloat(estimatedCost) || 0,
      status,
      receivedDate: repair?.received_date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '18px' }}>
          {repair ? 'Update Repair Ticket' : 'New Repair Order'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Name *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Device Model *</label>
            <input type="text" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="e.g. iPhone 14 Pro Max" required />
          </div>
          <div className="form-group">
            <label>Issue Description</label>
            <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows="3" placeholder="e.g. Screen broken, battery draining fast" />
          </div>
          <div className="form-group">
            <label>Estimated Cost (₹)</label>
            <input type="number" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
}
