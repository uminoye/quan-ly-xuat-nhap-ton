// Gọi trực tiếp cấu hình database mà hệ thống đang xài (Nằm trong thư mục src/config)
const db = require('../src/config/database');

db.run(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0`, (err) => {
    if (err) {
        console.log("⚠️ Hình như cột stock đã có sẵn rồi, hoặc có lỗi:", err.message);
    } else {
        console.log("🎉 ĐÃ THÊM THÀNH CÔNG CỘT 'STOCK' (TỒN KHO) VÀO BẢNG SẢN PHẨM!");
    }
    
    // Tự động tắt script sau khi chạy xong
    process.exit(0); 
});