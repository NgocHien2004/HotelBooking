using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HotelsController : ControllerBase
    {
        private readonly IHotelService _hotelService;

        public HotelsController(IHotelService hotelService)
        {
            _hotelService = hotelService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<KhachSanDto>>> GetAllHotels()
        {
            var hotels = await _hotelService.GetAllHotelsAsync();
            return Ok(new { success = true, data = hotels });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<KhachSanDto>> GetHotel(int id)
        {
            var hotel = await _hotelService.GetHotelByIdAsync(id);
            if (hotel == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
            }

            return Ok(new { success = true, data = hotel });
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<KhachSanDto>>> SearchHotels([FromQuery] string? searchTerm, [FromQuery] string? city)
        {
            var hotels = await _hotelService.SearchHotelsAsync(searchTerm, city);
            return Ok(new { success = true, data = hotels });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<KhachSanDto>> CreateHotel(CreateKhachSanDto createHotelDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var hotel = await _hotelService.CreateHotelAsync(createHotelDto);
            return CreatedAtAction(nameof(GetHotel), new { id = hotel.MaKhachSan }, new { success = true, data = hotel });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<KhachSanDto>> UpdateHotel(int id, UpdateKhachSanDto updateHotelDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var hotel = await _hotelService.UpdateHotelAsync(id, updateHotelDto);
            if (hotel == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
            }

            return Ok(new { success = true, data = hotel });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteHotel(int id)
        {
            var result = await _hotelService.DeleteHotelAsync(id);
            if (!result)
            {
                return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
            }

            return Ok(new { success = true, message = "Xóa khách sạn thành công" });
        }

        [HttpGet("{id}/images")]
        public async Task<ActionResult<IEnumerable<HinhAnhKhachSanDto>>> GetHotelImages(int id)
        {
            var images = await _hotelService.GetHotelImagesAsync(id);
            return Ok(new { success = true, data = images });
        }

        [HttpPost("images")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<HinhAnhKhachSanDto>> AddHotelImage(CreateHinhAnhKhachSanDto createImageDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var image = await _hotelService.AddHotelImageAsync(createImageDto);
            return Ok(new { success = true, data = image });
        }

        [HttpDelete("images/{imageId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteHotelImage(int imageId)
        {
            var result = await _hotelService.DeleteHotelImageAsync(imageId);
            if (!result)
            {
                return NotFound(new { success = false, message = "Không tìm thấy hình ảnh" });
            }

            return Ok(new { success = true, message = "Xóa hình ảnh thành công" });
        }
    }
}