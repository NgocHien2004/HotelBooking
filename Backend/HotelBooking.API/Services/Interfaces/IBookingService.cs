using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IBookingService
    {
        Task<IEnumerable<DatPhongDto>> GetAllBookingsAsync();
        Task<DatPhongDto?> GetBookingByIdAsync(int id);
        Task<IEnumerable<DatPhongDto>> GetBookingsByUserAsync(int userId);
        Task<IEnumerable<DatPhongDto>> GetBookingsByHotelAsync(int hotelId);
        Task<DatPhongDto> CreateBookingAsync(int userId, CreateDatPhongDto createBookingDto);
        Task<DatPhongDto?> UpdateBookingAsync(int id, UpdateDatPhongDto updateBookingDto);
        Task<DatPhongDto?> UpdateBookingStatusAsync(int id, string status);
        Task<decimal> CalculateBookingTotalAsync(int roomId, DateTime checkIn, DateTime checkOut);
        Task<bool> CanCancelBookingAsync(int bookingId, int userId);
        Task<decimal> GetTotalPaidAmountAsync(int bookingId);
        Task<DatPhongDto?> UpdateBookingStatusBasedOnPaymentAsync(int bookingId);
    }
}