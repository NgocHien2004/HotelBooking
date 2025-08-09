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
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<DatPhongDto>>> GetAllBookings()
        {
            try
            {
                var bookings = await _bookingService.GetAllBookingsAsync();
                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all bookings");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DatPhongDto>> GetBooking(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                var booking = await _bookingService.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                if (currentUserId != booking.MaNguoiDung && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                return Ok(new { success = true, data = booking });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<DatPhongDto>>> GetUserBookings(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (currentUserId != userId && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                var bookings = await _bookingService.GetBookingsByUserAsync(userId);
                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<DatPhongDto>>> GetMyBookings()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var bookings = await _bookingService.GetBookingsByUserAsync(currentUserId);
                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bookings for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotel/{hotelId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<DatPhongDto>>> GetHotelBookings(int hotelId)
        {
            try
            {
                var bookings = await _bookingService.GetBookingsByHotelAsync(hotelId);
                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hotel bookings for hotel {HotelId}", hotelId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<DatPhongDto>> CreateBooking(CreateDatPhongDto createBookingDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = GetCurrentUserId();
                var booking = await _bookingService.CreateBookingAsync(currentUserId, createBookingDto);
                
                return CreatedAtAction(nameof(GetBooking), new { id = booking.MaDatPhong }, 
                    new { success = true, data = booking });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking");
                return StatusCode(500, new { success = false, message = "Lỗi tạo đặt phòng" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DatPhongDto>> UpdateBooking(int id, UpdateDatPhongDto updateBookingDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                var existingBooking = await _bookingService.GetBookingByIdAsync(id);
                if (existingBooking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                if (currentUserId != existingBooking.MaNguoiDung && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                if (currentUserRole != "Admin" && existingBooking.TrangThai != "Pending")
                {
                    return BadRequest(new { success = false, message = "Chỉ có thể sửa đặt phòng khi còn chờ xác nhận" });
                }

                var booking = await _bookingService.UpdateBookingAsync(id, updateBookingDto);
                if (booking == null)
                {
                    return BadRequest(new { success = false, message = "Không thể cập nhật đặt phòng" });
                }

                return Ok(new { success = true, data = booking });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi cập nhật đặt phòng" });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DatPhongDto>> UpdateBookingStatus(int id, [FromBody] string status)
        {
            try
            {
                var validStatuses = new[] { "Pending", "Confirmed", "Cancelled", "Completed", "Waiting Payment" };
                if (!validStatuses.Contains(status))
                {
                    return BadRequest(new { success = false, message = "Trạng thái không hợp lệ" });
                }

                var booking = await _bookingService.UpdateBookingStatusAsync(id, status);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                return Ok(new { success = true, data = booking });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking status for booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi cập nhật trạng thái đặt phòng" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> CancelBooking(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                var existingBooking = await _bookingService.GetBookingByIdAsync(id);
                if (existingBooking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                if (currentUserId != existingBooking.MaNguoiDung && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                if (currentUserRole != "Admin")
                {
                    var canCancel = await _bookingService.CanCancelBookingAsync(id, currentUserId);
                    if (!canCancel)
                    {
                        return BadRequest(new { success = false, message = "Không thể hủy đặt phòng này" });
                    }
                }

                var result = await _bookingService.UpdateBookingStatusAsync(id, "Cancelled");
                if (result == null)
                {
                    return BadRequest(new { success = false, message = "Không thể hủy đặt phòng" });
                }

                return Ok(new { success = true, message = "Đã hủy đặt phòng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi hủy đặt phòng" });
            }
        }

        [HttpPost("{id}/calculate-total")]
        public async Task<ActionResult<decimal>> CalculateBookingTotal(int roomId, [FromBody] CalculateBookingTotalDto dto)
        {
            try
            {
                var total = await _bookingService.CalculateBookingTotalAsync(roomId, dto.CheckIn, dto.CheckOut);
                return Ok(new { success = true, data = new { total } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating booking total");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "";
        }
    }

    public class CalculateBookingTotalDto
    {
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
    }
}