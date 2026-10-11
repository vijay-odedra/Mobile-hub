import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, CheckCircle2, XCircle, ArrowLeft, RotateCcw, 
  Sparkles, Check, X, UserCheck, UserX, Calendar
} from 'lucide-react';

export default function Attendance() {
  const { staffList, updateAttendance, showToast, setActivePage } = useApp();
  
  // Track deck of unswiped staff cards
  const [deck, setDeck] = useState([]);
  const [swipedHistory, setSwipedHistory] = useState([]);
  
  // Drag state for gesture
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const activeCardRef = useRef(null);

  // Initialize all staff as absent by default and load deck
  useEffect(() => {
    if (staffList && staffList.length > 0) {
      // Ensure any staff member without attendance set defaults to 'absent'
      staffList.forEach(s => {
        if (!s.attendance) {
          updateAttendance(s.id, 'absent');
        }
      });
      // Load unswiped cards
      setDeck(staffList);
      setSwipedHistory([]);
    }
  }, [staffList.length]);

  const presentStaff = staffList.filter(s => s.attendance === 'present');
  const absentStaff = staffList.filter(s => s.attendance === 'absent' || !s.attendance);
  const currentCard = deck.length > 0 ? deck[0] : null;

  // Handle Drag / Swipe Start (Touch & Mouse)
  const handleStart = (clientX, clientY) => {
    if (!currentCard) return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  // Handle Drag Move (Touch & Mouse)
  const handleMove = (clientX, clientY) => {
    if (!isDragging || !currentCard) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  // Commit Swipe Action:
  // Swipe Left -> Present ("left side to remove staff to present")
  // Swipe Right -> Absent ("right side to remove staff to absent")
  const commitSwipe = async (direction) => {
    if (!currentCard) return;
    const staff = currentCard;
    const status = direction === 'left' ? 'present' : 'absent';

    // Animate card removal
    setDragOffset({
      x: direction === 'left' ? -500 : 500,
      y: 0
    });

    setTimeout(async () => {
      // Update attendance status
      await updateAttendance(staff.id, status);
      
      // Update deck
      setDeck(prev => prev.slice(1));
      setSwipedHistory(prev => [...prev, { staff, status }]);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);

      if (status === 'present') {
        showToast(`${staff.name} marked Present ✓`, 'success');
      } else {
        showToast(`${staff.name} marked Absent ✗`, 'error');
      }
    }, 220);
  };

  // Handle Drag End (Touch & Mouse)
  const handleEnd = () => {
    if (!isDragging || !currentCard) return;
    setIsDragging(false);
    const threshold = 75; // Minimum drag distance to trigger swipe

    if (dragOffset.x < -threshold) {
      // Swiped Left -> Present!
      commitSwipe('left');
    } else if (dragOffset.x > threshold) {
      // Swiped Right -> Absent!
      commitSwipe('right');
    } else {
      // Return to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Reset / Retake Attendance Deck
  const handleReset = () => {
    setDeck(staffList);
    setSwipedHistory([]);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    showToast('Attendance swipe deck reset', 'info');
  };

  // Mark all present
  const handleMarkAllPresent = async () => {
    for (const s of staffList) {
      await updateAttendance(s.id, 'present');
    }
    setDeck([]);
    showToast('All staff marked Present ✓', 'success');
  };

  // Mark all absent (default)
  const handleMarkAllAbsent = async () => {
    for (const s of staffList) {
      await updateAttendance(s.id, 'absent');
    }
    setDeck([]);
    showToast('All staff marked Absent ✗', 'info');
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', { 
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' 
  });

  // Calculate dynamic rotation and indicator opacity during drag
  const rotation = dragOffset.x * 0.08;
  const leftOpacity = Math.min(Math.max(-dragOffset.x / 80, 0), 1);
  const rightOpacity = Math.min(Math.max(dragOffset.x / 80, 0), 1);

  return (
    <div className="attendance-page-container fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '12px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
              📋 Attendance
            </h1>
            <span style={{ background: '#f4f3ff', color: '#6d54fe', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
              Gesture Mode
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
            {todayFormatted} &bull; Default status is <b>Absent</b>
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            Present: {presentStaff.length}
          </div>
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
            Absent: {absentStaff.length}
          </div>
        </div>
      </div>

      {/* ACTIVE SWIPE CARD DECK (When cards remain) */}
      {currentCard ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
          
          {/* Gesture Direction Guide Banners */}
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', marginBottom: '14px', padding: '0 4px', boxSizing: 'border-box' }}>
            <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👈 SWIPE LEFT</span>
              <span style={{ background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>PRESENT</span>
            </div>
            <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ background: '#fef2f2', padding: '2px 8px', borderRadius: '10px' }}>ABSENT</span>
              <span>SWIPE RIGHT 👉</span>
            </div>
          </div>

          {/* Interactive Card Stage */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '420px', 
              height: '340px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            {/* Background stack shadow card */}
            {deck.length > 1 && (
              <div 
                style={{
                  position: 'absolute',
                  width: '94%',
                  height: '290px',
                  background: '#f1f5f9',
                  borderRadius: '28px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                  transform: 'scale(0.95) translateY(16px)',
                  zIndex: 1,
                  opacity: 0.7
                }}
              />
            )}

            {/* Top Swipable Card - SHOWS ONLY THE NAME! */}
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
                height: '310px',
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
                transition: isDragging ? 'none' : 'transform 0.22s ease-out',
                zIndex: 10,
                overflow: 'hidden'
              }}
            >
              {/* Dynamic PRESENT Badge Overlay (Visible on Left Swipe) */}
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
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  opacity: leftOpacity,
                  transform: 'rotate(-10deg)',
                  pointerEvents: 'none'
                }}
              >
                ✓ PRESENT
              </div>

              {/* Dynamic ABSENT Badge Overlay (Visible on Right Swipe) */}
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
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  opacity: rightOpacity,
                  transform: 'rotate(10deg)',
                  pointerEvents: 'none'
                }}
              >
                ✗ ABSENT
              </div>

              {/* Avatar Initial */}
              <div 
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
                  marginBottom: '20px'
                }}
              >
                {currentCard.name ? currentCard.name.charAt(0).toUpperCase() : 'S'}
              </div>

              {/* ONLY NAME SHOWS HERE AS REQUESTED */}
              <h2 
                style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  margin: '0 0 8px', 
                  textAlign: 'center',
                  letterSpacing: '-0.5px',
                  maxWidth: '90%',
                  wordBreak: 'break-word'
                }}
              >
                {currentCard.name}
              </h2>

              {/* Simple subtle helper cue (NO BUTTONS!) */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
                <span>Drag or swipe card to record</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{ marginTop: '16px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            Card <b>{staffList.length - deck.length + 1}</b> of <b>{staffList.length}</b> ({deck.length} remaining)
          </div>
        </div>
      ) : (
        /* ATTENDANCE COMPLETED SUMMARY VIEW ("message releted to show all present and aebsent") */
        <div className="attendance-summary-card" style={{ background: '#ffffff', borderRadius: '24px', padding: '28px 24px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0', textAlign: 'center', marginTop: '10px' }}>
          
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>
            🎉
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Attendance Recorded!
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 auto 24px', maxWidth: '420px' }}>
            Today's attendance has been processed and synchronized with Firebase Cloud.
          </p>

          {/* Quick Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '24px', fontWeight: 700, fontSize: '0.88rem' }}
            >
              <RotateCcw size={15} /> Retake / Re-swipe
            </button>
            <button 
              type="button" 
              onClick={handleMarkAllPresent}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '24px', fontWeight: 700, fontSize: '0.88rem' }}
            >
              <Check size={15} /> Mark All Present
            </button>
            <button 
              type="button" 
              onClick={handleMarkAllAbsent}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '24px', fontWeight: 700, fontSize: '0.88rem', color: '#dc2626' }}
            >
              <X size={15} /> Reset All Absent
            </button>
          </div>

          {/* Dual Lists: Present vs Absent ("show all present and aebsent") */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', textAlign: 'left' }}>
            
            {/* PRESENT STAFF LIST */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '18px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 800, color: '#166534', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} /> Present Staff
                </span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.82rem' }}>
                  {presentStaff.length}
                </span>
              </div>

              {presentStaff.length === 0 ? (
                <div style={{ color: '#86efac', fontSize: '0.85rem', fontStyle: 'italic', padding: '8px 0' }}>
                  No staff members marked present yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {presentStaff.map(s => (
                    <div 
                      key={s.id} 
                      style={{ 
                        background: '#ffffff', 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        border: '1px solid #dcfce7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{s.name}</span>
                      <span style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                        ✓ Present
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ABSENT STAFF LIST */}
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '18px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserX size={18} /> Absent Staff
                </span>
                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.82rem' }}>
                  {absentStaff.length}
                </span>
              </div>

              {absentStaff.length === 0 ? (
                <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontStyle: 'italic', padding: '8px 0' }}>
                  All team members are present!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {absentStaff.map(s => (
                    <div 
                      key={s.id} 
                      style={{ 
                        background: '#ffffff', 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        border: '1px solid #fee2e2', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{s.name}</span>
                      <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                        ✗ Absent
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
