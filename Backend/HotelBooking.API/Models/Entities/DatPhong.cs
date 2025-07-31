using System;
using System.Collections.Generic;

namespace HotelBooking.API.Models.Entities
{
    public class DatPhong
    {
        public int MaDatPhong { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = "Pending";
        public DateTime NgayDat { get; set; } = DateTime.Now;

        // Navigation properties
        public NguoiDung NguoiDung { get; set; }
        public Phong Phong { get; set; }
        public ICollection<ThanhToan> ThanhToans { get; set; }
    }
}