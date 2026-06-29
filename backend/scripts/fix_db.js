const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../database/inventory.sqlite'));

db.run(`UPDATE sales_orders SET status = 'pending' WHERE status IS NULL OR status = ''`, (err) => {
    if (err) console.error("Lỗi khi quét dọn:", err.message);
    else console.log("--- ĐÃ CẬP NHẬT TRẠNG THÁI CHO TẤT CẢ ĐƠN HÀNG CŨ ---");
    db.close();
});