const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - Increased limit for image uploads
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('./mobilehub.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
        startServer();
    }
});

// Promise wrappers
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function startServer() {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📱 Open http://localhost:${PORT} in your browser`);
    });
}

// ==============================================
// DATABASE INITIALIZATION - 6 TABLES
// ==============================================

function initializeDatabase() {
    // 1. products table
    db.run(`
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
        )
    `);

    // 2. bills table
    db.run(`
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_no TEXT NOT NULL UNIQUE,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            subtotal REAL DEFAULT 0,
            gst_total REAL DEFAULT 0,
            discount_total REAL DEFAULT 0,
            grand_total REAL DEFAULT 0,
            date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. bill_items table
    db.run(`
        CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            price REAL DEFAULT 0,
            gst_rate REAL DEFAULT 0,
            discount_rate REAL DEFAULT 0,
            total REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
        )
    `);

    // 4. repairs table
    db.run(`
        CREATE TABLE IF NOT EXISTS repairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT,
            device_model TEXT,
            issue TEXT,
            status TEXT DEFAULT 'pending',
            estimated_cost REAL DEFAULT 0,
            received_date TEXT,
            image_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 5. staff table
    db.run(`
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            working_now INTEGER DEFAULT 0,
            on_leave INTEGER DEFAULT 0,
            attendance TEXT DEFAULT 'absent',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 6. attendance_records table
    db.run(`
        CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT DEFAULT 'absent',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
            UNIQUE(staff_id, date)
        )
    `);

    // Deleted tables for soft delete
    db.run(`
        CREATE TABLE IF NOT EXISTS deleted_bills (
            id INTEGER,
            bill_no TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            subtotal REAL DEFAULT 0,
            gst_total REAL DEFAULT 0,
            discount_total REAL DEFAULT 0,
            grand_total REAL DEFAULT 0,
            date TEXT,
            created_at DATETIME,
            deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS deleted_bill_items (
            id INTEGER,
            bill_id INTEGER,
            product_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            price REAL DEFAULT 0,
            gst_rate REAL DEFAULT 0,
            discount_rate REAL DEFAULT 0,
            total REAL DEFAULT 0,
            created_at DATETIME,
            deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert sample data
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error('Error checking products:', err);
            return;
        }
        if (row.count === 0) {
            insertSampleData();
        }
    });

    console.log('✅ All 6 tables created successfully');
}

// ==============================================
// SAMPLE DATA
// ==============================================

