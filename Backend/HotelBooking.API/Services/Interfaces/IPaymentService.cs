using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<IEnumerable<ThanhToanDto>> GetAllPaymentsAsync();
        Task<ThanhToanDto?> GetPaymentByIdAsync(int id);
        Task<IEnumerable<ThanhToanDto>> GetPaymentsByBookingAsync(int bookingId);
        Task<ThanhToanDto> CreatePaymentAsync(CreateThanhToanDto createPaymentDto);
        Task<bool> ProcessPaymentAsync(int paymentId);
        Task<bool> RefundPaymentAsync(int paymentId);
    }
}