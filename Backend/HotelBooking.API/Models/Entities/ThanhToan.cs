using System;

namespace HotelBooking.API.Models.Entities
{
    public class ThanhToan
    {
        public int MaThanhToan { get; set; }
        public int MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
        public DateTime NgayThanhToan { get; set; } = DateTime.Now;

        // Navigation property
        public DatPhong DatPhong { get; set; }
    }
}