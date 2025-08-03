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
        private readonly ILogger<HotelsController> _logger;

        public HotelsController(IHotelService hotelService, ILogger<HotelsController> logger)
        {
            _hotelService = hotelService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<KhachSanDto>>> GetAllHotels()
        {
            try
            {
                _logger.LogInformation("Getting all hotels...");
                var hotels = await _hotelService.GetAllHotelsAsync();
                _logger.LogInformation($"Found {hotels?.Count()} hotels");
                
                return Ok(new { success = true, data = hotels, message = "Hotels loaded successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all hotels");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<KhachSanDto>> GetHotel(int id)
        {
            try
            {
                _logger.LogInformation($"Getting hotel with ID: {id}");
                var hotel = await _hotelService.GetHotelByIdAsync(id);
                if (hotel == null)
                {
                    _logger.LogWarning($"Hotel with ID {id} not found");
                    return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
                }

                _logger.LogInformation($"Found hotel: {hotel.TenKhachSan}");
                return Ok(new { success = true, data = hotel });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting hotel with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<KhachSanDto>>> SearchHotels([FromQuery] string? searchTerm, [FromQuery] string? city)
        {
            try
            {
                _logger.LogInformation($"Searching hotels with term: '{searchTerm}', city: '{city}'");
                var hotels = await _hotelService.SearchHotelsAsync(searchTerm, city);
                _logger.LogInformation($"Search returned {hotels?.Count()} hotels");
                
                return Ok(new { success = true, data = hotels });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching hotels");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<KhachSanDto>> CreateHotel(CreateKhachSanDto createHotelDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                _logger.LogInformation($"Creating hotel: {createHotelDto.TenKhachSan}");
                var hotel = await _hotelService.CreateHotelAsync(createHotelDto);
                _logger.LogInformation($"Hotel created with ID: {hotel.MaKhachSan}");
                
                return CreatedAtAction(nameof(GetHotel), new { id = hotel.MaKhachSan }, new { success = true, data = hotel });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating hotel");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<KhachSanDto>> UpdateHotel(int id, UpdateKhachSanDto updateHotelDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                _logger.LogInformation($"Updating hotel with ID: {id}");
                var hotel = await _hotelService.UpdateHotelAsync(id, updateHotelDto);
                if (hotel == null)
                {
                    _logger.LogWarning($"Hotel with ID {id} not found for update");
                    return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
                }

                _logger.LogInformation($"Hotel updated: {hotel.TenKhachSan}");
                return Ok(new { success = true, data = hotel });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating hotel with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteHotel(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting hotel with ID: {id}");
                var result = await _hotelService.DeleteHotelAsync(id);
                if (!result)
                {
                    _logger.LogWarning($"Hotel with ID {id} not found for deletion");
                    return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
                }

                _logger.LogInformation($"Hotel with ID {id} deleted successfully");
                return Ok(new { success = true, message = "Xóa khách sạn thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting hotel with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Test endpoint to verify controller is working
        [HttpGet("test")]
        public ActionResult Test()
        {
            _logger.LogInformation("Test endpoint called");
            return Ok(new { success = true, message = "Hotels controller is working!", timestamp = DateTime.Now });
        }
    }
}