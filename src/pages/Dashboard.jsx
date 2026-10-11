import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { products, bills, staffList, lowStockProducts, setActivePage } = useApp();
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const totalRevenue = bills.reduce((acc, b) => acc + (b.grand_total || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
  const presentStaffCount = staffList.filter(s => s.attendance === 'present' || s.working_now).length;
  
  const todayBills = bills.filter(b => {
    const d = b.date ? new Date(b.date) : new Date(b.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const dateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    let pieChartInstance = null;
    let barChartInstance = null;

    if (pieRef.current && products.length > 0) {
      // Category counts
      const catCounts = {};
      products.forEach(p => {
        const cat = p.category || 'General';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      pieChartInstance = new Chart(pieRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            data: Object.values(catCounts),
            backgroundColor: ['#6d54fe', '#b2a8f8', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
          },
          cutout: '70%'
        }
      });
    }

    if (barRef.current && products.length > 0) {
      const topProducts = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 6);
      
      const ctx = barRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, '#6d54fe');
      gradient.addColorStop(1, '#9b8afc');

      barChartInstance = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: topProducts.map(p => p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name),
          datasets: [{
            label: 'Stock Quantity',
            data: topProducts.map(p => p.stock || 0),
            backgroundColor: gradient,
            borderRadius: 10,
            barThickness: 32
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#78829d', font: { size: 11 } } },
            y: { grid: { color: '#f2f3f9' }, ticks: { color: '#78829d', font: { size: 11 } } }
          }
        }
      });
    }

    return () => {
      if (pieChartInstance) pieChartInstance.destroy();
      if (barChartInstance) barChartInstance.destroy();
    };
  }, [products]);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time retail analytics & overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #e7e8f2', borderRadius: '14px', padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <i className="far fa-calendar-alt" style={{ color: '#6d54fe' }}></i>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#8c8fa7', display: 'block', fontWeight: 600 }}>Today</span>
            <strong style={{ fontSize: '0.85rem', color: '#1e1e2d' }}>{dateFormatted}</strong>
          </div>
        </div>
      </div>

      {/* Top 3 Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="page-card-container" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e1e2d' }}>Total Revenue</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#5846eb', margin: '4px 0 6px' }}>
              ₹ {totalRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#78829d' }}>Across {bills.length} sales bills</div>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <i className="fas fa-chart-line"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e1e2d' }}>Total Products</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#1e1e2d', margin: '4px 0 6px' }}>
              {products.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#78829d' }}>Inventory: ₹ {totalInventoryValue.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <i className="fas fa-boxes"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e1e2d' }}>Low Stock Alerts</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981', margin: '4px 0 6px' }}>
              {lowStockProducts.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981' }}>
              <i className={`fas ${lowStockProducts.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>{' '}
              {lowStockProducts.length > 0 ? 'Action required' : 'All items well stocked'}
            </div>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: lowStockProducts.length > 0 ? '#fef2f2' : '#ecfdf5', color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <i className="fas fa-bell"></i>
          </div>
        </div>
      </div>

      {/* Mid 4 Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Total Staff</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e1e2d', marginTop: '2px' }}>{staffList.length}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-users"></i>
          </div>
        </div>

        <div 
          className="page-card-container" 
          onClick={() => setActivePage('staff')}
          style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          title="Click to view Staff & Daily Attendance"
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Present Today</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{presentStaffCount}</div>
            <div style={{ fontSize: '0.74rem', color: '#6d54fe', fontWeight: 700, marginTop: '2px' }}>Tap for Attendance &rarr;</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-user-check"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Today's Invoices</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e1e2d', marginTop: '2px' }}>{todayBills}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-receipt"></i>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#78829d', fontWeight: 600 }}>Stock Units</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#6d54fe', marginTop: '2px' }}>
              {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-cubes"></i>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px', marginBottom: '22px' }}>
        <div className="page-card-container" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#1e1e2d' }}>
            Category Distribution
          </h3>
          <div style={{ height: '230px', position: 'relative' }}>
            <canvas ref={pieRef}></canvas>
          </div>
        </div>

        <div className="page-card-container" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#1e1e2d' }}>
            Top Products by Stock
          </h3>
          <div style={{ height: '230px', position: 'relative' }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <div
          onClick={() => setActivePage('lowstock')}
          style={{
            background: 'white',
            border: '1.5px solid #fecaca',
            borderRadius: '18px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(239,68,68,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              <i className="fas fa-exclamation"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e1e2d', fontSize: '0.95rem' }}>
                {lowStockProducts.length} product(s) are running out of stock!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78829d' }}>
                Click here to review restock alerts and update inventory thresholds.
              </div>
            </div>
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>
      )}
    </div>
  );
}
