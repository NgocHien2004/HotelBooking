using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<IEnumerable<ThanhToanDto>> GetAllPaymentsAsync();
        Task<ThanhToanDto?> GetPaymentByIdAsync(int id);
        Task<IEnumerable<ThanhToanDto>> GetPaymentsByBookingAsync(int bookingId);
        Task<IEnumerable<ThanhToanDto>> GetPaymentsByUserAsync(int userId);
        Task<ThanhToanDto> CreatePaymentAsync(CreateThanhToanDto createPaymentDto);
        Task<bool> DeletePaymentAsync(int id);
        Task<IEnumerable<PaymentMethodDto>> GetPaymentMethodsAsync();
        Task<decimal> GetTotalPaymentsByBookingAsync(int bookingId);
        Task<bool> IsBookingFullyPaidAsync(int bookingId);
    }
}