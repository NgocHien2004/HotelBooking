using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HotelController : ControllerBase
    {
        private readonly IHotelService _hotelService;

        public HotelController(IHotelService hotelService)
        {
            _hotelService = hotelService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllHotels()
        {
            try
            {
                var hotels = await _hotelService.GetAllHotelsAsync();
                return Ok(hotels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách khách sạn", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetHotelById(int id)
        {
            try
            {
                var hotel = await _hotelService.GetHotelByIdAsync(id);
                return Ok(hotel);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin khách sạn", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchHotels([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(new { message = "Vui lòng nhập từ khóa tìm kiếm" });
                }

                var hotels = await _hotelService.SearchHotelsAsync(searchTerm);
                return Ok(hotels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tìm kiếm khách sạn", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateHotel([FromBody] HotelCreateDto hotelCreateDto)
        {
            try
            {
                var hotel = await _hotelService.CreateHotelAsync(hotelCreateDto);
                return CreatedAtAction(nameof(GetHotelById), new { id = hotel.MaKhachSan }, hotel);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo khách sạn", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateHotel(int id, [FromBody] HotelUpdateDto hotelUpdateDto)
        {
            try
            {
                var updatedHotel = await _hotelService.UpdateHotelAsync(id, hotelUpdateDto);
                return Ok(updatedHotel);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật khách sạn", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteHotel(int id)
        {
            try
            {
                var result = await _hotelService.DeleteHotelAsync(id);
                if (result)
                    return NoContent();
                else
                    return BadRequest(new { message = "Không thể xóa khách sạn" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa khách sạn", error = ex.Message });
            }
        }

        [HttpPost("{id}/images")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddHotelImage(int id, [FromBody] HotelImageCreateDto imageDto)
        {
            try
            {
                if (imageDto.MaKhachSan != id)
                {
                    return BadRequest(new { message = "ID khách sạn không khớp" });
                }

                var image = await _hotelService.AddHotelImageAsync(imageDto);
                return Ok(image);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi thêm hình ảnh", error = ex.Message });
            }
        }

        [HttpDelete("images/{imageId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteHotelImage(int imageId)
        {
            try
            {
                var result = await _hotelService.DeleteHotelImageAsync(imageId);
                if (result)
                    return NoContent();
                else
                    return BadRequest(new { message = "Không thể xóa hình ảnh" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa hình ảnh", error = ex.Message });
            }
        }
    }
}