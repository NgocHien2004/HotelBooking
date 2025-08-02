using Microsoft.AspNetCore.Mvc;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login(LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var result = await _authService.LoginAsync(loginDto);
                if (result == null)
                {
                    return Ok(new { success = false, message = "Email hoặc mật khẩu không đúng" });
                }

                return Ok(new { 
                    success = true, 
                    data = new { 
                        token = result.Token, 
                        user = result.User 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<ActionResult> Register(RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var result = await _authService.RegisterAsync(registerDto);
                if (result == null)
                {
                    return Ok(new { success = false, message = "Email đã tồn tại" });
                }

                return Ok(new { 
                    success = true, 
                    data = new { 
                        token = result.Token, 
                        user = result.User 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        [HttpGet("check-email/{email}")]
        public async Task<ActionResult> CheckEmailExists(string email)
        {
            try
            {
                var exists = await _authService.UserExistsAsync(email);
                return Ok(new { success = true, exists });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }
    }
}