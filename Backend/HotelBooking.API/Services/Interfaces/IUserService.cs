using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto> CreateUserAsync(RegisterDto registerDto);
        Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> ValidateUserCredentialsAsync(string email, string password);
        Task<UserDto?> AuthenticateAsync(string email, string password);
    }
}