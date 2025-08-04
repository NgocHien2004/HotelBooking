using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomTypesController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomTypesController> _logger;

        public RoomTypesController(IRoomService roomService, ILogger<RoomTypesController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoaiPhongDto>>> GetAllRoomTypes()
        {
            try
            {
                _logger.LogInformation("Getting all room types...");
                var roomTypes = await _roomService.GetAllRoomTypesAsync();
                _logger.LogInformation($"Found {roomTypes?.Count()} room types");
                
                return Ok(new { success = true, data = roomTypes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all room types");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LoaiPhongDto>> GetRoomType(int id)
        {
            try
            {
                _logger.LogInformation($"Getting room type with ID: {id}");
                var roomType = await _roomService.GetRoomTypeByIdAsync(id);
                if (roomType == null)
                {
                    _logger.LogWarning($"Room type with ID {id} not found");
                    return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
                }

                _logger.LogInformation($"Found room type: {roomType.TenLoaiPhong}");
                return Ok(new { success = true, data = roomType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting room type with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotel/{hotelId}")]
        public async Task<ActionResult<IEnumerable<LoaiPhongDto>>> GetRoomTypesByHotel(int hotelId)
        {
            try
            {
                _logger.LogInformation($"Getting room types for hotel ID: {hotelId}");
                var roomTypes = await _roomService.GetRoomTypesByHotelAsync(hotelId);
                _logger.LogInformation($"Found {roomTypes?.Count()} room types for hotel {hotelId}");
                
                return Ok(new { success = true, data = roomTypes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting room types for hotel {hotelId}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LoaiPhongDto>> CreateRoomType(CreateLoaiPhongDto createRoomTypeDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                _logger.LogInformation($"Creating room type: {createRoomTypeDto.TenLoaiPhong} for hotel {createRoomTypeDto.MaKhachSan}");
                var roomType = await _roomService.CreateRoomTypeAsync(createRoomTypeDto);
                _logger.LogInformation($"Room type created with ID: {roomType.MaLoaiPhong}");
                
                return CreatedAtAction(nameof(GetRoomType), new { id = roomType.MaLoaiPhong }, 
                    new { success = true, data = roomType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating room type");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LoaiPhongDto>> UpdateRoomType(int id, UpdateLoaiPhongDto updateRoomTypeDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                _logger.LogInformation($"Updating room type with ID: {id}");
                var roomType = await _roomService.UpdateRoomTypeAsync(id, updateRoomTypeDto);
                if (roomType == null)
                {
                    _logger.LogWarning($"Room type with ID {id} not found for update");
                    return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
                }

                _logger.LogInformation($"Room type updated: {roomType.TenLoaiPhong}");
                return Ok(new { success = true, data = roomType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating room type with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteRoomType(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting room type with ID: {id}");
                var result = await _roomService.DeleteRoomTypeAsync(id);
                if (!result)
                {
                    _logger.LogWarning($"Room type with ID {id} not found for deletion");
                    return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
                }

                _logger.LogInformation($"Room type with ID {id} deleted successfully");
                return Ok(new { success = true, message = "Xóa loại phòng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting room type with ID: {id}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}