using System.Collections.Generic;

namespace HotelBooking.API.Models.Entities
{
    public class LoaiPhong
    {
        public int MaLoaiPhong { get; set; }
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; }
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string MoTa { get; set; }

        // Navigation properties
        public KhachSan KhachSan { get; set; }
        public ICollection<Phong> Phongs { get; set; }
    }
}