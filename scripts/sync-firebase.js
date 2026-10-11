const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { syncAllTables, isInitialized } = require('../firebaseBackend');

const dbPath = path.join(__dirname, '..', 'mobilehub.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Stockly - Firebase Database Sync Utility');
if (!isInitialized) {
  console.error('❌ Firebase is not initialized. Please verify your credentials.');
  process.exit(1);
}

syncAllTables(db)
  .then((res) => {
    if (res.success) {
      console.log('🎉 All tables and records synchronized to Firebase successfully:');
      console.table(res.stats);
      db.close();
      process.exit(0);
    } else {
      console.error('❌ Sync failed:', res.error);
      db.close();
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ Sync error:', err.message);
    db.close();
    process.exit(1);
  });
