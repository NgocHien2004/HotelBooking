using Microsoft.EntityFrameworkCore;
using AutoMapper;
using BCrypt.Net;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;

        public UserService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.NguoiDungs.ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            return user == null ? null : _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email == email);
            return user == null ? null : _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UserDto userDto)
        {
            var existingUser = await _context.NguoiDungs.FindAsync(id);
            if (existingUser == null)
            {
                return null;
            }

            // Check if email is being changed and if it already exists
            if (existingUser.Email != userDto.Email)
            {
                var emailExists = await _context.NguoiDungs
                    .AnyAsync(u => u.Email == userDto.Email && u.MaNguoiDung != id);
                if (emailExists)
                {
                    throw new InvalidOperationException("Email đã tồn tại.");
                }
            }

            existingUser.HoTen = userDto.HoTen;
            existingUser.Email = userDto.Email;
            existingUser.SoDienThoai = userDto.SoDienThoai;

            await _context.SaveChangesAsync();
            return _mapper.Map<UserDto>(existingUser);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _context.NguoiDungs.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.NguoiDungs.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.MatKhau))
            {
                return false;
            }

            user.MatKhau = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}