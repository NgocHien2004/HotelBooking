using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (currentUserId != id && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                return Ok(new { success = true, data = user });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user {id}");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (currentUserId != id && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
                }

                var updatedUser = await _userService.UpdateUserAsync(id, updateUserDto);
                if (updatedUser == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                return Ok(new { success = true, data = updatedUser });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user {id}");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var result = await _userService.DeleteUserAsync(id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                return Ok(new { success = true, message = "Đã xóa người dùng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user {id}");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
    }
}