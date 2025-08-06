using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomsController> _logger;

        public RoomsController(IRoomService roomService, ILogger<RoomsController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PhongDto>>> GetAllRooms()
        {
            try
            {
                var rooms = await _roomService.GetAllRoomsAsync();
                return Ok(new { success = true, data = rooms });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all rooms");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PhongDto>> GetRoom(int id)
        {
            try
            {
                var room = await _roomService.GetRoomByIdAsync(id);
                if (room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng" });
                }

                return Ok(new { success = true, data = room });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room {RoomId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotel/{hotelId}")]
        public async Task<ActionResult<IEnumerable<PhongDto>>> GetRoomsByHotel(int hotelId)
        {
            try
            {
                var rooms = await _roomService.GetRoomsByHotelAsync(hotelId);
                return Ok(new { success = true, data = rooms });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rooms for hotel {HotelId}", hotelId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("type/{roomTypeId}")]
        public async Task<ActionResult<IEnumerable<PhongDto>>> GetRoomsByType(int roomTypeId)
        {
            try
            {
                var rooms = await _roomService.GetRoomsByTypeAsync(roomTypeId);
                return Ok(new { success = true, data = rooms });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rooms for room type {RoomTypeId}", roomTypeId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<PhongDto>>> GetAvailableRooms(
            [FromQuery] DateTime ngayNhanPhong,
            [FromQuery] DateTime ngayTraPhong,
            [FromQuery] int? maKhachSan = null,
            [FromQuery] int? maLoaiPhong = null)
        {
            try
            {
                var availabilityDto = new RoomAvailabilityDto
                {
                    NgayNhanPhong = ngayNhanPhong,
                    NgayTraPhong = ngayTraPhong,
                    MaKhachSan = maKhachSan,
                    MaLoaiPhong = maLoaiPhong
                };

                var availableRooms = await _roomService.GetAvailableRoomsAsync(availabilityDto);
                return Ok(new { success = true, data = availableRooms });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available rooms");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}/available")]
        public async Task<ActionResult<bool>> CheckRoomAvailability(
            int id, 
            [FromQuery] DateTime ngayNhanPhong, 
            [FromQuery] DateTime ngayTraPhong)
        {
            try
            {
                var isAvailable = await _roomService.IsRoomAvailableAsync(id, ngayNhanPhong, ngayTraPhong);
                return Ok(new { success = true, data = new { available = isAvailable } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking room availability for room {RoomId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PhongDto>> CreateRoom(CreatePhongDto createRoomDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var room = await _roomService.CreateRoomAsync(createRoomDto);
                return CreatedAtAction(nameof(GetRoom), new { id = room.MaPhong }, 
                    new { success = true, data = room });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating room");
                return StatusCode(500, new { success = false, message = "Lỗi tạo phòng" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PhongDto>> UpdateRoom(int id, UpdatePhongDto updateRoomDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var room = await _roomService.UpdateRoomAsync(id, updateRoomDto);
                if (room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng" });
                }

                return Ok(new { success = true, data = room });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating room {RoomId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi cập nhật phòng" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteRoom(int id)
        {
            try
            {
                var deleted = await _roomService.DeleteRoomAsync(id);
                if (!deleted)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng" });
                }

                return Ok(new { success = true, message = "Xóa phòng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting room {RoomId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi xóa phòng" });
            }
        }
    }
}