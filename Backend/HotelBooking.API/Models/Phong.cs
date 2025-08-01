using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("Phong")]
    public class Phong
    {
        [Key]
        [Column("ma_phong")]
        public int MaPhong { get; set; }

        [Required]
        [Column("ma_loai_phong")]
        public int MaLoaiPhong { get; set; }

        [Required]
        [Column("so_phong")]
        [StringLength(50)]
        public string SoPhong { get; set; } = string.Empty;

        [Column("trang_thai")]
        [StringLength(50)]
        public string TrangThai { get; set; } = "Available";

        // Navigation properties
        [ForeignKey("MaLoaiPhong")]
        public virtual LoaiPhong LoaiPhong { get; set; } = null!;
        public virtual ICollection<DatPhong> DatPhongs { get; set; } = new List<DatPhong>();
    }
}