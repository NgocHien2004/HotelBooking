using System.Collections.Generic;

namespace HotelBooking.API.Models.Entities
{
    public class Phong
    {
        public int MaPhong { get; set; }
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; }
        public string TrangThai { get; set; } = "Available";

        // Navigation properties
        public LoaiPhong LoaiPhong { get; set; }
        public ICollection<DatPhong> DatPhongs { get; set; }
    }
}