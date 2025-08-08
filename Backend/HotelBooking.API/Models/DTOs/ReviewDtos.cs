using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class DanhGiaDto
    {
        public int MaDanhGia { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaKhachSan { get; set; }
        public int? DiemDanhGia { get; set; }
        public string? BinhLuan { get; set; }
        public DateTime NgayTao { get; set; }
        
        public string HoTenNguoiDung { get; set; } = string.Empty;
        public string TenKhachSan { get; set; } = string.Empty;
    }

    public class CreateDanhGiaDto
    {
        [Required]
        public int MaKhachSan { get; set; }

        [Range(1, 5)]
        public int? DiemDanhGia { get; set; }

        public string? BinhLuan { get; set; }
    }

    public class UpdateDanhGiaDto
    {
        [Range(1, 5)]
        public int? DiemDanhGia { get; set; }

        public string? BinhLuan { get; set; }
    }

    public class ReviewSummaryDto
    {
        public int MaKhachSan { get; set; }
        public string TenKhachSan { get; set; } = string.Empty;
        public decimal DanhGiaTrungBinh { get; set; }
        public int TongSoDanhGia { get; set; }
        public Dictionary<int, int> PhanBoSao { get; set; } = new Dictionary<int, int>();
    }
}