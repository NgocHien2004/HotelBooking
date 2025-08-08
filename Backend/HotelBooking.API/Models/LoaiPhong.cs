using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("LoaiPhong")]
    public class LoaiPhong
    {
        [Key]
        [Column("ma_loai_phong")]
        public int MaLoaiPhong { get; set; }

        [Required]
        [Column("ma_khach_san")]
        public int MaKhachSan { get; set; }

        [Required]
        [Column("ten_loai_phong")]
        [StringLength(100)]
        public string TenLoaiPhong { get; set; } = string.Empty;

        [Required]
        [Column("gia_mot_dem")]
        public decimal GiaMotDem { get; set; }

        [Required]
        [Column("suc_chua")]
        public int SucChua { get; set; }

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [ForeignKey("MaKhachSan")]
        public virtual KhachSan KhachSan { get; set; } = null!;
        public virtual ICollection<Phong> Phongs { get; set; } = new List<Phong>();
    }
}