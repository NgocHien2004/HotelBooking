namespace HotelBooking.API.Models.Entities
{
    public class HinhAnhKhachSan
    {
        public int MaAnh { get; set; }
        public int MaKhachSan { get; set; }
        public string DuongDanAnh { get; set; }
        public string MoTa { get; set; }

        // Navigation property
        public KhachSan KhachSan { get; set; }
    }
}