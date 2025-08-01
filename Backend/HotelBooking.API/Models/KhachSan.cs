using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelBooking.API.Models
{
    [Table("KhachSan")]
    public class KhachSan
    {
        [Key]
        [Column("ma_khach_san")]
        public int MaKhachSan { get; set; }

        [Required]
        [Column("ten_khach_san")]
        [StringLength(200)]
        public string TenKhachSan { get; set; } = string.Empty;

        [Required]
        [Column("dia_chi")]
        [StringLength(300)]
        public string DiaChi { get; set; } = string.Empty;

        [Column("thanh_pho")]
        [StringLength(100)]
        public string? ThanhPho { get; set; }

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [Column("danh_gia_trung_binh")]
        [Range(0, 5)]
        public decimal DanhGiaTrungBinh { get; set; } = 0;

        [Column("ngay_tao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual ICollection<LoaiPhong> LoaiPhongs { get; set; } = new List<LoaiPhong>();
        public virtual ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();
        public virtual ICollection<HinhAnhKhachSan> HinhAnhKhachSans { get; set; } = new List<HinhAnhKhachSan>();
    }
}