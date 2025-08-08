using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class ThanhToanDto
    {
        public int MaThanhToan { get; set; }
        public int MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string? PhuongThuc { get; set; }
        public DateTime NgayThanhToan { get; set; }
        
        public string HoTenKhach { get; set; } = string.Empty;
        public string TenKhachSan { get; set; } = string.Empty;
        public string SoPhong { get; set; } = string.Empty;
        public DateTime NgayNhanPhong { get; set; }
        public DateTime NgayTraPhong { get; set; }
    }

    public class CreateThanhToanDto
    {
        [Required]
        public int MaDatPhong { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal SoTien { get; set; }

        [StringLength(50)]
        public string? PhuongThuc { get; set; }
    }

    public class PaymentMethodDto
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }
}