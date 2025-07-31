using System;
using System.Collections.Generic;

namespace HotelBooking.API.Models.Entities
{
    public class KhachSan
    {
        public int MaKhachSan { get; set; }
        public string TenKhachSan { get; set; }
        public string DiaChi { get; set; }
        public string ThanhPho { get; set; }
        public string MoTa { get; set; }
        public decimal? DanhGiaTrungBinh { get; set; } = 0;
        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public ICollection<LoaiPhong> LoaiPhongs { get; set; }
        public ICollection<DanhGia> DanhGias { get; set; }
        public ICollection<HinhAnhKhachSan> HinhAnhKhachSans { get; set; }
    }
}