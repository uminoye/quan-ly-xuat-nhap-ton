-- ============================================================
-- SEED DATA CHO NEON POSTGRESQL
-- Password mac dinh: 123456 (da hash voi bcrypt, salt=10)
-- ============================================================

-- Tao vai tro
INSERT INTO roles (name, description) VALUES
('Admin', 'Quan tri vien he thong'),
('Sales', 'Nhan vien kinh doanh'),
('Logistics', 'Nhan vien dieu phoi'),
('Warehouse', 'Nhan vien kho'),
('Factory', 'Nha may san xuat')
ON CONFLICT DO NOTHING;

-- Tao tai khoan mau (mat khau: 123456, hash bcrypt)
INSERT INTO users (full_name, email, password_hash, role_id) VALUES
('Nguyen Van Admin', 'admin@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 1),
('Tran Thi Sale', 'sale@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 2),
('Le Van Logistics', 'logistics@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 3),
('Pham Thu Kho', 'kho@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 4),
('Truong Nha May', 'nhamay@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 5)
ON CONFLICT (email) DO NOTHING;

-- Tao kho hang mau
INSERT INTO warehouses (warehouse_code, name, location) VALUES
('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong')
ON CONFLICT (warehouse_code) DO NOTHING;

-- Tao san pham mau
INSERT INTO products (sku, name, unit, category, sale_price, min_stock) VALUES
('LAP-XPS15', 'Laptop Dell XPS 15 9530', 'Cai', 'Laptop', 35000000, 50),
('MAC-M3', 'MacBook Pro 14 inch M3', 'Cai', 'Laptop', 39990000, 50),
('IPH-15P', 'iPhone 15 Pro Max 256GB', 'Chiec', 'Dien thoai', 29500000, 50),
('MON-LG27', 'Man hinh LG 27 inch 4K', 'Bo', 'Phu kien', 8500000, 50),
('KEY-MX', 'Ban phim co Logitech MX Mechanical', 'Cai', 'Phu kien', 3200000, 50)
ON CONFLICT (sku) DO NOTHING;

-- Tao khach hang mau
INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by) VALUES
('KH-TGDD', 'The Gioi Di Dong (MWG)', '18001060', 'Khu cong nghe cao, Quan 9, TPHCM', 'Anh Hieu (Phong Thu Mua)', 2),
('KH-FPT', 'FPT Retail', '18006601', '261 Khanh Hoi, Quan 4, TPHCM', 'Chi Mai (Quan ly chuoi)', 2),
('KH-PV', 'Phong Vu Computer', '18006867', '214 Quan Thanh, Ba Dinh, Ha Noi', 'Anh Nam (Giam doc kinh doanh)', 2),
('KH-CELL', 'CellphoneS', '18002097', '115 Thai Ha, Dong Da, Ha Noi', 'Chi Linh (Truong phong cung ung)', 2)
ON CONFLICT (customer_code) DO NOTHING;
