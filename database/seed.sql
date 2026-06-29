-- TAO VAI TRO
INSERT INTO roles (name, description) VALUES 
('Admin', 'Quan tri vien he thong'),
('Sales', 'Nhan vien kinh doanh'),
('Logistics', 'Nhan vien dieu phoi'),
('Warehouse', 'Nhan vien kho'),
('Factory', 'Nha may san xuat');

-- TAO TAI KHOAN MAU (Mat khau mac dinh cho tat ca la: 123456)
-- Mat khau da duoc ma hoa (hash) san de he thong nhan dien an toan
INSERT INTO users (full_name, email, password_hash, role_id) VALUES 
('Nguyen Van Admin', 'admin@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 1),
('Tran Thi Sale', 'sale@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 2),
('Le Van Logistics', 'logistics@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 3),
('Pham Thu Kho', 'kho@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 4),
('Truong Nha May', 'nhamay@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 5);

-- TAO KHO HANG MAU
INSERT INTO warehouses (warehouse_code, name, location) VALUES 
('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong');

-- TAO SAN PHAM MAU
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('LAP-XPS15', 'Laptop Dell XPS 15 9530', 'Cái', 'Laptop', 35000000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('MAC-M3', 'MacBook Pro 14 inch M3', 'Cái', 'Laptop', 39990000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('IPH-15P', 'iPhone 15 Pro Max 256GB', 'Chiếc', 'Điện thoại', 29500000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('MON-LG27', 'Màn hình LG 27 inch 4K', 'Bộ', 'Phụ kiện', 8500000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('KEY-MX', 'Bàn phím cơ Logitech MX Mechanical', 'Cái', 'Phụ kiện', 3200000);

-- TAO KHACH HANG MAU
INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by) VALUES 
('KH-TGDD', 'The Gioi Di Dong (MWG)', '18001060', 'Khu cong nghe cao, Quan 9, TPHCM', 'Anh Hieu (Phong Thu Mua)', 2),
('KH-FPT', 'FPT Retail', '18006601', '261 Khanh Hoi, Quan 4, TPHCM', 'Chi Mai (Quan ly chuoi)', 2),
('KH-PV', 'Phong Vu Computer', '18006867', '214 Quan Thanh, Ba Dinh, Ha Noi', 'Anh Nam (Giam doc kinh doanh)', 2),
('KH-CELL', 'CellphoneS', '18002097', '115 Thai Ha, Dong Da, Ha Noi', 'Chi Linh (Truong phong cung ung)', 2);