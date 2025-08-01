using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("DatPhong")]
    public class DatPhong
    {
        [Key]
        [Column("ma_dat_phong")]
        public int MaDatPhong { get; set; }

        [Required]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Required]
        [Column("ma_phong")]
        public int MaPhong { get; set; }

        [Required]
        [Column("ngay_nhan_phong")]
        public DateTime NgayNhanPhong { get; set; }

        [Required]
        [Column("ngay_tra_phong")]
        public DateTime NgayTraPhong { get; set; }

        [Required]
        [Column("tong_tien")]
        public decimal TongTien { get; set; }

        [Column("trang_thai")]
        [StringLength(50)]
        public string TrangThai { get; set; } = "Pending";

        [Column("ngay_dat")]
        public DateTime NgayDat { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("MaNguoiDung")]
        public virtual NguoiDung NguoiDung { get; set; } = null!;

        [ForeignKey("MaPhong")]
        public virtual Phong Phong { get; set; } = null!;

        public virtual ICollection<ThanhToan> ThanhToans { get; set; } = new List<ThanhToan>();
    }
}