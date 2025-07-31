using System;

namespace HotelBooking.API.Models.DTOs
{
    public class UserDto
    {
        public int MaNguoiDung { get; set; }
        public string HoTen { get; set; }
        public string Email { get; set; }
        public string SoDienThoai { get; set; }
        public string VaiTro { get; set; }
        public DateTime NgayTao { get; set; }
    }

    public class UserCreateDto
    {
        public string HoTen { get; set; }
        public string Email { get; set; }
        public string MatKhau { get; set; }
        public string SoDienThoai { get; set; }
        public string VaiTro { get; set; } = "Customer";
    }

    public class UserUpdateDto
    {
        public string HoTen { get; set; }
        public string SoDienThoai { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string MatKhau { get; set; }
    }

    public class LoginResponseDto
    {
        public string Token { get; set; }
        public UserDto User { get; set; }
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }
}