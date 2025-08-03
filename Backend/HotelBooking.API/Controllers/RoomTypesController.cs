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

        public RoomTypesController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoaiPhongDto>>> GetAllRoomTypes()
        {
            var roomTypes = await _roomService.GetAllRoomTypesAsync();
            return Ok(new { success = true, data = roomTypes });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LoaiPhongDto>> GetRoomType(int id)
        {
            var roomType = await _roomService.GetRoomTypeByIdAsync(id);
            if (roomType == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
            }

            return Ok(new { success = true, data = roomType });
        }

        [HttpGet("hotel/{hotelId}")]
        public async Task<ActionResult<IEnumerable<LoaiPhongDto>>> GetRoomTypesByHotel(int hotelId)
        {
            var roomTypes = await _roomService.GetRoomTypesByHotelAsync(hotelId);
            return Ok(new { success = true, data = roomTypes });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LoaiPhongDto>> CreateRoomType(CreateLoaiPhongDto createRoomTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var roomType = await _roomService.CreateRoomTypeAsync(createRoomTypeDto);
                return CreatedAtAction(nameof(GetRoomType), new { id = roomType.MaLoaiPhong }, 
                    new { success = true, data = roomType });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LoaiPhongDto>> UpdateRoomType(int id, UpdateLoaiPhongDto updateRoomTypeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var roomType = await _roomService.UpdateRoomTypeAsync(id, updateRoomTypeDto);
            if (roomType == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
            }

            return Ok(new { success = true, data = roomType });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteRoomType(int id)
        {
            var result = await _roomService.DeleteRoomTypeAsync(id);
            if (!result)
            {
                return NotFound(new { success = false, message = "Không tìm thấy loại phòng" });
            }

            return Ok(new { success = true, message = "Xóa loại phòng thành công" });
        }
    }
}