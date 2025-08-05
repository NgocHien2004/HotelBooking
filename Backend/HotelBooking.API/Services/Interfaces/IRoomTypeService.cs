using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IRoomTypeService
    {
        Task<IEnumerable<LoaiPhongDto>> GetAllRoomTypesAsync();
        Task<LoaiPhongDto?> GetRoomTypeByIdAsync(int id);
        Task<IEnumerable<LoaiPhongDto>> GetRoomTypesByHotelAsync(int hotelId);
        Task<LoaiPhongDto> CreateRoomTypeAsync(CreateLoaiPhongDto createRoomTypeDto);
        Task<LoaiPhongDto?> UpdateRoomTypeAsync(int id, UpdateLoaiPhongDto updateRoomTypeDto);
        Task<bool> DeleteRoomTypeAsync(int id);
    }
}