using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("DanhGia")]
    public class DanhGia
    {
        [Key]
        [Column("ma_danh_gia")]
        public int MaDanhGia { get; set; }

        [Required]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Required]
        [Column("ma_khach_san")]
        public int MaKhachSan { get; set; }

        [Column("diem_danh_gia")]
        [Range(1, 5)]
        public int? DiemDanhGia { get; set; }

        [Column("binh_luan")]
        public string? BinhLuan { get; set; }

        [Column("ngay_tao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [ForeignKey("MaNguoiDung")]
        public virtual NguoiDung NguoiDung { get; set; } = null!;

        [ForeignKey("MaKhachSan")]
        public virtual KhachSan KhachSan { get; set; } = null!;
    }
}