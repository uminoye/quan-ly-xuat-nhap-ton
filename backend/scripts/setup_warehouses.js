const db = require('../src/config/database');

db.serialize(() => {
    // 1. Tạo bảng Danh sách Kho
    db.run(`CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT
    )`);

    // 2. Tạo bảng Tồn kho chi tiết (Quan trọng: ON CONFLICT dùng UNIQUE)
    db.run(`CREATE TABLE IF NOT EXISTS inventory_balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warehouse_id INTEGER,
        product_id INTEGER,
        on_hand_qty INTEGER DEFAULT 0,
        UNIQUE(warehouse_id, product_id)
    )`);

    // 3. Thêm 2 kho mặc định vào Database
    db.run(`INSERT OR IGNORE INTO warehouses (id, name, location) VALUES (1, 'Kho 1 (Dĩ An)', 'Bình Dương')`);
    db.run(`INSERT OR IGNORE INTO warehouses (id, name, location) VALUES (2, 'Kho 2 (Tân Bình)', 'TP.HCM')`, (err) => {
        if (err) console.log("Lỗi:", err);
        else console.log("Đã thiết lập xong hệ thống Đa Kho (Kho 1 & Kho 2)!");
        process.exit(0);
    });
});