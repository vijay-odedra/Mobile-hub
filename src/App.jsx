import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import MobileBottomNav from './components/MobileBottomNav';
import ProductModal from './components/ProductModal';
import BarcodeModal from './components/BarcodeModal';
import TaxInvoiceModal from './components/TaxInvoiceModal';
import AuthModal from './components/AuthModal';

// Pages
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Repairs from './pages/Repairs';
import BillHistory from './pages/BillHistory';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import LowStock from './pages/LowStock';
import DeletedRecords from './pages/DeletedRecords';
import Attendance from './pages/Attendance';

export default function App() {
  const { 
    activePage, 
    setActivePage,
    currentUser,
    authModalOpen,
    setAuthModalOpen,
    activeInvoiceModal,
    setActiveInvoiceModal,
    activeProductModal,
    setActiveProductModal,
    activeBarcodeModal,
    setActiveBarcodeModal,
    showToast,
    toasts
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastBackPressRef = useRef(0);

  // Full Mobile Back Gesture handler (swipes from edges, back buttons, and hardware back)
  const handleBackGesture = useCallback(() => {
    // 1. If PDF download/print status popup is open, close it
    const pdfPopupCloseBtn = document.querySelector('[data-close-pdf-popup]');
    if (pdfPopupCloseBtn) {
      pdfPopupCloseBtn.click();
      return 'handled';
    }

    // 2. If Invoice modal is open, close it
    if (activeInvoiceModal) {
      setActiveInvoiceModal(null);
      return 'handled';
    }

    // 3. If Product modal is open, close it
    if (activeProductModal) {
      setActiveProductModal(null);
      return 'handled';
    }

    // 4. If Barcode modal is open, close it
    if (activeBarcodeModal) {
      setActiveBarcodeModal(null);
      return 'handled';
    }

    // 5. If Auth modal overlay is open, close it
    if (authModalOpen) {
      setAuthModalOpen(false);
      return 'handled';
    }

    // 6. If mobile sidebar drawer is open, close it
    if (sidebarOpen) {
      setSidebarOpen(false);
      return 'handled';
    }

    // 7. If on any sub-page other than dashboard, return to dashboard
    if (activePage !== 'dashboard') {
      setActivePage('dashboard');
      return 'handled';
    }

    // 8. If already on dashboard with nothing open: double back to exit
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      return 'exit';
    }
    lastBackPressRef.current = now;
    if (typeof showToast === 'function') {
      showToast('Press back again to exit', 'info');
    }
    return 'handled';
  }, [
    activeInvoiceModal,
    activeProductModal,
    activeBarcodeModal,
    authModalOpen,
    sidebarOpen,
    activePage,
    setActiveInvoiceModal,
    setActiveProductModal,
    setActiveBarcodeModal,
    setAuthModalOpen,
    setSidebarOpen,
    setActivePage,
    showToast
  ]);

  useEffect(() => {
    // 1. Expose for native Android BridgeActivity (onBackPressed)
    window.handleAndroidBackGesture = handleBackGesture;

    // 2. Cordova / Capacitor backbutton event
    const onBackButton = (e) => {
      e?.preventDefault?.();
      const res = handleBackGesture();
      if (res === 'exit') {
        if (window.AndroidNative && typeof window.AndroidNative.exitApp === 'function') {
          window.AndroidNative.exitApp();
        } else if (window.Capacitor?.Plugins?.App?.exitApp) {
          window.Capacitor.Plugins.App.exitApp();
        }
      }
    };
    document.addEventListener('backbutton', onBackButton);

    // 3. Capacitor App listener
    let capListener = null;
    if (window.Capacitor?.Plugins?.App?.addListener) {
      capListener = window.Capacitor.Plugins.App.addListener('backButton', () => {
        onBackButton();
      });
    }

    return () => {
      window.handleAndroidBackGesture = null;
      document.removeEventListener('backbutton', onBackButton);
      if (capListener && typeof capListener.remove === 'function') {
        capListener.remove();
      }
    };
  }, [handleBackGesture]);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'billing':
      case 'billing-view':
      case 'billview':
        return <Billing />;
      case 'products':
        return <Products />;
      case 'repairs':
        return <Repairs />;
      case 'bills':
      case 'history':
        return <BillHistory />;
      case 'staff':
        return <Staff initialTab="directory" />;
      case 'attendance':
        return <Staff initialTab="attendance" />;
      case 'reports':
        return <Reports />;
      case 'lowStock':
      case 'lowstock':
        return <LowStock />;
      case 'deleted':
        return <DeletedRecords />;
      default:
        return <Dashboard />;
    }
  };

  // If user is not logged in, display the Login Screen first!
  if (!currentUser) {
    return (
      <div 
        className="login-viewport" 
        style={{ 
          minHeight: '100vh', 
          width: '100vw', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0b0f19 100%)',
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
      >
        <AuthModal isFullScreen={true} />

        {/* Floating Toast Notification Container */}
        <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(toasts || []).map(toast => (
            <div 
              key={toast.id} 
              className="toast-alert slide-up"
              style={{
                background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Viewport */}
      <div className="main-wrapper">
        <TopNavbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        
        <main className="main-content" id="mainContentArea">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Native Bottom Navigation */}
      <MobileBottomNav onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      {/* Global Modals */}
      <ProductModal />
      <BarcodeModal />
      <TaxInvoiceModal />
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

      {/* Floating Toast Notification Container */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(toasts || []).map(toast => (
          <div 
            key={toast.id} 
            className="toast-alert slide-up"
            style={{
              background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
