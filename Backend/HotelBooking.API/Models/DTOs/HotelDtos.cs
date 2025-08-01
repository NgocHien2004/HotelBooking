using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class KhachSanDto
    {
        public int MaKhachSan { get; set; }
        public string TenKhachSan { get; set; } = string.Empty;
        public string DiaChi { get; set; } = string.Empty;
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
        public decimal DanhGiaTrungBinh { get; set; }
        public DateTime NgayTao { get; set; }
        public List<HinhAnhKhachSanDto> HinhAnhs { get; set; } = new List<HinhAnhKhachSanDto>();
        public List<LoaiPhongDto> LoaiPhongs { get; set; } = new List<LoaiPhongDto>();
    }

    public class CreateKhachSanDto
    {
        [Required]
        [StringLength(200)]
        public string TenKhachSan { get; set; } = string.Empty;

        [Required]
        [StringLength(300)]
        public string DiaChi { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ThanhPho { get; set; }

        public string? MoTa { get; set; }
    }

    public class UpdateKhachSanDto
    {
        [Required]
        [StringLength(200)]
        public string TenKhachSan { get; set; } = string.Empty;

        [Required]
        [StringLength(300)]
        public string DiaChi { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ThanhPho { get; set; }

        public string? MoTa { get; set; }
    }

    public class HinhAnhKhachSanDto
    {
        public int MaAnh { get; set; }
        public int MaKhachSan { get; set; }
        public string DuongDanAnh { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }

    public class CreateHinhAnhKhachSanDto
    {
        [Required]
        public int MaKhachSan { get; set; }

        [Required]
        [StringLength(500)]
        public string DuongDanAnh { get; set; } = string.Empty;

        [StringLength(255)]
        public string? MoTa { get; set; }
    }
}