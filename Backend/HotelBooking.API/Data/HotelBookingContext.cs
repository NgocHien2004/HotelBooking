using Microsoft.EntityFrameworkCore;
using HotelBooking.API.Models.Entities;

namespace HotelBooking.API.Data
{
    public class HotelBookingContext : DbContext
    {
        public HotelBookingContext(DbContextOptions<HotelBookingContext> options)
            : base(options)
        {
        }

        public DbSet<NguoiDung> NguoiDungs { get; set; }
        public DbSet<KhachSan> KhachSans { get; set; }
        public DbSet<LoaiPhong> LoaiPhongs { get; set; }
        public DbSet<Phong> Phongs { get; set; }
        public DbSet<DatPhong> DatPhongs { get; set; }
        public DbSet<ThanhToan> ThanhToans { get; set; }
        public DbSet<DanhGia> DanhGias { get; set; }
        public DbSet<HinhAnhKhachSan> HinhAnhKhachSans { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // NguoiDung
            modelBuilder.Entity<NguoiDung>(entity =>
            {
                entity.ToTable("NguoiDung");
                entity.HasKey(e => e.MaNguoiDung);
                entity.Property(e => e.MaNguoiDung).HasColumnName("ma_nguoi_dung");
                entity.Property(e => e.HoTen).HasColumnName("ho_ten").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.MatKhau).HasColumnName("mat_khau").IsRequired().HasMaxLength(255);
                entity.Property(e => e.SoDienThoai).HasColumnName("so_dien_thoai").HasMaxLength(20);
                entity.Property(e => e.VaiTro).HasColumnName("vai_tro").HasMaxLength(50).HasDefaultValue("Customer");
                entity.Property(e => e.NgayTao).HasColumnName("ngay_tao").HasDefaultValueSql("GETDATE()");
            });

            // KhachSan
            modelBuilder.Entity<KhachSan>(entity =>
            {
                entity.ToTable("KhachSan");
                entity.HasKey(e => e.MaKhachSan);
                entity.Property(e => e.MaKhachSan).HasColumnName("ma_khach_san");
                entity.Property(e => e.TenKhachSan).HasColumnName("ten_khach_san").IsRequired().HasMaxLength(200);
                entity.Property(e => e.DiaChi).HasColumnName("dia_chi").IsRequired().HasMaxLength(300);
                entity.Property(e => e.ThanhPho).HasColumnName("thanh_pho").HasMaxLength(100);
                entity.Property(e => e.MoTa).HasColumnName("mo_ta");
                entity.Property(e => e.DanhGiaTrungBinh).HasColumnName("danh_gia_trung_binh").HasPrecision(2, 1).HasDefaultValue(0);
                entity.Property(e => e.NgayTao).HasColumnName("ngay_tao").HasDefaultValueSql("GETDATE()");
            });

            // LoaiPhong
            modelBuilder.Entity<LoaiPhong>(entity =>
            {
                entity.ToTable("LoaiPhong");
                entity.HasKey(e => e.MaLoaiPhong);
                entity.Property(e => e.MaLoaiPhong).HasColumnName("ma_loai_phong");
                entity.Property(e => e.MaKhachSan).HasColumnName("ma_khach_san");
                entity.Property(e => e.TenLoaiPhong).HasColumnName("ten_loai_phong").IsRequired().HasMaxLength(100);
                entity.Property(e => e.GiaMotDem).HasColumnName("gia_mot_dem").HasPrecision(10, 2);
                entity.Property(e => e.SucChua).HasColumnName("suc_chua");
                entity.Property(e => e.MoTa).HasColumnName("mo_ta");

                entity.HasOne(e => e.KhachSan)
                    .WithMany(k => k.LoaiPhongs)
                    .HasForeignKey(e => e.MaKhachSan);
            });

            // Phong
            modelBuilder.Entity<Phong>(entity =>
            {
                entity.ToTable("Phong");
                entity.HasKey(e => e.MaPhong);
                entity.Property(e => e.MaPhong).HasColumnName("ma_phong");
                entity.Property(e => e.MaLoaiPhong).HasColumnName("ma_loai_phong");
                entity.Property(e => e.SoPhong).HasColumnName("so_phong").IsRequired().HasMaxLength(50);
                entity.Property(e => e.TrangThai).HasColumnName("trang_thai").HasMaxLength(50).HasDefaultValue("Available");

                entity.HasOne(e => e.LoaiPhong)
                    .WithMany(l => l.Phongs)
                    .HasForeignKey(e => e.MaLoaiPhong);

                entity.HasIndex(e => e.TrangThai).HasDatabaseName("IX_Phong_TrangThai");
            });

