using System;

namespace HotelBooking.API.Models.DTOs
{
    public class ReviewDto
    {
        public int MaDanhGia { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaKhachSan { get; set; }
        public int DiemDanhGia { get; set; }
        public string? BinhLuan { get; set; }
        public DateTime NgayTao { get; set; }
        public string TenNguoiDung { get; set; } = string.Empty;
        public string TenKhachSan { get; set; } = string.Empty;
    }

    public class ReviewCreateDto
    {
        public int MaKhachSan { get; set; }
        public int DiemDanhGia { get; set; }
        public string? BinhLuan { get; set; }
    }

    public class ReviewUpdateDto
    {
        public int DiemDanhGia { get; set; }
        public string? BinhLuan { get; set; }
    }
}