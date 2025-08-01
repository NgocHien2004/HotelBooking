using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class DatPhongDto
    {
        public int MaDatPhong { get; set; }
        public int MaNguoiDung { get; set; }
        public int MaPhong { get; set; }
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public DateTime NgayDat { get; set; }
        
        // Navigation properties info
        public string HoTenKhach { get; set; } = string.Empty;
        public string EmailKhach { get; set; } = string.Empty;
        public string SoPhong { get; set; } = string.Empty;
        public string TenLoaiPhong { get; set; } = string.Empty;
        public string TenKhachSan { get; set; } = string.Empty;
        public int SoNgayO { get; set; }
    }

    public class CreateDatPhongDto
    {
        [Required]
        public int MaPhong { get; set; }

        [Required]
        public DateTime NgayNhanPhong { get; set; }

        [Required]
        public DateTime NgayTraPhong { get; set; }
    }

    public class UpdateDatPhongDto
    {
        [Required]
        public DateTime NgayNhanPhong { get; set; }

        [Required]
        public DateTime NgayTraPhong { get; set; }

        [StringLength(50)]
        public string? TrangThai { get; set; }
    }

    public class BookingStatusUpdateDto
    {
        [Required]
        [StringLength(50)]
        public string TrangThai { get; set; } = string.Empty;
    }
}