            // DatPhong
            modelBuilder.Entity<DatPhong>(entity =>
            {
                entity.ToTable("DatPhong");
                entity.HasKey(e => e.MaDatPhong);
                entity.Property(e => e.MaDatPhong).HasColumnName("ma_dat_phong");
                entity.Property(e => e.MaNguoiDung).HasColumnName("ma_nguoi_dung");
                entity.Property(e => e.MaPhong).HasColumnName("ma_phong");
                entity.Property(e => e.NgayNhanPhong).HasColumnName("ngay_nhan_phong");
                entity.Property(e => e.NgayTraPhong).HasColumnName("ngay_tra_phong");
                entity.Property(e => e.TongTien).HasColumnName("tong_tien").HasPrecision(10, 2);
                entity.Property(e => e.TrangThai).HasColumnName("trang_thai").HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.NgayDat).HasColumnName("ngay_dat").HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.NguoiDung)
                    .WithMany(n => n.DatPhongs)
                    .HasForeignKey(e => e.MaNguoiDung);

                entity.HasOne(e => e.Phong)
                    .WithMany(p => p.DatPhongs)
                    .HasForeignKey(e => e.MaPhong);

                entity.HasIndex(e => e.NgayNhanPhong).HasDatabaseName("IX_DatPhong_NgayNhanPhong");
                entity.HasIndex(e => e.NgayTraPhong).HasDatabaseName("IX_DatPhong_NgayTraPhong");
            });

            // ThanhToan
            modelBuilder.Entity<ThanhToan>(entity =>
            {
                entity.ToTable("ThanhToan");
                entity.HasKey(e => e.MaThanhToan);
                entity.Property(e => e.MaThanhToan).HasColumnName("ma_thanh_toan");
                entity.Property(e => e.MaDatPhong).HasColumnName("ma_dat_phong");
                entity.Property(e => e.SoTien).HasColumnName("so_tien").HasPrecision(10, 2);
                entity.Property(e => e.PhuongThuc).HasColumnName("phuong_thuc").HasMaxLength(50);
                entity.Property(e => e.NgayThanhToan).HasColumnName("ngay_thanh_toan").HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.DatPhong)
                    .WithMany(d => d.ThanhToans)
                    .HasForeignKey(e => e.MaDatPhong);
            });

            // DanhGia
            modelBuilder.Entity<DanhGia>(entity =>
            {
                entity.ToTable("DanhGia");
                entity.HasKey(e => e.MaDanhGia);
                entity.Property(e => e.MaDanhGia).HasColumnName("ma_danh_gia");
                entity.Property(e => e.MaNguoiDung).HasColumnName("ma_nguoi_dung");
                entity.Property(e => e.MaKhachSan).HasColumnName("ma_khach_san");
                entity.Property(e => e.DiemDanhGia).HasColumnName("diem_danh_gia");
                entity.Property(e => e.BinhLuan).HasColumnName("binh_luan");
                entity.Property(e => e.NgayTao).HasColumnName("ngay_tao").HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.NguoiDung)
                    .WithMany(n => n.DanhGias)
                    .HasForeignKey(e => e.MaNguoiDung);

                entity.HasOne(e => e.KhachSan)
                    .WithMany(k => k.DanhGias)
                    .HasForeignKey(e => e.MaKhachSan);
            });

            // HinhAnhKhachSan
            modelBuilder.Entity<HinhAnhKhachSan>(entity =>
            {
                entity.ToTable("HinhAnhKhachSan");
                entity.HasKey(e => e.MaAnh);
                entity.Property(e => e.MaAnh).HasColumnName("ma_anh");
                entity.Property(e => e.MaKhachSan).HasColumnName("ma_khach_san");
                entity.Property(e => e.DuongDanAnh).HasColumnName("duong_dan_anh").IsRequired().HasMaxLength(500);
                entity.Property(e => e.MoTa).HasColumnName("mo_ta").HasMaxLength(255);

                entity.HasOne(e => e.KhachSan)
                    .WithMany(k => k.HinhAnhKhachSans)
                    .HasForeignKey(e => e.MaKhachSan);
            });
        }
    }
}