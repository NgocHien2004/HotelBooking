using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(new { success = true, data = users });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            // Users can only get their own info unless they're admin
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

        [HttpGet("profile")]
        public async Task<ActionResult<UserDto>> GetCurrentUserProfile()
        {
            var currentUserId = GetCurrentUserId();
            var user = await _userService.GetUserByIdAsync(currentUserId);
            
            if (user == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy thông tin người dùng" });
            }

            return Ok(new { success = true, data = user });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto userDto)
        {
            // Users can only update their own info unless they're admin
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserId != id && currentUserRole != "Admin")
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var updatedUser = await _userService.UpdateUserAsync(id, userDto);
                if (updatedUser == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                return Ok(new { success = true, data = updatedUser });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var currentUserId = GetCurrentUserId();
            var result = await _userService.ChangePasswordAsync(currentUserId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

            if (!result)
            {
                return BadRequest(new { success = false, message = "Mật khẩu hiện tại không đúng" });
            }

            return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
            }

            return Ok(new { success = true, message = "Xóa người dùng thành công" });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}