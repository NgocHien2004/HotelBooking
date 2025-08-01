using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string MatKhau { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required]
        [StringLength(100)]
        public string HoTen { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(255, MinimumLength = 6)]
        public string MatKhau { get; set; } = string.Empty;

        [StringLength(20)]
        public string? SoDienThoai { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiry { get; set; }
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public int MaNguoiDung { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }
        public string VaiTro { get; set; } = string.Empty;
        public DateTime NgayTao { get; set; }
    }
}