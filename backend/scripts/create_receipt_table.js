const db = require('../src/config/database');

const runAsync = (sql) => new Promise((resolve, reject) => {
    db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
    });
});

const getColumns = (tableName) => new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
    });
});

const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
    const columns = await getColumns(tableName);
    const exists = columns.some((column) => column.name === columnName);

    if (!exists) {
        await runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        console.log(`✅ Đã thêm cột ${columnName} vào bảng ${tableName}.`);
    } else {
        console.log(`ℹ️ Cột ${columnName} đã tồn tại trong bảng ${tableName}.`);
    }
};

const main = async () => {
    try {
        await runAsync(`CREATE TABLE IF NOT EXISTS production_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_no TEXT UNIQUE,
            warehouse_id INTEGER,
            receipt_date TEXT,
            created_by INTEGER,
            note TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('✅ Đã tạo/kiểm tra bảng production_receipts.');

        await runAsync(`CREATE TABLE IF NOT EXISTS production_receipt_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY (receipt_id) REFERENCES production_receipts (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);
        console.log('✅ Đã tạo/kiểm tra bảng production_receipt_items.');

        await addColumnIfMissing('production_receipts', 'expected_delivery_date', 'expected_delivery_date TEXT');
        await addColumnIfMissing('production_receipts', 'responded_by', 'responded_by INTEGER');
        await addColumnIfMissing('production_receipts', 'responded_reason', 'responded_reason TEXT');
        await addColumnIfMissing('production_receipts', 'responded_at', 'responded_at DATETIME');

        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi migrate receipt tables:', err.message);
        process.exit(1);
    }
};

main();
