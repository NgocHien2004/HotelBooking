using Microsoft.EntityFrameworkCore;
using HotelBooking.API.Models;

namespace HotelBooking.API.Data
{
    public class HotelBookingContext : DbContext
    {
        public HotelBookingContext(DbContextOptions<HotelBookingContext> options) : base(options)
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

            // Configure precision for decimal properties
            modelBuilder.Entity<LoaiPhong>()
                .Property(e => e.GiaMotDem)
                .HasPrecision(10, 2);

            modelBuilder.Entity<DatPhong>()
                .Property(e => e.TongTien)
                .HasPrecision(10, 2);

            modelBuilder.Entity<ThanhToan>()
                .Property(e => e.SoTien)
                .HasPrecision(10, 2);

            modelBuilder.Entity<KhachSan>()
                .Property(e => e.DanhGiaTrungBinh)
                .HasPrecision(2, 1);

            // Configure unique constraint for email
            modelBuilder.Entity<NguoiDung>()
                .HasIndex(e => e.Email)
                .IsUnique();

            // Configure relationships
            modelBuilder.Entity<LoaiPhong>()
                .HasOne(e => e.KhachSan)
                .WithMany(e => e.LoaiPhongs)
                .HasForeignKey(e => e.MaKhachSan)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Phong>()
                .HasOne(e => e.LoaiPhong)
                .WithMany(e => e.Phongs)
                .HasForeignKey(e => e.MaLoaiPhong)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DatPhong>()
                .HasOne(e => e.NguoiDung)
                .WithMany(e => e.DatPhongs)
                .HasForeignKey(e => e.MaNguoiDung)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DatPhong>()
                .HasOne(e => e.Phong)
                .WithMany(e => e.DatPhongs)
                .HasForeignKey(e => e.MaPhong)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ThanhToan>()
                .HasOne(e => e.DatPhong)
                .WithMany(e => e.ThanhToans)
                .HasForeignKey(e => e.MaDatPhong)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DanhGia>()
                .HasOne(e => e.NguoiDung)
                .WithMany(e => e.DanhGias)
                .HasForeignKey(e => e.MaNguoiDung)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DanhGia>()
                .HasOne(e => e.KhachSan)
                .WithMany(e => e.DanhGias)
                .HasForeignKey(e => e.MaKhachSan)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HinhAnhKhachSan>()
                .HasOne(e => e.KhachSan)
                .WithMany(e => e.HinhAnhKhachSans)
                .HasForeignKey(e => e.MaKhachSan)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}