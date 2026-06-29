const db = require('../src/config/database');

db.serialize(() => {
    // Thêm cột SKU với ràng buộc UNIQUE (không được trùng)
    db.run(`ALTER TABLE products ADD COLUMN sku TEXT`, (err) => {
        if (err) console.log("Cột SKU đã tồn tại.");
        else {
            db.run(`CREATE UNIQUE INDEX idx_products_sku ON products(sku)`);
            console.log("✅ Đã thêm cột SKU và thiết lập tính duy nhất.");
        }
    });
});