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
    public class RoomController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        // Room Types
        [HttpGet("types/hotel/{hotelId}")]
        public async Task<IActionResult> GetRoomTypesByHotel(int hotelId)
        {
            try
            {
                var roomTypes = await _roomService.GetRoomTypesByHotelAsync(hotelId);
                return Ok(roomTypes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách loại phòng", error = ex.Message });
            }
        }

        [HttpGet("types/{id}")]
        public async Task<IActionResult> GetRoomTypeById(int id)
        {
            try
            {
                var roomType = await _roomService.GetRoomTypeByIdAsync(id);
                return Ok(roomType);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin loại phòng", error = ex.Message });
            }
        }

        [HttpPost("types")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateRoomType([FromBody] RoomTypeCreateDto roomTypeDto)
        {
            try
            {
                var roomType = await _roomService.CreateRoomTypeAsync(roomTypeDto);
                return CreatedAtAction(nameof(GetRoomTypeById), new { id = roomType.MaLoaiPhong }, roomType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo loại phòng", error = ex.Message });
            }
        }

        [HttpPut("types/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromBody] RoomTypeUpdateDto roomTypeDto)
        {
            try
            {
                var updatedRoomType = await _roomService.UpdateRoomTypeAsync(id, roomTypeDto);
                return Ok(updatedRoomType);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật loại phòng", error = ex.Message });
            }
        }

        [HttpDelete("types/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            try
            {
                var result = await _roomService.DeleteRoomTypeAsync(id);
                if (result)
                    return NoContent();
                else
                    return BadRequest(new { message = "Không thể xóa loại phòng" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa loại phòng", error = ex.Message });
            }
        }

        // Rooms
        [HttpGet("by-type/{roomTypeId}")]
        public async Task<IActionResult> GetRoomsByType(int roomTypeId)
        {
            try
            {
                var rooms = await _roomService.GetRoomsByTypeAsync(roomTypeId);
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách phòng", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoomById(int id)
        {
            try
            {
                var room = await _roomService.GetRoomByIdAsync(id);
                return Ok(room);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin phòng", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateRoom([FromBody] RoomCreateDto roomDto)
        {
            try
            {
                var room = await _roomService.CreateRoomAsync(roomDto);
                return CreatedAtAction(nameof(GetRoomById), new { id = room.MaPhong }, room);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo phòng", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] RoomUpdateDto roomDto)
        {
            try
            {
                var updatedRoom = await _roomService.UpdateRoomAsync(id, roomDto);
                return Ok(updatedRoom);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật phòng", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            try
            {
                var result = await _roomService.DeleteRoomAsync(id);
                if (result)
                    return NoContent();
                else
                    return BadRequest(new { message = "Không thể xóa phòng" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa phòng", error = ex.Message });
            }
        }

        [HttpPost("check-availability")]
        public async Task<IActionResult> CheckAvailability([FromBody] BookingSearchDto searchDto)
        {
            try
            {
                var availability = await _roomService.CheckRoomAvailabilityAsync(searchDto);
                return Ok(availability);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi kiểm tra phòng trống", error = ex.Message });
            }
        }
    }
}