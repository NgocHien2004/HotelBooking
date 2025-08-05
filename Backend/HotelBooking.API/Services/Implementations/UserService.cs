using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.Models;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;
using BCrypt.Net;

namespace HotelBooking.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UserService> _logger;

        public UserService(
            HotelBookingContext context,
            IMapper mapper,
            ILogger<UserService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            try
            {
                var user = await _context.NguoiDungs.FindAsync(id);
                return user != null ? _mapper.Map<UserDto>(user) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by ID {id}");
                throw;
            }
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            try
            {
                var user = await _context.NguoiDungs
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
                return user != null ? _mapper.Map<UserDto>(user) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by email {email}");
                throw;
            }
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            try
            {
                var users = await _context.NguoiDungs.ToListAsync();
                return _mapper.Map<IEnumerable<UserDto>>(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                throw;
            }
        }

        public async Task<UserDto> CreateUserAsync(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.NguoiDungs
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == registerDto.Email.ToLower());

                if (existingUser != null)
                {
                    throw new InvalidOperationException("Email đã được sử dụng");
                }

                // Create new user
                var user = _mapper.Map<NguoiDung>(registerDto);
                user.MatKhau = BCrypt.Net.BCrypt.HashPassword(registerDto.MatKhau);
                user.NgayTao = DateTime.Now;

                _context.NguoiDungs.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created user: {user.Email}");
                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user {registerDto.Email}");
                throw;
            }
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            try
            {
                var existingUser = await _context.NguoiDungs.FindAsync(id);
                if (existingUser == null)
                {
                    return null;
                }

                // Check if email is being changed and if it's already in use
                if (!string.IsNullOrEmpty(updateUserDto.Email) && 
                    updateUserDto.Email.ToLower() != existingUser.Email.ToLower())
                {
                    var emailExists = await _context.NguoiDungs
                        .AnyAsync(u => u.Email.ToLower() == updateUserDto.Email.ToLower() && u.MaNguoiDung != id);

                    if (emailExists)
                    {
                        throw new InvalidOperationException("Email đã được sử dụng");
                    }
                }

                _mapper.Map(updateUserDto, existingUser);
                
                // Hash password if provided
                if (!string.IsNullOrEmpty(updateUserDto.MatKhau))
                {
                    existingUser.MatKhau = BCrypt.Net.BCrypt.HashPassword(updateUserDto.MatKhau);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Updated user: {existingUser.Email}");
                return _mapper.Map<UserDto>(existingUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user with ID {id}");
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            try
            {
                var user = await _context.NguoiDungs.FindAsync(id);
                if (user == null)
                {
                    return false;
                }

                _context.NguoiDungs.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Deleted user with ID: {id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user with ID {id}");
                throw;
            }
        }

        public async Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            try
            {
                var user = await _context.NguoiDungs
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (user == null)
                {
                    return false;
                }

                return BCrypt.Net.BCrypt.Verify(password, user.MatKhau);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating credentials for {email}");
                return false;
            }
        }

        public async Task<UserDto?> AuthenticateAsync(string email, string password)
        {
            try
            {
                var user = await _context.NguoiDungs
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.MatKhau))
                {
                    return null;
                }

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error authenticating user {email}");
                throw;
            }
        }
    }
}