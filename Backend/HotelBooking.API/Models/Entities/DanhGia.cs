using System;

namespace HotelBooking.API.Models.Entities
{
    public class DanhGia
    {
        public int MaDanhGia { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaKhachSan { get; set; }
        public int DiemDanhGia { get; set; }
        public string BinhLuan { get; set; }
        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public NguoiDung NguoiDung { get; set; }
        public KhachSan KhachSan { get; set; }
    }
}