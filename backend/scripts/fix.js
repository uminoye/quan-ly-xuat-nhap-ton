const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

// Nhờ thư viện tạo mã băm THẬT cho chữ '123456'
const realHash = bcrypt.hashSync('123456', 10);

// Cập nhật mã băm thật này cho tất cả user trong database
db.run('UPDATE users SET password_hash = ?', [realHash], function(err) {
    if (err) {
        console.log("Lỗi:", err.message);
    } else {
        console.log("✅ Đã cập nhật mật khẩu 123456 chuẩn cho tất cả tài khoản!");
        console.log("Bạn có thể quay lại giao diện web để đăng nhập rồi nhé.");
    }
});