import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, UserCheck, UserX, Clock, Plus, Download, 
  Search, Edit3, Trash2, CheckCircle2, XCircle, X,
  RotateCcw, Check, Sparkles, Phone, MessageSquare,
  ArrowRight, ArrowLeft, Filter
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export default function Staff({ initialTab = 'directory' }) {
  const { 
    staffList, 
    loadAllData, 
    apiPost, 
    apiPut, 
    apiDelete, 
    updateAttendance, 
    showToast 
  } = useApp();

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Active view tab: 'attendance' (Swipe Deck & Message Feed) or 'directory' (List/Table/Cards)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', phone: '', status: 'active' });

  // Attendance Deck State
  const [deck, setDeck] = useState(() => {
    // If attendance was already completed today, start with empty deck (show completion / message feed)
    const isCompleted = localStorage.getItem('attendance_completed_' + todayDateStr) === 'true';
    if (isCompleted) return [];
    return staffList || [];
  });
  const [swipedHistory, setSwipedHistory] = useState([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const activeCardRef = useRef(null);

  // Initialize unrecorded staff to 'absent' by default, and load deck if not yet completed today
  useEffect(() => {
    if (staffList && staffList.length > 0) {
      staffList.forEach(s => {
        if (!s.attendance) {
          updateAttendance(s.id, 'absent');
        }
      });
      const isCompleted = localStorage.getItem('attendance_completed_' + todayDateStr) === 'true';
      if (!isCompleted && deck.length === 0 && swipedHistory.length === 0) {
        setDeck(staffList);
      }
    }
  }, [staffList.length, todayDateStr]);

  const presentCount = staffList.filter(s => s.attendance === 'present').length;
  const absentCount = staffList.filter(s => s.attendance === 'absent' || !s.attendance).length;
  const onLeaveCount = staffList.filter(s => s.status !== 'active' || s.on_leave).length;
  const presentStaffList = staffList.filter(s => s.attendance === 'present');
  const absentStaffList = staffList.filter(s => s.attendance === 'absent' || !s.attendance);

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'active' || filter === 'present') return s.attendance === 'present';
    if (filter === 'absent') return s.attendance === 'absent' || !s.attendance;
    return true;
  });

  const handleExport = () => {
    exportToCSV(staffList, 'staff_directory', ['id', 'name', 'role', 'phone', 'status', 'attendance']);
    showToast('Staff list exported to CSV', 'success');
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({ name: '', role: '', phone: '', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      role: staff.role || '',
      phone: staff.phone || '',
      status: staff.status || 'active'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    if (editingStaff) {
      const res = await apiPut(`/staff/${editingStaff.id}`, formData);
      if (res && res.success) {
        await loadAllData();
        setModalOpen(false);
        showToast('Staff member updated', 'success');
      }
    } else {
      const res = await apiPost('/staff', formData);
      if (res && res.success) {
        await loadAllData();
        setModalOpen(false);
        showToast('Staff member added', 'success');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    const res = await apiDelete(`/staff/${id}`);
    if (res && res.success) {
      await loadAllData();
      showToast('Staff member deleted', 'success');
    }
  };

  // ============================================
  // SWIPE GESTURE HANDLERS (Left = Present, Right = Absent)
  // ============================================
  const currentCard = deck.length > 0 ? deck[0] : null;

  const handleStart = (clientX, clientY) => {
    if (!currentCard) return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !currentCard) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  // Commit Swipe:
  // Left side -> Present
  // Right side -> Absent
  const commitSwipe = async (direction) => {
    if (!currentCard) return;
    const staff = currentCard;
    const status = direction === 'left' ? 'present' : 'absent';

    // Animate removal to the respective side
    setDragOffset({
      x: direction === 'left' ? -500 : 500,
      y: 0
    });

    setTimeout(async () => {
      await updateAttendance(staff.id, status);
      const remainingDeck = deck.slice(1);
      setDeck(remainingDeck);
      setSwipedHistory(prev => [{ staff, status, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);

      if (status === 'present') {
        showToast(`${staff.name} marked Present ✓`, 'success');
      } else {
        showToast(`${staff.name} marked Absent ✗`, 'error');
      }

      // If this was the last card, mark attendance as completed for today so it's not asked a second time!
      if (remainingDeck.length === 0) {
        localStorage.setItem('attendance_completed_' + todayDateStr, 'true');
        showToast('Daily attendance completed and saved! 🎉', 'success');
      }
    }, 220);
  };

  const handleEnd = () => {
    if (!isDragging || !currentCard) return;
    setIsDragging(false);
    const threshold = 75;

    if (dragOffset.x < -threshold) {
      commitSwipe('left');
    } else if (dragOffset.x > threshold) {
      commitSwipe('right');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Reset or Re-take Attendance for today
  const handleResetDeck = () => {
    localStorage.removeItem('attendance_completed_' + todayDateStr);
    setDeck(staffList);
    setSwipedHistory([]);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    showToast('Attendance swipe deck reset for re-taking', 'info');
  };

  const handleMarkAllPresent = async () => {
    for (const s of staffList) {
      await updateAttendance(s.id, 'present');
    }
    setDeck([]);
    localStorage.setItem('attendance_completed_' + todayDateStr, 'true');
    showToast('All staff marked Present ✓', 'success');
  };

  const handleMarkAllAbsent = async () => {
    for (const s of staffList) {
      await updateAttendance(s.id, 'absent');
    }
    setDeck([]);
    localStorage.setItem('attendance_completed_' + todayDateStr, 'true');
    showToast('All staff marked Absent ✗', 'info');
  };

  const rotation = dragOffset.x * 0.08;
  const leftOpacity = Math.min(Math.max(-dragOffset.x / 80, 0), 1);
  const rightOpacity = Math.min(Math.max(dragOffset.x / 80, 0), 1);

  return (
    <div className="fade-in" style={{ paddingBottom: '30px' }}>
      {/* Page Header */}
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: 'var(--primary)' }} /> Staff Management
          </h1>
          <p className="page-subtitle">Directory, roles, and real-time gesture-based daily attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-primary" 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Staff
          </button>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top KPI Stats Row */}
      <div className="dash-stats-row-mid" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="dash-card-white" onClick={() => { setActiveTab('directory'); setFilter('all'); }} style={{ cursor: 'pointer' }}>
          <div>
            <div className="dash-card-label">Total Staff</div>
            <div className="dash-card-value purple-num">{staffList.length}</div>
            <div className="dash-card-sub">Active workforce</div>
          </div>
          <div className="dash-icon-circle"><Users size={20} /></div>
        </div>

        <div className="dash-card-white" onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="dash-card-label">Present Today</div>
            <div className="dash-card-value" style={{ color: '#10b981' }}>{presentCount}</div>
            <div className="dash-card-sub" style={{ color: '#10b981' }}>
              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} /> On duty (Tap deck)
            </div>
          </div>
          <div className="dash-icon-circle" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <UserCheck size={20} />
          </div>
        </div>

        <div className="dash-card-white" onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="dash-card-label">Absent Today</div>
            <div className="dash-card-value" style={{ color: '#ef4444' }}>{absentCount}</div>
            <div className="dash-card-sub" style={{ color: '#ef4444' }}>
              <XCircle size={12} style={{ display: 'inline', marginRight: 4 }} /> Default status
            </div>
          </div>
          <div className="dash-icon-circle" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <UserX size={20} />
          </div>
        </div>

        <div className="dash-card-white">
          <div>
            <div className="dash-card-label">On Leave / Inactive</div>
            <div className="dash-card-value" style={{ color: '#f59e0b' }}>{onLeaveCount}</div>
            <div className="dash-card-sub">Inactive accounts</div>
          </div>
          <div className="dash-icon-circle" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Segmented Mode Switcher */}
      <div 
        style={{ 
          display: 'flex', 
          background: '#ffffff', 
          padding: '6px', 
          borderRadius: '24px', 
          border: '1.5px solid #e2e8f0', 
          marginBottom: '22px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          maxWidth: '540px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '18px',
            border: 'none',
            background: activeTab === 'attendance' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: activeTab === 'attendance' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'attendance' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none'
          }}
        >
          <span>📋 Swipe Attendance</span>
          <span 
            style={{ 
              background: activeTab === 'attendance' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', 
              color: activeTab === 'attendance' ? '#ffffff' : '#475569', 
              fontSize: '0.72rem', 
              padding: '2px 8px', 
              borderRadius: '12px' 
            }}
          >
            {deck.length > 0 ? `${deck.length} left` : 'Completed ✓'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '18px',
            border: 'none',
            background: activeTab === 'directory' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: activeTab === 'directory' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'directory' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none'
          }}
        >
          <span>👥 Staff Directory</span>
          <span 
            style={{ 
              background: activeTab === 'directory' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', 
              color: activeTab === 'directory' ? '#ffffff' : '#475569', 
              fontSize: '0.72rem', 
              padding: '2px 8px', 
              borderRadius: '12px' 
            }}
          >
            {staffList.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: ATTENDANCE SWIPE DECK & MESSAGE FEED             */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="attendance-deck-section" style={{ maxWidth: '640px', margin: '0 auto' }}>
          {currentCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Swipe Guide Headers */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '0 6px', boxSizing: 'border-box' }}>
                <div style={{ color: '#059669', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👈 SWIPE LEFT</span>
                  <span style={{ background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>PRESENT</span>
                </div>
                <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#fef2f2', padding: '3px 10px', borderRadius: '12px', border: '1px solid #fecaca' }}>ABSENT</span>
                  <span>SWIPE RIGHT 👉</span>
                </div>
              </div>

              {/* Card Stage with stacked cards effect */}
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '340px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
              >
                {/* Behind card 2 */}
                {deck.length > 2 && (
                  <div 
                    style={{
                      position: 'absolute',
                      width: '88%',
                      height: '270px',
                      background: '#f8fafc',
                      borderRadius: '28px',
                      transform: 'scale(0.9) translateY(32px)',
                      zIndex: 1,
                      border: '1px solid #e2e8f0',
                      opacity: 0.5
                    }}
                  />
                )}

                {/* Behind card 1 (next to up when top card is removed) */}
                {deck.length > 1 && (
                  <div 
                    style={{
                      position: 'absolute',
                      width: '94%',
                      height: '290px',
                      background: '#ffffff',
                      borderRadius: '28px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                      transform: 'scale(0.95) translateY(16px)',
                      zIndex: 2,
                      border: '1.5px solid #e2e8f0',
                      opacity: 0.85,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px'
                    }}
                  >
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700 }}>
                      Next: {deck[1].name}
                    </div>
                  </div>
                )}

                {/* Front Swipable Card */}
                <div
                  ref={activeCardRef}
                  onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={handleEnd}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '320px',
                    background: '#ffffff',
                    borderRadius: '28px',
                    boxShadow: isDragging 
                      ? '0 30px 60px -12px rgba(0, 0, 0, 0.25)' 
                      : '0 20px 45px -10px rgba(0, 0, 0, 0.12)',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px 24px',
                    boxSizing: 'border-box',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: `translate(${dragOffset.x}px, ${dragOffset.y * 0.25}px) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 10,
                    overflow: 'hidden'
                  }}
                >
                  {/* Dynamic PRESENT Badge (Swipe Left) */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      opacity: leftOpacity,
                      transform: 'rotate(-10deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    ✓ PRESENT
                  </div>

                  {/* Dynamic ABSENT Badge (Swipe Right) */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                      opacity: rightOpacity,
                      transform: 'rotate(10deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    ✗ ABSENT
                  </div>

                  {/* Avatar */}
                  <div 
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
                      marginBottom: '16px'
                    }}
                  >
                    {currentCard.name ? currentCard.name.charAt(0).toUpperCase() : 'S'}
                  </div>

                  {/* Name */}
                  <h2 
                    style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 800, 
                      color: '#0f172a', 
                      margin: '0 0 6px', 
                      textAlign: 'center',
                      letterSpacing: '-0.5px',
                      maxWidth: '90%',
                      wordBreak: 'break-word'
                    }}
                  >
                    {currentCard.name}
                  </h2>

                  {/* Role */}
                  <span style={{ fontSize: '0.85rem', color: '#6d54fe', background: '#f4f3ff', padding: '4px 14px', borderRadius: '16px', fontWeight: 700 }}>
                    {currentCard.role || 'Staff Member'}
                  </span>

                  <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
                    Swipe left for Present &bull; Swipe right for Absent
                  </div>
                </div>
              </div>

              {/* Progress counter */}
              <div style={{ marginTop: '16px', color: '#64748b', fontSize: '0.88rem', fontWeight: 700 }}>
                Card <b>{staffList.length - deck.length + 1}</b> of <b>{staffList.length}</b> ({deck.length} remaining)
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '18px', width: '100%', maxWidth: '380px' }}>
                <button
                  type="button"
                  onClick={() => commitSwipe('left')}
                  style={{
                    flex: 1,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '20px',
                    padding: '12px 18px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={18} /> Mark Present
                </button>
                <button
                  type="button"
                  onClick={() => commitSwipe('right')}
                  style={{
                    flex: 1,
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1.5px solid #fecaca',
                    borderRadius: '20px',
                    padding: '12px 18px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={18} /> Mark Absent
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* ATTENDANCE COMPLETED VIEW: MESSAGE FEED OF ALL EMPLOYEES */
            /* ======================================================== */
            <div 
              className="attendance-summary-card" 
              style={{ 
                background: '#ffffff', 
                borderRadius: '24px', 
                padding: '24px 20px', 
                boxShadow: '0 15px 40px rgba(0,0,0,0.06)', 
                border: '1.5px solid #e2e8f0', 
                textAlign: 'center' 
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '30px' }}>
                🎉
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Daily Attendance Stored
              </h2>

              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 auto 18px', maxWidth: '420px' }}>
                Recorded for <b>{todayDateStr}</b>. Stored safely — refreshing will not clear your attendance or log you out.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={handleResetDeck}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  <RotateCcw size={14} /> Re-take Today's Attendance
                </button>
                <button 
                  type="button" 
                  onClick={handleMarkAllPresent}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  <Check size={14} /> Mark All Present
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('directory')}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  👥 Staff Directory
                </button>
              </div>

              {/* MULTIPLE MESSAGE VIEW FOR ALL EMPLOYEES ("mobile to show like to show a multiple message in top to same type to all emp show") */}
              <div style={{ textAlign: 'left', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} style={{ color: '#6d54fe' }} />
                    <span style={{ fontWeight: 800, color: '#1e1e2d', fontSize: '0.96rem' }}>
                      Employee Attendance Messages
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                      ✓ {presentStaffList.length} Present
                    </span>
                    <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                      ✗ {absentStaffList.length} Absent
                    </span>
                  </div>
                </div>

                {/* Filter pills for message feed */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      background: filter === 'all' ? '#6d54fe' : '#ffffff',
                      color: filter === 'all' ? '#ffffff' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    All ({staffList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('present')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '14px',
                      border: '1px solid #bbf7d0',
                      background: filter === 'present' ? '#10b981' : '#ffffff',
                      color: filter === 'present' ? '#ffffff' : '#059669',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Present ({presentStaffList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('absent')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '14px',
                      border: '1px solid #fecaca',
                      background: filter === 'absent' ? '#ef4444' : '#ffffff',
                      color: filter === 'absent' ? '#ffffff' : '#dc2626',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Absent ({absentStaffList.length})
                  </button>
                </div>

                {/* Vertical Message Feed List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredStaff.map(staff => {
                    const isPresent = staff.attendance === 'present';
                    return (
                      <div key={staff.id} className="emp-message-card">
                        {/* Avatar with Status Dot */}
                        <div className="emp-msg-avatar-wrap">
                          <div className="emp-msg-avatar">
                            {(staff.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className={`emp-msg-status-dot ${isPresent ? 'present' : 'absent'}`} />
                        </div>

                        {/* Content */}
                        <div className="emp-msg-content">
                          <div className="emp-msg-top">
                            <span className="emp-msg-name">{staff.name}</span>
                            <span className="emp-msg-time" style={{ color: isPresent ? '#15803d' : '#b91c1c' }}>
                              {isPresent ? '✓ Present' : '✗ Absent'}
                            </span>
                          </div>
                          <div className="emp-msg-sub">
                            <span className="emp-msg-role">{staff.role || 'Staff Member'}</span>
                            <span className={`emp-msg-pill ${isPresent ? 'pill-present' : 'pill-absent'}`}>
                              {isPresent ? '✓ Marked Present Today' : '✗ Marked Absent'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Switch Action */}
                        <div className="emp-msg-actions">
                          <button
                            type="button"
                            onClick={() => updateAttendance(staff.id, isPresent ? 'absent' : 'present')}
                            style={{
                              border: isPresent ? '1px solid #fecaca' : '1px solid #bbf7d0',
                              background: isPresent ? '#fef2f2' : '#f0fdf4',
                              color: isPresent ? '#dc2626' : '#15803d',
                              padding: '6px 12px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={isPresent ? 'Tap to mark Absent' : 'Tap to mark Present'}
                          >
                            {isPresent ? 'Make Absent' : 'Make Present'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: STAFF DIRECTORY (DESKTOP TABLE & MOBILE CARDS)   */}
      {/* ======================================================== */}
      {activeTab === 'directory' && (
        <div className="fade-in">
          {/* Filter Pills */}
          <div className="staff-filter-btns" style={{ marginBottom: '18px' }}>
            <button 
              type="button"
              className={filter === 'all' ? 'active-filter' : ''} 
              onClick={() => setFilter('all')}
            >
              <Users size={14} style={{ display: 'inline', marginRight: 6 }} /> All Staff ({staffList.length})
            </button>
            <button 
              type="button"
              className={filter === 'active' || filter === 'present' ? 'active-filter-green' : ''} 
              onClick={() => setFilter('active')}
            >
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} /> Present Today ({presentCount})
            </button>
            <button 
              type="button"
              className={filter === 'absent' ? 'active-filter-red' : ''} 
              onClick={() => setFilter('absent')}
            >
              <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> Absent Today ({absentCount})
            </button>
          </div>

          <div className="page-card-container">
            {/* Search Bar & Member Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div className="search-bar-custom" style={{ margin: 0, flex: 1, maxWidth: '420px' }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search staff by name, role, phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="count-badge">{filteredStaff.length} of {staffList.length} Members</div>
            </div>

            {/* DESKTOP TABLE VIEW (Screens > 850px) */}
            <div className="staff-desktop-table" style={{ overflowX: 'auto' }}>
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Designation / Role</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Today's Attendance</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state-card">
                          <Users size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                          <h3>No Staff Found</h3>
                          <p>No team members match your current filter or search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(staff => (
                      <tr key={staff.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f4f3ff', color: '#6d54fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                              {(staff.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 700, color: '#1e1e2d', fontSize: '0.95rem' }}>{staff.name}</div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#6d54fe', background: '#f4f3ff', padding: '4px 12px', borderRadius: '14px', fontSize: '0.8rem' }}>
                            {staff.role || 'Staff'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b' }}>{staff.phone || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${staff.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {staff.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              type="button"
                              className={`attendance-btn btn-present ${staff.attendance === 'present' ? 'active' : ''}`}
                              onClick={() => updateAttendance(staff.id, 'present')}
                            >
                              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} /> Present
                            </button>
                            <button 
                              type="button"
                              className={`attendance-btn btn-absent ${staff.attendance === 'absent' ? 'active' : ''}`}
                              onClick={() => updateAttendance(staff.id, 'absent')}
                            >
                              <XCircle size={13} style={{ display: 'inline', marginRight: 4 }} /> Absent
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-edit-sm" title="Edit Staff" onClick={() => openEditModal(staff)}>
                              <Edit3 size={14} />
                            </button>
                            <button type="button" className="btn-delete-sm" title="Delete Staff" onClick={() => handleDelete(staff.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE RESPONSIVE CARDS VIEW (Screens <= 850px) */}
            <div className="staff-mobile-cards">
              {filteredStaff.length === 0 ? (
                <div className="empty-state-card" style={{ padding: '30px 16px' }}>
                  <Users size={36} style={{ color: '#cbd5e1', marginBottom: 10 }} />
                  <h4>No Staff Found</h4>
                  <p style={{ fontSize: '0.85rem' }}>No team members match your current filter.</p>
                </div>
              ) : (
                filteredStaff.map(staff => (
                  <div key={staff.id} className="staff-emp-card">
                    {/* Header Row: Avatar, Name, Role */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                          {(staff.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#1e1e2d', fontSize: '0.98rem' }}>{staff.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontWeight: 700, color: '#6d54fe', background: '#f4f3ff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem' }}>
                              {staff.role || 'Staff'}
                            </span>
                            <span className={`status-badge ${staff.status === 'active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              {staff.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn-edit-sm" title="Edit Staff" onClick={() => openEditModal(staff)}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" className="btn-delete-sm" title="Delete Staff" onClick={() => handleDelete(staff.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Phone Number */}
                    {staff.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.82rem' }}>
                        <Phone size={13} style={{ color: '#94a3b8' }} />
                        <span>{staff.phone}</span>
                      </div>
                    )}

                    {/* Attendance Buttons Row */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        type="button"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: staff.attendance === 'present' ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                          background: staff.attendance === 'present' ? '#dcfce7' : '#f8fafc',
                          color: staff.attendance === 'present' ? '#15803d' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onClick={() => updateAttendance(staff.id, 'present')}
                      >
                        <CheckCircle2 size={14} /> Present
                      </button>
                      <button 
                        type="button"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: staff.attendance === 'absent' ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                          background: staff.attendance === 'absent' ? '#fee2e2' : '#f8fafc',
                          color: staff.attendance === 'absent' ? '#b91c1c' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onClick={() => updateAttendance(staff.id, 'absent')}
                      >
                        <XCircle size={14} /> Absent
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role / Designation</label>
                <input 
                  type="text" 
                  value={formData.role} 
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                  placeholder="e.g. Technician, Cashier, Manager"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editingStaff ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
