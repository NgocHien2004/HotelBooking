using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("ThanhToan")]
    public class ThanhToan
    {
        [Key]
        [Column("ma_thanh_toan")]
        public int MaThanhToan { get; set; }

        [Required]
        [Column("ma_dat_phong")]
        public int MaDatPhong { get; set; }

        [Required]
        [Column("so_tien")]
        public decimal SoTien { get; set; }

        [Column("phuong_thuc")]
        [StringLength(50)]
        public string? PhuongThuc { get; set; }

        [Column("ngay_thanh_toan")]
        public DateTime NgayThanhToan { get; set; } = DateTime.Now;

        [ForeignKey("MaDatPhong")]
        public virtual DatPhong DatPhong { get; set; } = null!;
    }
}