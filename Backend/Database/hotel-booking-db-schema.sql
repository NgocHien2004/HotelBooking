-- Tạo Database
CREATE DATABASE HotelBookingDB;
GO

USE HotelBookingDB;
GO

-- 1. Bảng NguoiDung (Users)
CREATE TABLE NguoiDung (
    ma_nguoi_dung INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    mat_khau NVARCHAR(255) NOT NULL,
    so_dien_thoai NVARCHAR(20),
    vai_tro NVARCHAR(50) DEFAULT 'Customer', -- Admin, Customer, Staff
    ngay_tao DATETIME DEFAULT GETDATE()
);

-- 2. Bảng LoaiPhong (Room Types)
CREATE TABLE LoaiPhong (
    ma_loai_phong INT IDENTITY(1,1) PRIMARY KEY,
    ma_khach_san INT NOT NULL,
    ten_loai_phong NVARCHAR(100) NOT NULL,
    gia_mot_dem DECIMAL(10,2) NOT NULL,
    suc_chua INT NOT NULL,
    mo_ta NVARCHAR(MAX)
);

-- 3. Bảng Phong (Rooms)
CREATE TABLE Phong (
    ma_phong INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_phong INT NOT NULL,
    so_phong NVARCHAR(50) NOT NULL,
    trang_thai NVARCHAR(50) DEFAULT 'Available', -- Available, Occupied, Maintenance
    FOREIGN KEY (ma_loai_phong) REFERENCES LoaiPhong(ma_loai_phong)
);

-- 4. Bảng DatPhong (Bookings)
CREATE TABLE DatPhong (
    ma_dat_phong INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL,
    ma_phong INT NOT NULL,
    ngay_nhan_phong DATE NOT NULL,
    ngay_tra_phong DATE NOT NULL,
    tong_tien DECIMAL(10,2) NOT NULL,
    trang_thai NVARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Cancelled, Completed
    ngay_dat DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES NguoiDung(ma_nguoi_dung),
    FOREIGN KEY (ma_phong) REFERENCES Phong(ma_phong)
);

-- 5. Bảng ThanhToan (Payments)
CREATE TABLE ThanhToan (
    ma_thanh_toan INT IDENTITY(1,1) PRIMARY KEY,
    ma_dat_phong INT NOT NULL,
    so_tien DECIMAL(10,2) NOT NULL,
    phuong_thuc NVARCHAR(50), -- Cash, Credit Card, Bank Transfer
    ngay_thanh_toan DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_dat_phong) REFERENCES DatPhong(ma_dat_phong)
);

-- 6. Bảng DanhGia (Reviews)
CREATE TABLE DanhGia (
    ma_danh_gia INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL,
    ma_khach_san INT NOT NULL,
    diem_danh_gia INT CHECK(diem_danh_gia >= 1 AND diem_danh_gia <= 5),
    binh_luan NVARCHAR(MAX),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES NguoiDung(ma_nguoi_dung)
);

-- 7. Bảng KhachSan (Hotels)
CREATE TABLE KhachSan (
    ma_khach_san INT IDENTITY(1,1) PRIMARY KEY,
    ten_khach_san NVARCHAR(200) NOT NULL,
    dia_chi NVARCHAR(300) NOT NULL,
    thanh_pho NVARCHAR(100),
    mo_ta NVARCHAR(MAX),
    danh_gia_trung_binh DECIMAL(2,1) DEFAULT 0,
    ngay_tao DATETIME DEFAULT GETDATE()
);

-- 8. Bảng HinhAnhKhachSan (Hotel Images)
CREATE TABLE HinhAnhKhachSan (
    ma_anh INT IDENTITY(1,1) PRIMARY KEY,
    ma_khach_san INT NOT NULL,
    duong_dan_anh NVARCHAR(500) NOT NULL,
    mo_ta NVARCHAR(255),
    FOREIGN KEY (ma_khach_san) REFERENCES KhachSan(ma_khach_san)
);

-- Thêm khóa ngoại cho LoaiPhong
ALTER TABLE LoaiPhong
ADD FOREIGN KEY (ma_khach_san) REFERENCES KhachSan(ma_khach_san);

-- Thêm khóa ngoại cho DanhGia
ALTER TABLE DanhGia
ADD FOREIGN KEY (ma_khach_san) REFERENCES KhachSan(ma_khach_san);

-- Tạo một số indexes để tối ưu hiệu suất
CREATE INDEX IX_DatPhong_NgayNhanPhong ON DatPhong(ngay_nhan_phong);
CREATE INDEX IX_DatPhong_NgayTraPhong ON DatPhong(ngay_tra_phong);
CREATE INDEX IX_Phong_TrangThai ON Phong(trang_thai);
CREATE INDEX IX_NguoiDung_Email ON NguoiDung(email);