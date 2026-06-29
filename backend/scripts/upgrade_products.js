const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../database.sqlite')); // Dùng đúng đường dẫn của bạn, nếu file ở thư mục database thì đổi lại nha

db.serialize(() => {
    // 1. Thêm cột Đơn vị tính (unit)
    db.run(`ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'cái'`, (err) => {
        if (err) console.log("Cột unit đã tồn tại.");
        else console.log("Đã thêm cột Đơn vị tính.");
    });

    // 2. Thêm cột Tồn kho (stock) nếu ban nãy chạy bị lỗi
    db.run(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0`, (err) => {
        if (err) console.log("Cột stock đã tồn tại.");
        else console.log("✅ Đã thêm cột Tồn kho.");
    });

    // 3. Bơm đại 50 số lượng cho tất cả sản phẩm để test
    db.run(`UPDATE products SET stock = 50 WHERE stock IS NULL OR stock = 0`, (err) => {
        if (!err) console.log("✅ Đã bơm 50 số lượng cho các sản phẩm để test!");
    });
});