using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IHotelService
    {
        Task<IEnumerable<KhachSanDto>> GetAllHotelsAsync();
        Task<KhachSanDto?> GetHotelByIdAsync(int id);
        Task<IEnumerable<KhachSanDto>> SearchHotelsAsync(string? searchTerm, string? city);
        Task<KhachSanDto> CreateHotelAsync(CreateKhachSanDto createHotelDto);
        Task<KhachSanDto?> UpdateHotelAsync(int id, UpdateKhachSanDto updateHotelDto);
        Task<bool> DeleteHotelAsync(int id);
        Task<IEnumerable<string>> GetAvailableCitiesAsync();
    }
}