-- Stockly SQLite Database Schema (6 Core Tables)

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT,
    brand TEXT,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    price REAL DEFAULT 0,
    cost_price REAL DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    supplier TEXT,
    batch_number TEXT,
    photo_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_no TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash',
    notes TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    gst_rate REAL DEFAULT 0,
    discount_rate REAL DEFAULT 0,
    total REAL DEFAULT 0,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT,
    device_model TEXT NOT NULL,
    issue_description TEXT,
    estimated_cost REAL DEFAULT 0,
    final_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Sales',
    phone TEXT,
    email TEXT,
    salary REAL DEFAULT 0,
    join_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Present',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, date)
);

CREATE TABLE IF NOT EXISTS deleted_bills (
    id INTEGER PRIMARY KEY,
    bill_no TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total REAL DEFAULT 0,
    items_json TEXT,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
