using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IRoomService
    {
        // Room Type methods
        Task<IEnumerable<LoaiPhongDto>> GetAllRoomTypesAsync();
        Task<LoaiPhongDto?> GetRoomTypeByIdAsync(int id);
        Task<IEnumerable<LoaiPhongDto>> GetRoomTypesByHotelAsync(int hotelId);
        Task<LoaiPhongDto> CreateRoomTypeAsync(CreateLoaiPhongDto createRoomTypeDto);
        Task<LoaiPhongDto?> UpdateRoomTypeAsync(int id, UpdateLoaiPhongDto updateRoomTypeDto);
        Task<bool> DeleteRoomTypeAsync(int id);

        // Room methods
        Task<IEnumerable<PhongDto>> GetAllRoomsAsync();
        Task<PhongDto?> GetRoomByIdAsync(int id);
        Task<IEnumerable<PhongDto>> GetRoomsByTypeAsync(int roomTypeId);
        Task<IEnumerable<PhongDto>> GetRoomsByHotelAsync(int hotelId);
        Task<PhongDto> CreateRoomAsync(CreatePhongDto createRoomDto);
        Task<PhongDto?> UpdateRoomAsync(int id, UpdatePhongDto updateRoomDto);
        Task<bool> DeleteRoomAsync(int id);

        // Availability methods
        Task<IEnumerable<PhongDto>> GetAvailableRoomsAsync(RoomAvailabilityDto availabilityDto);
        Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut);
        Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId);
    }
}