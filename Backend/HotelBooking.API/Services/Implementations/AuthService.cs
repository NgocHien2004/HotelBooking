using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Models.Entities;
using HotelBooking.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace HotelBooking.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public AuthService(HotelBookingContext context, IMapper mapper, IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.MatKhau, user.MatKhau))
            {
                throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng");
            }

            var token = GenerateJwtToken(user);
            var userDto = _mapper.Map<UserDto>(user);

            return new LoginResponseDto
            {
                Token = token,
                User = userDto
            };
        }

        public async Task<UserDto> RegisterAsync(UserCreateDto userCreateDto)
        {
            // Check if email already exists
            var existingUser = await _context.NguoiDungs.AnyAsync(u => u.Email == userCreateDto.Email);
            if (existingUser)
            {
                throw new ArgumentException("Email đã được sử dụng");
            }

            var user = _mapper.Map<NguoiDung>(userCreateDto);
            user.MatKhau = BCrypt.Net.BCrypt.HashPassword(userCreateDto.MatKhau);

            _context.NguoiDungs.Add(user);
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _context.NguoiDungs.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Người dùng không tồn tại");
            }

            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.OldPassword, user.MatKhau))
            {
                throw new UnauthorizedAccessException("Mật khẩu cũ không đúng");
            }

            user.MatKhau = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
            await _context.SaveChangesAsync();

            return true;
        }

        public string GenerateJwtToken(NguoiDung user)
        {
            var jwtSettings = _configuration.GetSection("JWT");
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.MaNguoiDung.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.HoTen),
                new Claim(ClaimTypes.Role, user.VaiTro)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(Convert.ToDouble(jwtSettings["ExpiryDays"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}