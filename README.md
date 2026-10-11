# Stockly - Complete Retail & Inventory Management Suite (React + Node.js + Firebase)

Complete Retail & Inventory Management dashboard built with **React 18**, **Node.js Express**, **SQLite**, and **Firebase Firestore**.

---

## ⚡ Quick Start (Run All in One Command)

To install, build, and run the complete application in a single command:

```bash
npm install && npm run build && npm start
```

Or if dependencies are already installed:

```bash
npm run app
```

Once running, open your browser and navigate to:
```text
http://localhost:3002
```

---

## 📋 Step-by-Step Commands to Run Perfectly

### Step 1: Open Terminal in Project Directory
```bash
cd /opt/lampp/htdocs/veronic/Mobile-hub
```

### Step 2: Install All Dependencies
```bash
npm install
```

### Step 3: Build the React Frontend (Vite)
This compiles the modern React frontend directly into production assets:
```bash
npm run build
```

### Step 4: Start the Server (Node.js + Express + SQLite + Firebase Sync)
```bash
npm start
```

### Step 5: Access the Application
Open any web browser and visit:
```text
http://localhost:3002
```

---

## 🔥 Firebase Cloud Database Synchronization

All tables in SQLite are automatically mirrored in real-time to **Firebase Firestore** (`stockly-dcbdb`).

To manually run a full database synchronization to Firebase at any time:
```bash
npm run firebase-sync
```

You can also check Firebase status via the API:
```bash
curl http://localhost:3002/api/firebase/status
```

---

## 🛠️ Development Mode (Live Hot-Reload)

If you are developing and want live auto-refresh for React:

**Terminal 1 (Start Backend API on Port 3002):**
```bash
npm run server
```

**Terminal 2 (Start React Vite Dev Server with HMR):**
```bash
npm run dev
```

---

## 🛑 How to Stop or Restart the Server

### Stop the Server
Press `Ctrl + C` in the terminal running the server.

### Free Port 3002 (If Port is Busy)
```bash
fuser -k 3002/tcp
```

### Clean Rebuild
```bash
rm -rf node_modules
npm install
npm run build
npm start
```

---

## 📁 System Architecture & Features

- **Products Page**: 4-column product cards with live inventory counters, barcode generator, and stock indicators.
- **Smart Billing System**: POS click-to-add product cards with floating slide-up bill view, GST calculation, discounts, and invoice generation.
- **Tax Invoice Modal & Print/PDF**: Official tax invoice design matching Image 5 specifications with instant browser print, downloadable A4 PDF, and direct WhatsApp sharing.
- **Repairs Tracker**: Repair ticket management with status badges and device diagnostics.
- **Staff Directory**: Attendance tracking (Present/Absent toggles) and role directory.
- **Business Analytics**: Visual charts, sales summaries, and exportable reports.
- **Database**: Embedded high-performance local SQLite database (`mobilehub.db`) with real-time automatic cloud replication to **Firebase Firestore**.
