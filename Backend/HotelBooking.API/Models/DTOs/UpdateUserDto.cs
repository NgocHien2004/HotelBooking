using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class UpdateUserDto
    {
        [StringLength(100)]
        public string? HoTen { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(15)]
        public string? SoDienThoai { get; set; }

        [StringLength(200)]
        public string? DiaChi { get; set; }

        [MinLength(6)]
        public string? MatKhau { get; set; }

        public string? VaiTro { get; set; }
    }
}