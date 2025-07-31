using System;
using System.Collections.Generic;

namespace HotelBooking.API.Models.Entities
{
    public class NguoiDung
    {
        public int MaNguoiDung { get; set; }
        public string HoTen { get; set; }
        public string Email { get; set; }
        public string MatKhau { get; set; }
        public string SoDienThoai { get; set; }
        public string VaiTro { get; set; } = "Customer";
        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public ICollection<DatPhong> DatPhongs { get; set; }
        public ICollection<DanhGia> DanhGias { get; set; }
    }
}