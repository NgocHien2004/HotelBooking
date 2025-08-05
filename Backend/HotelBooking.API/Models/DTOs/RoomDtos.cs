using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class LoaiPhongDto
    {
        public int MaLoaiPhong { get; set; }
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
        public string? TenKhachSan { get; set; }
        public List<PhongDto> Phongs { get; set; } = new List<PhongDto>();
    }

    public class CreateLoaiPhongDto
    {
        [Required]
        public int MaKhachSan { get; set; }

        [Required]
        [StringLength(100)]
        public string TenLoaiPhong { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal GiaMotDem { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int SucChua { get; set; }

        public string? MoTa { get; set; }
    }

    public class UpdateLoaiPhongDto
    {
        [StringLength(100)]
        public string? TenLoaiPhong { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? GiaMotDem { get; set; }

        [Range(1, int.MaxValue)]
        public int? SucChua { get; set; }

        public string? MoTa { get; set; }
    }

    public class PhongDto
    {
        public int MaPhong { get; set; }
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public string? TenLoaiPhong { get; set; }
        public decimal? GiaMotDem { get; set; }
        public int? SucChua { get; set; }
    }

    public class CreatePhongDto
    {
        [Required]
        public int MaLoaiPhong { get; set; }

        [Required]
        [StringLength(50)]
        public string SoPhong { get; set; } = string.Empty;

        [StringLength(50)]
        public string TrangThai { get; set; } = "Available";
    }

    public class UpdatePhongDto
    {
        [StringLength(50)]
        public string? SoPhong { get; set; }

        [StringLength(50)]
        public string? TrangThai { get; set; }
    }

    public class RoomAvailabilityDto
    {
        [Required]
        public DateTime NgayNhanPhong { get; set; }

        [Required]
        public DateTime NgayTraPhong { get; set; }

        public int? MaKhachSan { get; set; }
        public int? MaLoaiPhong { get; set; }
    }
}