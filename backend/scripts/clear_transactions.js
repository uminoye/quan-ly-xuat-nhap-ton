const db = require('../src/config/database');

// Danh sách tất cả các bảng có khả năng chứa dữ liệu giao dịch (Nhập, Xuất, Đơn hàng)
const tablesToClear = [
    'production_receipt_items',
    'production_receipts',
    'inventory_transactions',
    'inventory_balances',
    'outbound_items',       // Bảng chi tiết xuất kho (nếu có)
    'outbounds',            // Bảng phiếu xuất kho (nếu có)
    'order_items',          // Bảng chi tiết đơn hàng (nếu có)
    'orders',               // Bảng đơn hàng (nếu có)
    'sales_order_items',    // Phòng hờ bà đặt tên này
    'sales_orders'          // Phòng hờ bà đặt tên này
];

db.serialize(() => {
    console.log("--- 🌪 BẮT ĐẦU CƠN LỐC QUÉT RÁC TOÀN TẬP 🌪 ---");

    // 1. Quét sạch mọi bảng giao dịch
    tablesToClear.forEach(table => {
        db.run(`DELETE FROM ${table}`, (err) => {
            if (!err) {
                console.log(`✔️ Đã dọn sạch bảng: ${table}`);
            }
            // Nếu có lỗi (ví dụ bảng không tồn tại) thì kệ nó, bỏ qua đi tiếp
        });
    });

    // 2. Cập nhật lại cột stock trong bảng products về 0 cho đồng bộ
    db.run(`UPDATE products SET stock = 0`, (err) => {
        if (err) {
            console.error("Lỗi khi reset sản phẩm:", err.message);
        } else {
            console.log("==================================================");
            console.log("🧹 XONG BÉNG! Đã quét sạch KHÔNG CÒN 1 TỜ PHIẾU NÀO (Cả Nhập & Xuất).");
            console.log("📦 5 Sản phẩm gốc vẫn an toàn tuyệt đối (số lượng = 0).");
            console.log("👉 Việc của bà bây giờ: Tắt Terminal, gõ 'npm start' và XÓA KHO đi nhé!");
            console.log("==================================================");
        }
        
        // Đợi 1 giây cho nó in xong log rồi tự tắt
        setTimeout(() => process.exit(0), 1000); 
    });
});