const db = require('../src/config/database');

db.serialize(() => {
    console.log("--- Đang làm sạch và cài đặt lại hệ thống Kho ---");

    // 1. Xóa bảng kho cũ để làm lại từ đầu (Chỉ xóa bảng warehouses, không mất sản phẩm đâu đừng lo)
    db.run(`DROP TABLE IF EXISTS warehouses`, (err) => {
        if (err) console.error("Lỗi xóa bảng:", err.message);
        
        // 2. Tạo lại bảng warehouses
        db.run(`CREATE TABLE IF NOT EXISTS warehouses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT
        )`, () => {
            
            // 3. Chèn 2 kho mới của bạn vào
            const stmt = db.prepare(`INSERT INTO warehouses (name, location) VALUES (?, ?)`);
            stmt.run('Kho 1 (Dĩ An)', 'Bình Dương');
            stmt.run('Kho 2 (Tân Bình)', 'TP.HCM');
            stmt.finalize();

            console.log("✅ Đã cài đặt xong: Kho 1 và Kho 2.");
            console.log("👉 Bây giờ bạn hãy tắt Backend và chạy lại 'npm start' nhé!");
            process.exit(0);
        });
    });
});
