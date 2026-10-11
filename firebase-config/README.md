# Stockly - Database & Firebase Configuration

## ☁️ Firebase Cloud Firestore Configuration
- **Project ID**: `stockly-dcbdb`
- **Auth Domain**: `stockly-dcbdb.firebaseapp.com`
- **Storage Bucket**: `stockly-dcbdb.firebasestorage.app`
- **Service Account**: `firebase-service-account.json` (Included in this folder)

## 🗄️ SQLite Local Engine
- Windows Desktop Path: `%APPDATA%\Stockly\data\mobilehub.db`
- Development Path: `./mobilehub.db`
- Adapter: `dbAdapter.js` (uses built-in `node:sqlite` DatabaseSync engine, zero C++ native DLL dependency crashes)

## 🔄 Bidirectional Sync Flow
1. SQLite handles fast offline transactions, barcode generation, and local bill queries.
2. Changes automatically push in real-time to Firebase Firestore cloud collections:
   - `products`
   - `bills`
   - `repairs`
   - `staff`
   - `attendance`
   - `deletedBills`
3. Top Navbar shows **Firebase Live** with a green status indicator whenever connected.
