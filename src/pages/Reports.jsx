import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Printer, Download, Calendar, Award, PieChart as PieIcon } from 'lucide-react';
import Chart from 'chart.js/auto';
import { exportToCSV } from '../utils/exportCsv';

export default function Reports() {
  const { apiGet, showToast } = useApp();
  
  const [daysRange, setDaysRange] = useState(30);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const fetchReports = async (start, end) => {
    setLoading(true);
    try {
      const data = await apiGet(`/reports/sales?startDate=${start}&endDate=${end}`);
      if (Array.isArray(data)) {
        setReportData(data);
      } else {
        setReportData([]);
      }
    } catch (e) {
      console.error(e);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(startDate, endDate);
  }, [startDate, endDate]);

  const handleRangeChange = (days) => {
    setDaysRange(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    setStartDate(startStr);
    setEndDate(endStr);
  };

  // Aggregations
  const totalRevenue = reportData.reduce((s, b) => s + (Number(b.grand_total) || 0), 0);
  const totalGst = reportData.reduce((s, b) => s + (Number(b.gst_total) || 0), 0);
  const totalDiscount = reportData.reduce((s, b) => s + (Number(b.discount_total) || 0), 0);
  const totalUnits = reportData.reduce((s, b) => s + (b.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0), 0);

  // Top products
  const productSalesMap = {};
  reportData.forEach(b => {
    (b.items || []).forEach(i => {
      const name = i.product_name || 'Item';
      if (!productSalesMap[name]) {
        productSalesMap[name] = { qty: 0, revenue: 0 };
      }
      const q = Number(i.quantity) || 0;
      const p = Number(i.price) || 0;
      productSalesMap[name].qty += q;
      productSalesMap[name].revenue += p * q;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  // Chart rendering
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (topProducts.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topProducts.map(([name]) => name),
        datasets: [{
          data: topProducts.map(([, d]) => d.revenue),
          backgroundColor: [
            '#6d54fe', '#3b82f6', '#10b981', '#f59e0b', 
            '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b', '#a855f7'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { size: 11, family: 'Plus Jakarta Sans' }
            }
          }
        },
        cutout: '65%'
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [topProducts]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const formatted = reportData.map(b => ({
      invoice_no: `#${b.bill_no}`,
      date: b.date || '',
      customer: b.customer_name || '',
      phone: b.customer_phone || '',
      items_count: (b.items || []).length,
      gst: b.gst_total || 0,
      discount: b.discount_total || 0,
      grand_total: b.grand_total || 0,
      payment_mode: b.payment_method || 'Cash'
    }));

    exportToCSV(formatted, 'sales_analytics_report', [
      'invoice_no', 'date', 'customer', 'phone', 'items_count', 'gst', 'discount', 'grand_total', 'payment_mode'
    ]);
    showToast('Report data exported to CSV', 'success');
  };

  return (
    <div className="fade-in">
      {/* Title Row */}
      <div className="page-title-row no-print">
        <div>
          <h1 className="page-title">
            <BarChart3 style={{ color: 'var(--primary)' }} /> Business Reports & Analytics
          </h1>
          <p className="page-subtitle">Track revenue streams, GST collections, discounts, and product volume</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="reports-container report-print-area">
        {/* Filters */}
        <div className="filter-row no-print">
          <div>
            <label style={{ fontWeight: 600, marginRight: '8px' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, marginRight: '8px' }}>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <div className="quick-range-btns">
            <button 
              className={daysRange === 7 ? 'active' : ''} 
              onClick={() => handleRangeChange(7)}
            >
              Last 7 Days
            </button>
            <button 
              className={daysRange === 30 ? 'active' : ''} 
              onClick={() => handleRangeChange(30)}
            >
              Last 30 Days
            </button>
            <button 
              className={daysRange === 90 ? 'active' : ''} 
              onClick={() => handleRangeChange(90)}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Items */}
        <div className="report-summary-grid">
          <div className="report-summary-item">
            <div className="num" style={{ color: '#6d54fe' }}>{reportData.length}</div>
            <div className="label">Total Bills</div>
          </div>
          <div className="report-summary-item">
            <div className="num" style={{ color: '#3b82f6' }}>{totalUnits}</div>
            <div className="label">Units Sold</div>
          </div>
          <div className="report-summary-item">
            <div className="num" style={{ color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="label">Gross Sales</div>
          </div>
          <div className="report-summary-item">
            <div className="num" style={{ color: '#8b5cf6' }}>₹{totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="label">GST Collected</div>
          </div>
          <div className="report-summary-item">
            <div className="num" style={{ color: '#ef4444' }}>-₹{totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="label">Discounts</div>
          </div>
        </div>

        {/* Analytics Charts & Rankings */}
        <div className="report-chart-row">
          <div className="report-chart-box">
            <div style={{ fontWeight: 700, color: '#1e1e2d', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={18} style={{ color: '#6d54fe' }} /> Revenue by Product
            </div>
            <div style={{ position: 'relative', height: '260px' }}>
              {topProducts.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8fa7' }}>
                  No sales recorded for this period
                </div>
              ) : (
                <canvas ref={chartRef}></canvas>
              )}
            </div>
          </div>

          <div className="report-chart-box">
            <div style={{ fontWeight: 700, color: '#1e1e2d', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: '#f59e0b' }} /> Top Selling Products
            </div>
            <div className="top-products-list">
              {topProducts.length === 0 ? (
                <p style={{ color: '#8c8fa7', padding: '20px', textAlign: 'center' }}>No sales recorded for this period</p>
              ) : (
                topProducts.map(([name, data], idx) => (
                  <div key={idx} className="top-product-item">
                    <span>
                      <span className="rank">#{idx + 1}</span> <strong>{name}</strong>
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      ₹{data.revenue.toLocaleString('en-IN')} <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 400 }}>({data.qty} units)</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Period banner */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px 20px', 
          background: '#fafaff', 
          borderRadius: '20px', 
          border: '1px solid #edeef6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#6d54fe' }} />
            <strong style={{ color: '#1e1e2d' }}>Active Filter Period:</strong>
            <span style={{ color: '#525c76', marginLeft: '4px' }}>{startDate} &rarr; {endDate}</span>
          </div>
          <span className="count-badge">{reportData.length} records analyzed</span>
        </div>

        {/* Detailed Invoices in Period Table */}
        <div className="report-table-section">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e1e2d', marginBottom: '16px' }}>
            Detailed Invoices in Period
          </h3>

          {reportData.length === 0 ? (
            <div className="empty-state-card" style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #edeef6' }}>
              <BarChart3 size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <h3>No Invoices in Date Range</h3>
              <p>Try widening the date range using the filters above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '18px', border: '1px solid #edeef6' }}>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items Summary</th>
                    <th>GST</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(b => (
                    <tr key={b.id || b.bill_no}>
                      <td><strong style={{ color: 'var(--primary)' }}>#{b.bill_no}</strong></td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{b.date || ''}</td>
                      <td><strong>{b.customer_name || 'Walk-in Customer'}</strong></td>
                      <td style={{ maxWidth: '300px' }}>
                        {(b.items || []).map((i, idx) => (
                          <span key={idx}>
                            {i.product_name} <span style={{ color: '#6d54fe', fontWeight: 600 }}>(x{i.quantity || 1})</span>
                            {idx < (b.items || []).length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                      <td style={{ color: '#64748b' }}>₹{(Number(b.gst_total) || 0).toFixed(2)}</td>
                      <td style={{ color: '#ef4444' }}>₹{(Number(b.discount_total) || 0).toFixed(2)}</td>
                      <td>
                        <strong style={{ color: '#6d54fe', fontSize: '0.95rem' }}>
                          ₹{(Number(b.grand_total) || 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
