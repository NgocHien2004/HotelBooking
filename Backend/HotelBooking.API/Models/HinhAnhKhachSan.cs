using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("HinhAnhKhachSan")]
    public class HinhAnhKhachSan
    {
        [Key]
        [Column("ma_anh")]
        public int MaAnh { get; set; }

        [Required]
        [Column("ma_khach_san")]
        public int MaKhachSan { get; set; }

        [Required]
        [Column("duong_dan_anh")]
        [StringLength(500)]
        public string DuongDanAnh { get; set; } = string.Empty;

        [Column("mo_ta")]
        [StringLength(255)]
        public string? MoTa { get; set; }

        [ForeignKey("MaKhachSan")]
        public virtual KhachSan KhachSan { get; set; } = null!;
    }
}