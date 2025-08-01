using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("NguoiDung")]
    public class NguoiDung
    {
        [Key]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Required]
        [Column("ho_ten")]
        [StringLength(100)]
        public string HoTen { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("mat_khau")]
        [StringLength(255)]
        public string MatKhau { get; set; } = string.Empty;

        [Column("so_dien_thoai")]
        [StringLength(20)]
        public string? SoDienThoai { get; set; }

        [Column("vai_tro")]
        [StringLength(50)]
        public string VaiTro { get; set; } = "Customer";

        [Column("ngay_tao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual ICollection<DatPhong> DatPhongs { get; set; } = new List<DatPhong>();
        public virtual ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();
    }
}