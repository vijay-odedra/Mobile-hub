================================================================================
          STOCKLY - DATABASE & FIREBASE CONFIGURATION GUIDE
================================================================================

1. SQLITE LOCAL DATABASE:
   - File: mobilehub.db
   - Runtime path on Windows: %APPDATA%\Stockly\data\mobilehub.db
   - Schema: database-schema.sql (all 6 core tables: products, bills, bill_items,
     repairs, staff, attendance_records, deleted_bills)

2. FIREBASE FIRESTORE CLOUD CONFIGURATION:
   - Project ID: stockly-dcbdb
   - Service Account: firebase-service-account.json
   - Web Client Config: firebase-web-config.json
   - Environment Variables: config.env

Every transaction, bill, inventory change, and staff record automatically
synchronizes live to Firebase Firestore Cloud!
================================================================================
