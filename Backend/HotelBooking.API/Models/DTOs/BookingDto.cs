using System;

namespace HotelBooking.API.Models.DTOs
{
    public class BookingDto
    {
        public int MaDatPhong { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public DateTime NgayDat { get; set; }
        public UserDto? NguoiDung { get; set; }
        public RoomDto? Phong { get; set; }
    }

    public class BookingCreateDto
    {
        public int MaPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
    }

    public class BookingUpdateDto
    {
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public string? TrangThai { get; set; }
    }

    public class BookingSearchDto
    {
        public int? MaKhachSan { get; set; }
        public DateTime? NgayNhanPhong { get; set; }
        public DateTime? NgayTraPhong { get; set; }
        public int? SoNguoi { get; set; }
        public decimal? GiaMin { get; set; }
        public decimal? GiaMax { get; set; }
    }
}