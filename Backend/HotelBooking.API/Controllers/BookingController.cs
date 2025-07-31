using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllBookings()
        {
            try
            {
                var bookings = await _bookingService.GetAllBookingsAsync();
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách đặt phòng", error = ex.Message });
            }
        }

        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var bookings = await _bookingService.GetUserBookingsAsync(userId);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách đặt phòng của bạn", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingById(int id)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(id);
                
                // Check if user owns this booking or is admin/staff
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdminOrStaff = User.IsInRole("Admin") || User.IsInRole("Staff");
                
                if (booking.MaNguoiDung != currentUserId && !isAdminOrStaff)
                {
                    return Forbid("Bạn không có quyền xem đặt phòng này");
                }

                return Ok(booking);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin đặt phòng", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingCreateDto bookingDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var booking = await _bookingService.CreateBookingAsync(userId, bookingDto);
                return CreatedAtAction(nameof(GetBookingById), new { id = booking.MaDatPhong }, booking);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo đặt phòng", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBooking(int id, [FromBody] BookingUpdateDto bookingDto)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(id);
                
                // Check if user owns this booking or is admin/staff
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdminOrStaff = User.IsInRole("Admin") || User.IsInRole("Staff");
                
                if (booking.MaNguoiDung != currentUserId && !isAdminOrStaff)
                {
                    return Forbid("Bạn không có quyền cập nhật đặt phòng này");
                }

                var updatedBooking = await _bookingService.UpdateBookingAsync(id, bookingDto);
                return Ok(updatedBooking);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật đặt phòng", error = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(id);
                
                // Check if user owns this booking or is admin/staff
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdminOrStaff = User.IsInRole("Admin") || User.IsInRole("Staff");
                
                if (booking.MaNguoiDung != currentUserId && !isAdminOrStaff)
                {
                    return Forbid("Bạn không có quyền hủy đặt phòng này");
                }

                var result = await _bookingService.CancelBookingAsync(id);
                if (result)
                    return Ok(new { message = "Đã hủy đặt phòng thành công" });
                else
                    return BadRequest(new { message = "Không thể hủy đặt phòng" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi hủy đặt phòng", error = ex.Message });
            }
        }

        [HttpGet("calculate-price")]
        public async Task<IActionResult> CalculatePrice([FromQuery] int roomId, [FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut)
        {
            try
            {
                var totalPrice = await _bookingService.CalculateTotalPriceAsync(roomId, checkIn, checkOut);
                return Ok(new { totalPrice });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tính giá", error = ex.Message });
            }
        }
    }
}