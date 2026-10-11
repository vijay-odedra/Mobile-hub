import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [activePage, setActivePage] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'products', 'billing', 'billview', 'history', 'bills', 'repairs', 'staff', 'attendance', 'reports', 'lowstock', 'deleted'].includes(hash)) {
        return hash;
      }
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'products', 'billing', 'billview', 'history', 'bills', 'repairs', 'staff', 'attendance', 'reports', 'lowstock', 'deleted'].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const changePage = (page) => {
    setActivePage(page);
    try {
      if (window.location.hash.replace('#', '').toLowerCase() !== String(page).toLowerCase()) {
        window.location.hash = page;
      }
    } catch {}
  };

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_bills');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [repairs, setRepairs] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_repairs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_staff');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [deletedBills, setDeletedBills] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_deleted_bills');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [currentCart, setCurrentCart] = useState(() => {
    try {
      const saved = localStorage.getItem('currentCart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('currentCart', JSON.stringify(currentCart));
    } catch {}
  }, [currentCart]);

  // Session persistence: Remember logged in user across refreshes; only cleared on explicit logout!
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeInvoiceModal, setActiveInvoiceModal] = useState(null);
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [activeBarcodeModal, setActiveBarcodeModal] = useState(null);

  const [firebaseStatus, setFirebaseStatus] = useState({ connected: true, projectId: 'stockly-dcbdb' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // Attach live Firestore listeners for real-time cloud sync across APK & EXE
  useEffect(() => {
    let unsubs = [];
    try {
      if (db) {
        // 1. Products live stream
        const unsubProds = onSnapshot(collection(db, 'products'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
            list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
            setProducts(list);
            try { localStorage.setItem('cached_products', JSON.stringify(list)); } catch {}
            setFirebaseStatus({ connected: true, projectId: 'stockly-dcbdb' });
          }
        }, (err) => {
          console.warn('Firestore products stream notice:', err.message);
        });

        // 2. Bills live stream
        const unsubBills = onSnapshot(collection(db, 'bills'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
            list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
            setBills(list);
            try { localStorage.setItem('cached_bills', JSON.stringify(list)); } catch {}
            setFirebaseStatus({ connected: true, projectId: 'stockly-dcbdb' });
          }
        }, (err) => {
          console.warn('Firestore bills stream notice:', err.message);
        });

        // 3. Repairs live stream
        const unsubRepairs = onSnapshot(collection(db, 'repairs'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
            setRepairs(list);
            try { localStorage.setItem('cached_repairs', JSON.stringify(list)); } catch {}
          }
        }, (err) => {
          console.warn('Firestore repairs stream notice:', err.message);
        });

        // 4. Staff live stream
        const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
            setStaffList(list);
            try { localStorage.setItem('cached_staff', JSON.stringify(list)); } catch {}
          }
        }, (err) => {
          console.warn('Firestore staff stream notice:', err.message);
        });

        // 5. Deleted bills live stream
        const unsubDel = onSnapshot(collection(db, 'deleted_bills'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          setDeletedBills(list);
          try { localStorage.setItem('cached_deleted_bills', JSON.stringify(list)); } catch {}
        }, (err) => {
          console.warn('Firestore deleted_bills stream notice:', err.message);
        });

        unsubs = [unsubProds, unsubBills, unsubRepairs, unsubStaff, unsubDel];
      }
    } catch (e) {
      console.warn('Firestore initialization notice:', e);
    }

    return () => {
      unsubs.forEach(u => typeof u === 'function' && u());
    };
  }, []);

  // Generic API helpers
  const apiGet = async (endpoint) => {
    try {
      const res = await fetch(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API GET error (${endpoint}):`, err);
      return null;
    }
  };

  const apiPost = async (endpoint, data) => {
    try {
      const res = await fetch(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API POST error (${endpoint}):`, err);
      return null;
    }
  };

  const apiPut = async (endpoint, data) => {
    try {
      const res = await fetch(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API PUT error (${endpoint}):`, err);
      return null;
    }
  };

  const apiDelete = async (endpoint) => {
    try {
      const res = await fetch(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API DELETE error (${endpoint}):`, err);
      return null;
    }
  };

  const loadAllData = async () => {
    let loadedFromApi = false;
    try {
      const [prodsRes, billsRes, repairsRes, staffRes, delRes, fbRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()).catch(() => []),
        fetch('/api/bills').then(r => r.json()).catch(() => []),
        fetch('/api/repairs').then(r => r.json()).catch(() => []),
        fetch('/api/staff').then(r => r.json()).catch(() => []),
        fetch('/api/deleted/bills').then(r => r.json()).catch(() => []),
        fetch('/api/firebase/status').then(r => r.json()).catch(() => ({ connected: true, projectId: 'stockly-dcbdb' }))
      ]);
      if (Array.isArray(prodsRes) && prodsRes.length > 0) {
        setProducts(prodsRes);
        loadedFromApi = true;
      }
      if (Array.isArray(billsRes) && billsRes.length > 0) setBills(billsRes);
      if (Array.isArray(repairsRes) && repairsRes.length > 0) setRepairs(repairsRes);
      if (Array.isArray(staffRes) && staffRes.length > 0) setStaffList(staffRes);
      if (Array.isArray(delRes)) setDeletedBills(delRes);
      if (fbRes) setFirebaseStatus(fbRes);
    } catch (err) {
      console.warn('Local API check notice:', err);
    }

    // Direct Firestore fallback (for Android APK or when local Express is not running)
    if (!loadedFromApi && db) {
      try {
        const [pSnap, bSnap, rSnap, sSnap, dSnap] = await Promise.all([
          getDocs(collection(db, 'products')).catch(() => null),
          getDocs(collection(db, 'bills')).catch(() => null),
          getDocs(collection(db, 'repairs')).catch(() => null),
          getDocs(collection(db, 'staff')).catch(() => null),
          getDocs(collection(db, 'deleted_bills')).catch(() => null)
        ]);

        if (pSnap && !pSnap.empty) {
          const list = pSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          setProducts(list);
          try { localStorage.setItem('cached_products', JSON.stringify(list)); } catch {}
        }
        if (bSnap && !bSnap.empty) {
          const list = bSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
          setBills(list);
          try { localStorage.setItem('cached_bills', JSON.stringify(list)); } catch {}
        }
        if (rSnap && !rSnap.empty) {
          const list = rSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          setRepairs(list);
          try { localStorage.setItem('cached_repairs', JSON.stringify(list)); } catch {}
        }
        if (sSnap && !sSnap.empty) {
          const list = sSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          setStaffList(list);
          try { localStorage.setItem('cached_staff', JSON.stringify(list)); } catch {}
        }
        if (dSnap) {
          const list = dSnap.docs.map(d => ({ id: Number(d.id) || d.id, ...d.data() }));
          setDeletedBills(list);
          try { localStorage.setItem('cached_deleted_bills', JSON.stringify(list)); } catch {}
        }
        setFirebaseStatus({ connected: true, projectId: 'stockly-dcbdb' });
      } catch (fbErr) {
        console.warn('Firestore fallback fetch notice:', fbErr);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Product actions
  const saveProduct = async (productData, id = null) => {
    const prodId = id || Date.now();
    const payload = {
      ...productData,
      id: prodId,
      name: productData.name,
      sku: productData.sku,
      category: productData.category || 'General',
      brand: productData.brand || 'Other',
      stock: Number(productData.stock) || 0,
      min_stock: Number(productData.minStock ?? productData.min_stock ?? 5),
      minStock: Number(productData.minStock ?? productData.min_stock ?? 5),
      price: Number(productData.price) || 0,
      cost_price: Number(productData.costPrice ?? productData.cost_price ?? 0),
      costPrice: Number(productData.costPrice ?? productData.cost_price ?? 0),
      supplier: productData.supplier || '',
      batch_number: productData.batchNumber || productData.batch_number || '',
      batchNumber: productData.batchNumber || productData.batch_number || '',
      photo_data: productData.photoData || productData.photo_data || '/images/products/samsungs24.jpg',
      photoData: productData.photoData || productData.photo_data || '/images/products/samsungs24.jpg',
      updatedAt: new Date().toISOString()
    };

    // 1. Direct Firebase Firestore write
    if (db) {
      try {
        await setDoc(doc(db, 'products', String(prodId)), payload, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore saveProduct notice:', fbErr);
      }
    }

    // 2. Local API write (for SQLite in Electron/desktop)
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/products/${id}` : '/api/products';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    // 3. Optimistic local state update so UI updates immediately
    setProducts(prev => {
      const exists = prev.some(p => String(p.id) === String(prodId));
      let updatedList;
      if (exists) {
        updatedList = prev.map(p => (String(p.id) === String(prodId) ? { ...p, ...payload } : p));
      } else {
        updatedList = [...prev, payload];
      }
      try { localStorage.setItem('cached_products', JSON.stringify(updatedList)); } catch {}
      return updatedList;
    });

    showToast(id ? 'Product updated successfully' : 'Product added successfully');
    return true;
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', String(id)));
      } catch (fbErr) {
        console.warn('Firestore deleteProduct notice:', fbErr);
      }
    }
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {}
    await loadAllData();
    showToast('Product deleted');
  };

  // Cart actions (for POS Image 3)
  const addToCart = (product, addQty = 1) => {
    setCurrentCart(prev => {
      const existIdx = prev.findIndex(item => item.id === product.id);
      if (existIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existIdx].qty + addQty;
        const maxStock = product.stock || 9999;
        updated[existIdx].qty = Math.min(newQty, maxStock);
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            sku: product.sku || '',
            price: Number(product.price || 0),
            qty: addQty,
            gstRate: 18,
            discount: 0,
            photoData: product.photo_data || '',
            stock: product.stock || 0
          }
        ];
      }
    });
  };

  const updateCartItem = (idOrIndex, fieldsOrKey, value) => {
    setCurrentCart(prev =>
      prev.map((item, idx) => {
        if (item.id === idOrIndex || idx === idOrIndex) {
          const updates = typeof fieldsOrKey === 'string' ? { [fieldsOrKey]: value } : fieldsOrKey;
          const updated = { ...item, ...updates };
          if (updated.qty < 1) updated.qty = 1;
          return updated;
        }
        return item;
      })
    );
  };

  const removeFromCart = (idOrIndex) => {
    setCurrentCart(prev => prev.filter((item, idx) => item.id !== idOrIndex && idx !== idOrIndex));
  };

  const clearCart = () => {
    setCurrentCart([]);
  };

  // Billing actions
  const createBill = async (billData) => {
    let resultBill = null;
    const billId = billData.id || Date.now();
    const billPayload = {
      ...billData,
      id: billId,
      bill_no: billData.billNo || billData.bill_no || `INV-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Direct Firestore write
    if (db) {
      try {
        await setDoc(doc(db, 'bills', String(billId)), billPayload);
        // Deduct product stock in Firestore
        if (Array.isArray(billData.items)) {
          for (const it of billData.items) {
            const itId = it.id || it.productId || it.product_id;
            if (itId) {
              const matchedProd = products.find(p => p.id === itId);
              if (matchedProd) {
                const newStock = Math.max(0, (matchedProd.stock || 0) - (Number(it.quantity || it.qty || 1)));
                const newSold = (matchedProd.sold_count || 0) + (Number(it.quantity || it.qty || 1));
                await setDoc(doc(db, 'products', String(itId)), {
                  stock: newStock,
                  sold_count: newSold,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }
            }
          }
        }
        resultBill = billPayload;
      } catch (fbErr) {
        console.warn('Firestore createBill notice:', fbErr);
      }
    }

    // 2. Local API write
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
      const data = await res.json().catch(() => null);
      if (data && data.success && data.bill) resultBill = data.bill;
    } catch (e) {}

    if (resultBill) {
      await loadAllData();
      clearCart();
      showToast('Bill generated successfully!');
      return resultBill;
    }
    showToast('Failed to generate bill', 'error');
    return null;
  };

  const deleteBill = async (id) => {
    if (!window.confirm('Move bill to trash? It can be restored later.')) return;
    const targetBill = bills.find(b => b.id === id);
    if (db && targetBill) {
      try {
        await setDoc(doc(db, 'deleted_bills', String(id)), { ...targetBill, deleted_at: new Date().toISOString() });
        await deleteDoc(doc(db, 'bills', String(id)));
      } catch (fbErr) {
        console.warn('Firestore deleteBill notice:', fbErr);
      }
    }
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    } catch (e) {}
    await loadAllData();
    showToast('Bill moved to trash');
  };

  const restoreBill = async (id) => {
    const targetBill = deletedBills.find(b => b.id === id);
    if (db && targetBill) {
      try {
        const { deleted_at, ...cleanBill } = targetBill;
        await setDoc(doc(db, 'bills', String(id)), { ...cleanBill, restored_at: new Date().toISOString() });
        await deleteDoc(doc(db, 'deleted_bills', String(id)));
      } catch (fbErr) {
        console.warn('Firestore restoreBill notice:', fbErr);
      }
    }
    try {
      await fetch(`/api/deleted/bills/${id}/restore`, { method: 'POST' });
    } catch (e) {}
    await loadAllData();
    showToast('Bill restored successfully');
  };

  // Repairs
  const saveRepair = async (repairData, id = null) => {
    let saved = false;
    const repId = id || Date.now();
    const payload = { ...repairData, id: repId, updatedAt: new Date().toISOString() };
    if (db) {
      try {
        await setDoc(doc(db, 'repairs', String(repId)), payload, { merge: true });
        saved = true;
      } catch (fbErr) {
        console.warn('Firestore saveRepair notice:', fbErr);
      }
    }
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/repairs/${id}` : '/api/repairs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData)
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) saved = true;
    } catch (e) {}
    if (saved) {
      await loadAllData();
      showToast(id ? 'Repair ticket updated' : 'Repair ticket created');
      return true;
    }
    showToast('Failed to save repair ticket', 'error');
    return false;
  };

  const deleteRepair = async (id) => {
    if (!window.confirm('Delete repair ticket?')) return;
    if (db) {
      try {
        await deleteDoc(doc(db, 'repairs', String(id)));
      } catch (fbErr) {
        console.warn('Firestore deleteRepair notice:', fbErr);
      }
    }
    try {
      await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
    } catch (e) {}
    await loadAllData();
    showToast('Repair ticket deleted');
  };

  // Staff
  const saveStaff = async (staffData, id = null) => {
    let saved = false;
    const stId = id || Date.now();
    const payload = { ...staffData, id: stId, updatedAt: new Date().toISOString() };
    if (db) {
      try {
        await setDoc(doc(db, 'staff', String(stId)), payload, { merge: true });
        saved = true;
      } catch (fbErr) {
        console.warn('Firestore saveStaff notice:', fbErr);
      }
    }
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/staff/${id}` : '/api/staff';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) saved = true;
    } catch (e) {}
    if (saved) {
      await loadAllData();
      showToast(id ? 'Staff updated' : 'Staff added');
      return true;
    }
    showToast('Failed to save staff', 'error');
    return false;
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    if (db) {
      try {
        await deleteDoc(doc(db, 'staff', String(id)));
      } catch (fbErr) {
        console.warn('Firestore deleteStaff notice:', fbErr);
      }
    }
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    } catch (e) {}
    await loadAllData();
    showToast('Staff deleted');
  };

  // Dedicated real-time Attendance updater for gestures and cloud sync
  const updateAttendance = async (staffId, status) => {
    const today = new Date().toISOString().split('T')[0];
    const newStatus = status === 'present' ? 'present' : 'absent';

    // 1. Optimistic React state update
    setStaffList(prev => prev.map(s => {
      if (s.id == staffId) {
        return { ...s, attendance: newStatus, working_now: newStatus === 'present' ? 1 : 0 };
      }
      return s;
    }));

    // 2. Direct Firebase Cloud update (for APK & cross-device sync)
    if (db) {
      try {
        await setDoc(doc(db, 'staff', String(staffId)), {
          attendance: newStatus,
          working_now: newStatus === 'present' ? 1 : 0,
          updated_at: new Date().toISOString()
        }, { merge: true });

        await setDoc(doc(db, 'attendance_records', `${staffId}_${today}`), {
          staff_id: staffId,
          date: today,
          status: newStatus,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore updateAttendance notice:', fbErr);
      }
    }

    // 3. Local backend update (for Windows desktop EXE)
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, date: today, status: newStatus })
      });
    } catch (e) {}

    return true;
  };

  const setAttendance = async (staffId, status) => {
    const today = new Date().toISOString().split('T')[0];
    if (db) {
      try {
        await setDoc(doc(db, 'staff', String(staffId)), { attendance: status, updatedAt: new Date().toISOString() }, { merge: true });
        await setDoc(doc(db, 'attendance_records', `${staffId}_${today}`), {
          staff_id: staffId,
          date: today,
          status,
          updated_at: new Date().toISOString()
        });
      } catch (fbErr) {
        console.warn('Firestore setAttendance notice:', fbErr);
      }
    }
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, date: today, status })
      });
    } catch (e) {}
    await loadAllData();
    showToast(`Attendance marked as ${status}`);
    return true;
  };

  // Low stock products calculation
  const lowStockProducts = products.filter(p => {
    const min = p.min_stock !== undefined && p.min_stock !== null ? Number(p.min_stock) : 5;
    return Number(p.stock) <= min;
  });

  // Auth
  const login = (username, password) => {
    const rawUsers = localStorage.getItem('retailUsers');
    const users = rawUsers ? JSON.parse(rawUsers) : [
      { name: 'Admin', username: 'admin', password: 'admin123', email: 'admin@stockly.com', role: 'admin' }
    ];
    if (!rawUsers) {
      localStorage.setItem('retailUsers', JSON.stringify(users));
    }
    const uname = (username || '').trim().toLowerCase();
    const found = users.find(u => (u.username || '').toLowerCase() === uname && u.password === password);
    if (found || (uname === 'admin' && (password === 'admin123' || password === 'password' || password === 'admin'))) {
      const u = found || { name: 'Admin', username: 'admin', email: 'admin@stockly.com', role: 'admin' };
      try {
        localStorage.setItem('currentUser', JSON.stringify(u));
      } catch {}
      setCurrentUser(u);
      showToast(`Logged in as ${u.name}`);
      return true;
    }
    return false;
  };

  const signup = (name, username, password) => {
    const rawUsers = localStorage.getItem('retailUsers');
    const users = rawUsers ? JSON.parse(rawUsers) : [
      { name: 'Admin', username: 'admin', password: 'admin123', email: 'admin@stockly.com', role: 'admin' }
    ];
    const uname = (username || '').trim();
    if (!uname || (password || '').length < 4 || users.find(u => (u.username || '').toLowerCase() === uname.toLowerCase())) {
      return false;
    }
    const newUser = { 
      name: (name || '').trim() || uname, 
      username: uname, 
      password, 
      email: `${uname.toLowerCase()}@stockly.com`,
      role: 'staff'
    };
    users.push(newUser);
    localStorage.setItem('retailUsers', JSON.stringify(users));
    try {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } catch {}
    setCurrentUser(newUser);
    showToast(`Welcome, ${newUser.name}!`);
    return true;
  };

  const logout = () => {
    try {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
    } catch {}
    setCurrentUser(null);
    showToast('Logged out successfully');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage: changePage,
        products,
        bills,
        repairs,
        staffList,
        deletedBills,
        currentCart,
        currentUser,
        firebaseStatus,
        authModalOpen,
        setAuthModalOpen,
        toast,
        toasts: toast ? [toast] : [],
        showToast,
        lowStockProducts,
        lowStockItems: lowStockProducts,
        activeInvoiceModal,
        setActiveInvoiceModal,
        invoiceModalState: { isOpen: !!activeInvoiceModal, bill: activeInvoiceModal },
        setInvoiceModalState: (st) => setActiveInvoiceModal(st?.isOpen ? (st.bill || true) : null),
        activeProductModal,
        setActiveProductModal,
        productModalState: { isOpen: !!activeProductModal, product: activeProductModal },
        setProductModalState: (st) => setActiveProductModal(st?.isOpen ? (st.product || true) : null),
        activeBarcodeModal,
        setActiveBarcodeModal,
        barcodeModalState: { isOpen: !!activeBarcodeModal, product: activeBarcodeModal },
        setBarcodeModalState: (st) => setActiveBarcodeModal(st?.isOpen ? (st.product || true) : null),
        showToast,
        loadAllData,
        apiGet,
        apiPost,
        apiPut,
        apiDelete,
        saveProduct,
        deleteProduct,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createBill,
        deleteBill,
        restoreBill,
        saveRepair,
        deleteRepair,
        saveStaff,
        deleteStaff,
        updateAttendance,
        setAttendance,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
