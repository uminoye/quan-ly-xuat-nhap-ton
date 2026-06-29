const fs = require('fs');
const path = require('path');

// 1. CÁC THƯ MỤC CẦN BỎ QUA
// Những thư mục này thường chứa file hệ thống, thư viện hoặc file sinh ra khi chạy code.
// Bỏ qua chúng để file báo cáo không bị rác và quá nặng.
const IGNORE_DIRS = [
    'node_modules', '.git', 'build', 'dist', // Thường gặp ở dự án Web, React Native
    'bin', 'obj', '.vs', '.vscode',          // Thường gặp ở dự án C# (WinForms, WPF)
    '__pycache__', 'venv',                   // Thường gặp ở dự án Python
    '.gradle', '.idea'                       // Thường gặp ở dự án Android Studio (Java)
];

// 2. CÁC ĐỊNH DẠNG FILE CẦN LẤY
// Bạn có thể thêm hoặc bớt các đuôi file tùy theo ngôn ngữ bạn đang dùng trong đồ án.
const ALLOWED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', // Web & React Native
    '.cs', '.xaml',                                         // C#
    '.py',                                                  // Python
    '.java', '.xml'                                         // Android (Java)
];

// 3. TÊN FILE KẾT QUẢ
const OUTPUT_FILE = 'toan_bo_code_do_an.txt';

// Hàm đệ quy để quét qua tất cả các thư mục và file
function gomCode(dirPath, outputFile) {
    let resultText = '';

    function docThongTinThuMuc(currentPath) {
        // Đọc danh sách file và folder trong thư mục hiện tại
        const items = fs.readdirSync(currentPath);

        for (let item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Nếu là thư mục và KHÔNG nằm trong danh sách bỏ qua -> đi sâu vào đọc tiếp
                if (!IGNORE_DIRS.includes(item)) {
                    docThongTinThuMuc(fullPath);
                }
            } else {
                // Nếu là file -> kiểm tra đuôi file xem có đúng định dạng cần lấy không
                const ext = path.extname(item).toLowerCase();
                
                if (ALLOWED_EXTENSIONS.includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        
                        // Ghi tiêu đề ranh giới cho mỗi file để AI dễ phân biệt
                        resultText += `\n\n========================================================\n`;
                        resultText += `📍 TÊN FILE: ${fullPath}\n`;
                        resultText += `========================================================\n\n`;
                        
                        // Gắn nội dung file vào biến kết quả
                        resultText += content;
                    } catch (err) {
                        console.error(`❌ Lỗi khi đọc file ${fullPath}:`, err.message);
                    }
                }
            }
        }
    }

    // Bắt đầu quét từ thư mục gốc
    console.log("⏳ Đang tiến hành gom code, vui lòng đợi...");
    docThongTinThuMuc(dirPath);
    
    // Ghi toàn bộ nội dung đã gom được ra file .txt
    fs.writeFileSync(outputFile, resultText, 'utf-8');
    console.log(`✅ Thành công! Toàn bộ code đã được gom vào file: ${outputFile}`);
}

// Chạy script với thư mục gốc chính là nơi đặt file gom_code.js này
const thuMucGoc = __dirname;
const duongDanFileKetQua = path.join(thuMucGoc, OUTPUT_FILE);

gomCode(thuMucGoc, duongDanFileKetQua);