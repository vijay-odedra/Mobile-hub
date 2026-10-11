const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db = null;
let isInitialized = false;

try {
  let serviceAccount;
  const serviceAccountCandidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.join(__dirname, 'firebase-service-account.json'),
    path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'firebase-service-account.json')
  ].filter(Boolean);
  
  for (const p of serviceAccountCandidates) {
    if (fs.existsSync(p)) {
      try {
        serviceAccount = require(path.resolve(p));
        break;
      } catch (e) {}
    }
  }
  if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID || 'stockly-dcbdb',
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  if (serviceAccount) {
    if (admin.getApps().length === 0) {
      admin.initializeApp({
        credential: admin.cert(serviceAccount)
      });
    }
    db = getFirestore();
    isInitialized = true;
    console.log('🔥 Connected to Firebase Firestore (project: stockly-dcbdb)');
  } else {
    console.warn('⚠️ Firebase credentials not found. Running in offline/SQLite mode.');
  }
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin:', err.message);
}

// Collections
const collections = {
  products: () => db?.collection('products'),
  bills: () => db?.collection('bills'),
  repairs: () => db?.collection('repairs'),
  staff: () => db?.collection('staff'),
  attendance: () => db?.collection('attendance_records'),
  deletedBills: () => db?.collection('deleted_bills')
};

// Safe helper to sync any document
async function syncDoc(collectionName, docId, data) {
  if (!db || !isInitialized) return false;
  try {
    const cleanData = JSON.parse(JSON.stringify(data)); // remove undefined
    cleanData.updatedAt = new Date().toISOString();
    await db.collection(collectionName).doc(String(docId)).set(cleanData, { merge: true });
    return true;
  } catch (err) {
    console.error(`Firebase sync error for ${collectionName}/${docId}:`, err.message);
    return false;
  }
}

// Safe helper to delete document
async function deleteDoc(collectionName, docId) {
  if (!db || !isInitialized) return false;
  try {
    await db.collection(collectionName).doc(String(docId)).delete();
    return true;
  } catch (err) {
    console.error(`Firebase delete error for ${collectionName}/${docId}:`, err.message);
    return false;
  }
}

// Bulk sync all SQLite data to Firestore
async function syncAllTables(sqliteDb) {
  if (!db || !isInitialized) {
    console.warn('Firebase not initialized, skipping bulk sync.');
    return { success: false, error: 'Firebase not initialized' };
  }

  console.log('⏳ Starting full database sync from SQLite to Firebase Firestore...');
  const stats = { products: 0, bills: 0, repairs: 0, staff: 0, attendance: 0, deletedBills: 0 };

  const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  try {
    // 1. Sync Products
    try {
      const products = await dbAll('SELECT * FROM products');
      for (const p of products) {
        await syncDoc('products', p.id, p);
        stats.products++;
      }
    } catch (e) {
      console.warn('Products sync warning:', e.message);
    }

    // 2. Sync Bills with bill_items
    try {
      const bills = await dbAll('SELECT * FROM bills');
      for (const b of bills) {
        const items = await dbAll('SELECT * FROM bill_items WHERE bill_id = ?', [b.id]);
        b.items = items;
        await syncDoc('bills', b.id, b);
        stats.bills++;
      }
    } catch (e) {
      console.warn('Bills sync warning:', e.message);
    }

    // 3. Sync Repairs
    try {
      const repairs = await dbAll('SELECT * FROM repairs');
      for (const r of repairs) {
        await syncDoc('repairs', r.id, r);
        stats.repairs++;
      }
    } catch (e) {
      console.warn('Repairs sync warning:', e.message);
    }

    // 4. Sync Staff
    try {
      const staff = await dbAll('SELECT * FROM staff');
      for (const s of staff) {
        await syncDoc('staff', s.id, s);
        stats.staff++;
      }
    } catch (e) {
      console.warn('Staff sync warning:', e.message);
    }

    // 5. Sync Attendance
    try {
      const attendance = await dbAll('SELECT * FROM attendance_records');
      for (const a of attendance) {
        await syncDoc('attendance_records', `${a.staff_id}_${a.date}`, a);
        stats.attendance++;
      }
    } catch (e) {
      console.warn('Attendance sync warning:', e.message);
    }

    // 6. Sync Deleted Bills
    try {
      const deletedBills = await dbAll('SELECT * FROM deleted_bills');
      for (const dbill of deletedBills) {
        const ditems = await dbAll('SELECT * FROM deleted_bill_items WHERE bill_id = ?', [dbill.id]);
        dbill.items = ditems;
        await syncDoc('deleted_bills', dbill.id, dbill);
        stats.deletedBills++;
      }
    } catch (e) {
      console.warn('Deleted bills sync warning:', e.message);
    }

    console.log('✅ Full database sync to Firebase Firestore completed successfully!', stats);
    return { success: true, stats };
  } catch (err) {
    console.error('❌ Error during full sync to Firebase:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  admin,
  db,
  isInitialized,
  collections,
  syncDoc,
  deleteDoc,
  syncAllTables
};