function insertSampleData() {
    const sampleProducts = [
        ['vivo t2 pro', 'VIVO-T2P', 'Smartphone', 'vivo', 100, 5, 28999, 25000, 12, 'harshil', '874210394512', 'https://placehold.co/400x400/0f172a/white?text=vivo+t2+pro'],
        ['iPhone 15 Pro', 'APL-15PRO', 'Smartphone', 'Apple', 45, 10, 129999, 110000, 28, 'apple premium', '563210947835', 'https://placehold.co/400x400/1e293b/white?text=iPhone+15+Pro'],
        ['Samsung Galaxy S24', 'SAM-S24U', 'Smartphone', 'Samsung', 30, 8, 99999, 85000, 18, 'samsung store', '341895672014', 'https://placehold.co/400x400/334155/white?text=Galaxy+S24']
    ];

    const productStmt = db.prepare(`
        INSERT INTO products (name, sku, category, brand, stock, min_stock, price, cost_price, sold_count, supplier, batch_number, photo_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    sampleProducts.forEach(p => {
        productStmt.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11]);
    });
    productStmt.finalize();

    const sampleStaff = [
        ['vijay', 'Sales', '9876543210', 'active', 0, 0, 'absent'],
        ['Raju Agravat', 'Manager', '9876543211', 'active', 0, 0, 'present'],
        ['Sales', 'Sales', '7894564565', 'active', 0, 1, 'absent'],
        ['vansh Gohale', 'Sales', '48357908437', 'active', 1, 0, 'present']
    ];

    const staffStmt = db.prepare(`
        INSERT INTO staff (name, role, phone, status, working_now, on_leave, attendance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    sampleStaff.forEach(s => {
        staffStmt.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
    });
    staffStmt.finalize();

    const sampleRepairs = [
        ['Rahul Mehta', '9876543210', 'iPhone 12', 'Broken Screen - Glass shattered completely', 'pending', 4500, new Date().toISOString().split('T')[0], 'https://placehold.co/400x400/ef4444/white?text=iPhone+Repair'],
        ['Neha Sharma', '9988776655', 'Samsung Galaxy S21', 'Battery draining fast, needs replacement', 'in-progress', 2800, new Date().toISOString().split('T')[0], 'https://placehold.co/400x400/f59e0b/white?text=Samsung+Repair']
    ];

    const repairStmt = db.prepare(`
        INSERT INTO repairs (customer_name, phone, device_model, issue, status, estimated_cost, received_date, image_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    sampleRepairs.forEach(r => {
        repairStmt.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]);
    });
    repairStmt.finalize();

    console.log('✅ Sample data inserted successfully');
}

// ==============================================
// PRODUCTS API
// ==============================================

app.get('/api/products', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM products ORDER BY name");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const row = await dbGet("SELECT * FROM products WHERE id = ?", [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, sku, category, brand, stock, minStock, price, costPrice, supplier, batchNumber, photoData } = req.body;
        if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' });

        const result = await dbRun(`
            INSERT INTO products (name, sku, category, brand, stock, min_stock, price, cost_price, supplier, batch_number, photo_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, sku, category || '', brand || '', stock || 0, minStock || 5, price || 0, costPrice || 0, supplier || '', batchNumber || '', photoData || '']);

        const newProduct = await dbGet("SELECT * FROM products WHERE id = ?", [result.lastID]);
        res.json({ success: true, product: newProduct });
    } catch (err) {
        if (err.message.includes('UNIQUE')) res.status(400).json({ error: 'SKU already exists' });
        else res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, category, brand, stock, minStock, price, costPrice, supplier, batchNumber, photoData } = req.body;

        const result = await dbRun(`
            UPDATE products SET name=?, sku=?, category=?, brand=?, stock=?, min_stock=?, price=?, cost_price=?, supplier=?, batch_number=?, photo_data=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [name, sku, category || '', brand || '', stock || 0, minStock || 5, price || 0, costPrice || 0, supplier || '', batchNumber || '', photoData || '', id]);

        if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
        const updated = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
        res.json({ success: true, product: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await dbRun("DELETE FROM products WHERE id = ?", [req.params.id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// BILLS API
// ==============================================

app.get('/api/bills', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM bills ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bills/:id', async (req, res) => {
    try {
        const bill = await dbGet("SELECT * FROM bills WHERE id = ?", [req.params.id]);
        if (!bill) return res.status(404).json({ error: 'Bill not found' });
        const items = await dbAll("SELECT * FROM bill_items WHERE bill_id = ?", [req.params.id]);
        bill.items = items;
        res.json(bill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bills', async (req, res) => {
    try {
        const { billNo, customerName, customerPhone, items, subtotal, gstTotal, discountTotal, grandTotal, date } = req.body;
        if (!billNo || !customerName || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await dbRun(`
            INSERT INTO bills (bill_no, customer_name, customer_phone, subtotal, gst_total, discount_total, grand_total, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [billNo, customerName, customerPhone || '', subtotal || 0, gstTotal || 0, discountTotal || 0, grandTotal || 0, date || new Date().toISOString().split('T')[0]]);

        const billId = result.lastID;
        const itemStmt = db.prepare(`
            INSERT INTO bill_items (bill_id, product_name, quantity, price, gst_rate, discount_rate, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        items.forEach(item => {
            const total = item.price * item.quantity;
            itemStmt.run(billId, item.productName, item.quantity, item.price, item.gstRate || 0, item.discountRate || 0, total);
        });
        itemStmt.finalize();

        // Update stock
        for (const item of items) {
            await dbRun(`
                UPDATE products SET stock = stock - ?, sold_count = sold_count + ?
                WHERE name = ?
            `, [item.quantity, item.quantity, item.productName]);
        }

        const newBill = await dbGet("SELECT * FROM bills WHERE id = ?", [billId]);
        res.json({ success: true, bill: newBill });
    } catch (err) {
        if (err.message.includes('UNIQUE')) res.status(400).json({ error: 'Bill number already exists' });
        else res.status(500).json({ error: err.message });
    }
});

app.delete('/api/bills/:id', async (req, res) => {
    try {
        const bill = await dbGet("SELECT * FROM bills WHERE id = ?", [req.params.id]);
        if (!bill) return res.status(404).json({ error: 'Bill not found' });

        await dbRun(`INSERT INTO deleted_bills (id, bill_no, customer_name, customer_phone, subtotal, gst_total, discount_total, grand_total, date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bill.id, bill.bill_no, bill.customer_name, bill.customer_phone, bill.subtotal, bill.gst_total, bill.discount_total, bill.grand_total, bill.date, bill.created_at]);

        const items = await dbAll("SELECT * FROM bill_items WHERE bill_id = ?", [req.params.id]);
        for (const item of items) {
            await dbRun(`INSERT INTO deleted_bill_items (id, bill_id, product_name, quantity, price, gst_rate, discount_rate, total, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [item.id, item.bill_id, item.product_name, item.quantity, item.price, item.gst_rate, item.discount_rate, item.total, item.created_at]);
        }

        await dbRun("DELETE FROM bills WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Bill moved to deleted records' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bills/:id/restore', async (req, res) => {
    try {
        const deletedBill = await dbGet("SELECT * FROM deleted_bills WHERE id = ?", [req.params.id]);
        if (!deletedBill) return res.status(404).json({ error: 'Deleted bill not found' });

        const existing = await dbGet("SELECT id FROM bills WHERE id = ?", [req.params.id]);
        let newId = req.params.id;

        if (existing) {
            const result = await dbRun(`INSERT INTO bills (bill_no, customer_name, customer_phone, subtotal, gst_total, discount_total, grand_total, date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [deletedBill.bill_no, deletedBill.customer_name, deletedBill.customer_phone, deletedBill.subtotal, deletedBill.gst_total, deletedBill.discount_total, deletedBill.grand_total, deletedBill.date, deletedBill.created_at]);
            newId = result.lastID;
        } else {
            await dbRun(`INSERT INTO bills (id, bill_no, customer_name, customer_phone, subtotal, gst_total, discount_total, grand_total, date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [deletedBill.id, deletedBill.bill_no, deletedBill.customer_name, deletedBill.customer_phone, deletedBill.subtotal, deletedBill.gst_total, deletedBill.discount_total, deletedBill.grand_total, deletedBill.date, deletedBill.created_at]);
        }

        const deletedItems = await dbAll("SELECT * FROM deleted_bill_items WHERE bill_id = ?", [req.params.id]);
        for (const item of deletedItems) {
            await dbRun(`INSERT INTO bill_items (id, bill_id, product_name, quantity, price, gst_rate, discount_rate, total, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [item.id, newId, item.product_name, item.quantity, item.price, item.gst_rate, item.discount_rate, item.total, item.created_at]);
        }

        await dbRun("DELETE FROM deleted_bills WHERE id = ?", [req.params.id]);
        await dbRun("DELETE FROM deleted_bill_items WHERE bill_id = ?", [req.params.id]);

        res.json({ success: true, message: 'Bill restored successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/deleted/bills', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM deleted_bills ORDER BY deleted_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// REPAIRS API
// ==============================================

app.get('/api/repairs', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM repairs ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/repairs/:id', async (req, res) => {
    try {
        const row = await dbGet("SELECT * FROM repairs WHERE id = ?", [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Repair not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/repairs', async (req, res) => {
    try {
        const { customerName, phone, deviceModel, issue, status, estimatedCost, receivedDate, imageData } = req.body;
        if (!customerName || !deviceModel) {
            return res.status(400).json({ error: 'Customer name and device model are required' });
        }

        const result = await dbRun(`
            INSERT INTO repairs (customer_name, phone, device_model, issue, status, estimated_cost, received_date, image_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [customerName, phone || '', deviceModel, issue || '', status || 'pending', estimatedCost || 0, receivedDate || new Date().toISOString().split('T')[0], imageData || '']);

        const newRepair = await dbGet("SELECT * FROM repairs WHERE id = ?", [result.lastID]);
        res.json({ success: true, repair: newRepair });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/repairs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, phone, deviceModel, issue, status, estimatedCost, receivedDate, imageData } = req.body;

        const result = await dbRun(`
            UPDATE repairs SET customer_name=?, phone=?, device_model=?, issue=?, status=?, estimated_cost=?, received_date=?, image_data=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [customerName, phone || '', deviceModel, issue || '', status || 'pending', estimatedCost || 0, receivedDate || new Date().toISOString().split('T')[0], imageData || '', id]);

        if (result.changes === 0) return res.status(404).json({ error: 'Repair not found' });
        const updated = await dbGet("SELECT * FROM repairs WHERE id = ?", [id]);
        res.json({ success: true, repair: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/repairs/:id', async (req, res) => {
    try {
        const result = await dbRun("DELETE FROM repairs WHERE id = ?", [req.params.id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Repair not found' });
        res.json({ success: true, message: 'Repair deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// STAFF API
// ==============================================

app.get('/api/staff', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM staff ORDER BY name");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/staff/:id', async (req, res) => {
    try {
        const row = await dbGet("SELECT * FROM staff WHERE id = ?", [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Staff not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/staff', async (req, res) => {
    try {
        const { name, role, phone, status, workingNow, onLeave, attendance } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await dbRun(`
            INSERT INTO staff (name, role, phone, status, working_now, on_leave, attendance)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, role || '', phone || '', status || 'active', workingNow ? 1 : 0, onLeave ? 1 : 0, attendance || 'absent']);

        const newStaff = await dbGet("SELECT * FROM staff WHERE id = ?", [result.lastID]);
        res.json({ success: true, staff: newStaff });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, phone, status, workingNow, onLeave, attendance } = req.body;

        const result = await dbRun(`
            UPDATE staff SET name=?, role=?, phone=?, status=?, working_now=?, on_leave=?, attendance=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [name, role || '', phone || '', status || 'active', workingNow ? 1 : 0, onLeave ? 1 : 0, attendance || 'absent', id]);

        if (result.changes === 0) return res.status(404).json({ error: 'Staff not found' });
        const updated = await dbGet("SELECT * FROM staff WHERE id = ?", [id]);
        res.json({ success: true, staff: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/staff/:id', async (req, res) => {
    try {
        const result = await dbRun("DELETE FROM staff WHERE id = ?", [req.params.id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Staff not found' });
        res.json({ success: true, message: 'Staff deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// ATTENDANCE API
// ==============================================

app.get('/api/attendance/:date', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT a.*, s.name as staff_name, s.role
            FROM attendance_records a
            JOIN staff s ON a.staff_id = s.id
            WHERE a.date = ?
        `, [req.params.date]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    try {
        const { staffId, date, status } = req.body;
        if (!staffId || !date) return res.status(400).json({ error: 'Staff ID and date are required' });

        const existing = await dbGet("SELECT * FROM attendance_records WHERE staff_id = ? AND date = ?", [staffId, date]);
        if (existing) {
            await dbRun("UPDATE attendance_records SET status = ? WHERE staff_id = ? AND date = ?", [status || 'absent', staffId, date]);
        } else {
            await dbRun("INSERT INTO attendance_records (staff_id, date, status) VALUES (?, ?, ?)", [staffId, date, status || 'absent']);
        }

        await dbRun("UPDATE staff SET attendance = ? WHERE id = ?", [status || 'absent', staffId]);
        res.json({ success: true, message: 'Attendance updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const rows = await dbAll(`
            SELECT a.*, s.name as staff_name, s.role
            FROM attendance_records a
            JOIN staff s ON a.staff_id = s.id
            WHERE a.date = ?
        `, [today]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// STATISTICS API
// ==============================================

app.get('/api/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = today.slice(0, 7);

        const totalProducts = await dbGet("SELECT COUNT(*) as count FROM products");
        const totalBills = await dbGet("SELECT COUNT(*) as count FROM bills");
        const totalStaff = await dbGet("SELECT COUNT(*) as count FROM staff");
        const totalRepairs = await dbGet("SELECT COUNT(*) as count FROM repairs");
        const pendingRepairs = await dbGet("SELECT COUNT(*) as count FROM repairs WHERE status = 'pending'");
        const todayBills = await dbGet("SELECT COUNT(*) as count FROM bills WHERE date = ?", [today]);
        const monthRevenue = await dbGet("SELECT SUM(grand_total) as total FROM bills WHERE substr(date, 1, 7) = ?", [currentMonth]);
        const totalRevenue = await dbGet("SELECT SUM(grand_total) as total FROM bills");
        const lowStock = await dbGet("SELECT COUNT(*) as count FROM products WHERE stock < min_stock");
        const presentToday = await dbGet("SELECT COUNT(*) as count FROM staff WHERE attendance = 'present'");
        const absentToday = await dbGet("SELECT COUNT(*) as count FROM staff WHERE attendance = 'absent'");

        res.json({
            totalProducts: totalProducts.count || 0,
            totalBills: totalBills.count || 0,
            totalStaff: totalStaff.count || 0,
            totalRepairs: totalRepairs.count || 0,
            pendingRepairs: pendingRepairs.count || 0,
            todayBills: todayBills.count || 0,
            monthRevenue: monthRevenue.total || 0,
            totalRevenue: totalRevenue.total || 0,
            lowStock: lowStock.count || 0,
            presentToday: presentToday.count || 0,
            absentToday: absentToday.count || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// REPORTS API
// ==============================================

app.get('/api/reports/sales', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = "SELECT * FROM bills";
        let params = [];
        if (startDate && endDate) {
            query += " WHERE date BETWEEN ? AND ?";
            params = [startDate, endDate];
        }
        query += " ORDER BY date DESC";

        const bills = await dbAll(query, params);
        for (const bill of bills) {
            bill.items = await dbAll("SELECT * FROM bill_items WHERE bill_id = ?", [bill.id]);
        }
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// SERVE FRONTEND
// ==============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});