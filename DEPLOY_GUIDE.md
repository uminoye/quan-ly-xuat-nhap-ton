# HƯỚNG DẪN DEPLOY HỆ THỐNG QUẢN LÝ XUẤT NHẬP TỒN
## Database: Neon PostgreSQL | Backend: Render | Frontend: Vercel

---

## BƯỚC 1: TẠO DATABASE TRÊN NEON

1. Truy cập https://neon.tech → Đăng ký / Đăng nhập
2. Tạo Project mới → Chọn region **Singapore** (gần nhất)
3. Sau khi tạo xong, vào **Dashboard** → **Connection Details**
4. Copy **Connection string** có dạng:
   ```
   postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Lưu lại connection string này (sẽ dùng ở Bước 3)

---

## BƯỚC 2: CHẠY SCHEMA & SEED TRÊN NEON

Có 2 cách:

### Cách A: Dùng Neon Dashboard (Đề xuất)
1. Vào Neon Dashboard → **SQL Editor**
2. Copy toàn bộ nội dung file `database/schema_neon.sql` → Paste → Run
3. Copy toàn bộ nội dung file `database/seed_neon.sql` → Paste → Run

### Cách B: Dùng psql (PostgreSQL CLI)
```bash
# Cài psql (neu chua co)
# Lien ket DATABASE_URL voi connection string tu Buoc 1
export PGDATABASE=neondb
export PGHOST=ep-xxx-xxx-123456.us-east-2.aws.neon.tech
export PGPORT=5432
export PGUSER=username
export PGPASSWORD=password

psql "$DATABASE_URL" < database/schema_neon.sql
psql "$DATABASE_URL" < database/seed_neon.sql
```

> **Tài khoản mặc định sau khi seed:**
> - Admin: admin@congty.com / 123456
> - Sales: sale@congty.com / 123456
> - Logistics: logistics@congty.com / 123456
> - Kho: kho@congty.com / 123456
> - Nhà máy: nhamay@congty.com / 123456

---

## BƯỚC 3: DEPLOY BACKEND LÊN RENDER

### 3.1: Tạo Web Service trên Render

1. Truy cập https://dashboard.render.com → Đăng nhập (dùng GitHub)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repo chứa project (push code lên GitHub trước)
4. Cấu hình:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Region**: Singapore
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free

### 3.2: Thiết lập Environment Variables

Trong phần **Environment** của Web Service, thêm:

| Key | Value | Ghi chú |
|-----|-------|---------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Port Render gán tự động |
| `DATABASE_URL` | `postgresql://...` | Connection string từ Bước 1 |
| `JWT_SECRET` | `KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON` | Hoặc chuỗi ngẫu nhiên khác |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Thay sau khi deploy Vercel |

5. Click **Create Web Service**
6. Chờ build xong (~2-5 phút)
7. Copy **URL** của backend (VD: `https://inventory-backend.onrender.com`)

### 3.3: Kiểm tra Backend

Truy cập: `https://inventory-backend.onrender.com/api/test`
→ Kết quả: `{"message":"Server Backend da hoat dong tren Render!", "database":"Ket noi Neon PostgreSQL thanh cong."}`

---

## BƯỚC 4: DEPLOY FRONTEND LÊN VERCEL

### 4.1: Chuẩn bị

1. Push code lên GitHub (nếu chưa có repo)
2. Trong project, mở `frontend/vercel.json` → Sửa dòng:
   ```json
   "destination": "https://your-backend.onrender.com/api/:path*"
   ```
   Thành URL backend thật của bạn:
   ```json
   "destination": "https://inventory-backend.onrender.com/api/:path*"
   ```

### 4.2: Tạo Project trên Vercel

1. Truy cập https://vercel.com → Đăng nhập (dùng GitHub)
2. Click **Add New** → **Project**
3. Chọn repo GitHub
4. Cấu hình:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (hoặc `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**
6. Chờ deploy xong (~1-3 phút)
7. Copy **URL** của frontend (VD: `https://your-app.vercel.app`)

### 4.3: Quay lại Render - Cập nhật FRONTEND_URL

1. Vào Render Dashboard → Web Service backend
2. Environment → Sửa `FRONTEND_URL` thành URL Vercel của bạn
3. Click **Save Changes**

---

## CẤU TRÚC DEPLOY

```
                    ┌──────────────┐
                    │   NEON DB    │ ← PostgreSQL (Singapore)
                    │  (Database)  │
                    └──────┬───────┘
                           │ DATABASE_URL
                           ▼
┌──────────┐         ┌──────────────┐
│ VERCEL   │────────▶│   RENDER    │ ← Backend API (Singapore)
│(Frontend)│  /api/* │  (Backend)  │
└──────────┘         └──────────────┘
  Vite SPA             Express.js
  React 19             Node.js
```

---

## CÁC LỖI THƯỜNG GẶP

### Lỗi CORS
→ Kiểm tra `FRONTEND_URL` trong Render environment variables đúng URL Vercel chưa.

### Lỗi kết nối Database
→ Kiểm tra `DATABASE_URL` đúng format chưa, có `?sslmode=require` ở cuối không.

### Lỗi 401 Unauthorized
→ Kiểm tra `JWT_SECRET` ở Render giống với giá trị mặc định trong code.

### Lỗi 404 API Not Found
→ Kiểm tra `vercel.json` rewrite URL đúng backend Render chưa.

---

## CHẠY LOCAL (DEV)

### Backend:
```bash
cd backend
cp .env.example .env
# Sua .env: DATABASE_URL, JWT_SECRET
npm install
npm start
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## FILES ĐÃ THAY ĐỔI

| File | Thay đổi |
|------|-----------|
| `backend/src/config/database.js` | SQLite → pg Pool async |
| `backend/src/controllers/*.js` | Callback → async/await |
| `backend/src/middlewares/auth.middleware.js` | JWT_SECRET từ env |
| `backend/src/server.js` | CORS cấu hình cho Vercel |
| `backend/package.json` | Thêm `pg`, bỏ `sqlite3` |
| `backend/.env.example` | Template env vars |
| `frontend/src/services/api.js` | Dùng relative URL `/api` |
| `frontend/vite.config.js` | Thêm proxy cho dev |
| `frontend/vercel.json` | Rewrite /api/* → backend Render |
| `database/schema_neon.sql` | Schema PostgreSQL |
| `database/seed_neon.sql` | Seed data PostgreSQL |
| `render.yaml` | Cấu hình deploy Render |
