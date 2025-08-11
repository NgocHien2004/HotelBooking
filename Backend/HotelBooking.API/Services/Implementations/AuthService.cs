using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using BCrypt.Net;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

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

        public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.MatKhau, user.MatKhau))
            {
                return null;
            }

            var userDto = _mapper.Map<UserDto>(user);
            var token = GenerateJwtToken(userDto);
            var expiry = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JWT:ExpiryDays"]));

            return new AuthResponseDto
            {
                Token = token,
                Expiry = expiry,
                User = userDto
            };
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
        {
            if (await UserExistsAsync(registerDto.Email))
            {
                return null;
            }

            var user = _mapper.Map<NguoiDung>(registerDto);
            user.MatKhau = BCrypt.Net.BCrypt.HashPassword(registerDto.MatKhau);

            _context.NguoiDungs.Add(user);
            await _context.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            var token = GenerateJwtToken(userDto);
            var expiry = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JWT:ExpiryDays"]));

            return new AuthResponseDto
            {
                Token = token,
                Expiry = expiry,
                User = userDto
            };
        }

        public string GenerateJwtToken(UserDto user)
        {
            var jwtSettings = _configuration.GetSection("JWT");
            var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"] ?? string.Empty);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.MaNguoiDung.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.HoTen),
                new Claim(ClaimTypes.Role, user.VaiTro),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["ExpiryDays"])),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(secretKey), SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<bool> UserExistsAsync(string email)
        {
            return await _context.NguoiDungs.AnyAsync(u => u.Email == email);
        }
        
    }
}