using HotelBooking.API.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(int id);
        Task<UserDto> UpdateUserAsync(int id, UserUpdateDto userUpdateDto);
        Task<bool> DeleteUserAsync(int id);
    }

    public interface IHotelService
    {
        Task<IEnumerable<HotelDto>> GetAllHotelsAsync();
        Task<HotelDto> GetHotelByIdAsync(int id);
        Task<IEnumerable<HotelDto>> SearchHotelsAsync(string searchTerm);
        Task<HotelDto> CreateHotelAsync(HotelCreateDto hotelCreateDto);
        Task<HotelDto> UpdateHotelAsync(int id, HotelUpdateDto hotelUpdateDto);
        Task<bool> DeleteHotelAsync(int id);
        Task<HotelImageDto> AddHotelImageAsync(HotelImageCreateDto imageDto);
        Task<bool> DeleteHotelImageAsync(int imageId);
    }

    public interface IRoomService
    {
        Task<IEnumerable<RoomTypeDto>> GetRoomTypesByHotelAsync(int hotelId);
        Task<RoomTypeDto> GetRoomTypeByIdAsync(int id);
        Task<RoomTypeDto> CreateRoomTypeAsync(RoomTypeCreateDto roomTypeDto);
        Task<RoomTypeDto> UpdateRoomTypeAsync(int id, RoomTypeUpdateDto roomTypeDto);
        Task<bool> DeleteRoomTypeAsync(int id);
        
        Task<IEnumerable<RoomDto>> GetRoomsByTypeAsync(int roomTypeId);
        Task<RoomDto> GetRoomByIdAsync(int id);
        Task<RoomDto> CreateRoomAsync(RoomCreateDto roomDto);
        Task<RoomDto> UpdateRoomAsync(int id, RoomUpdateDto roomDto);
        Task<bool> DeleteRoomAsync(int id);
        Task<IEnumerable<RoomAvailabilityDto>> CheckRoomAvailabilityAsync(BookingSearchDto searchDto);
    }

    public interface IBookingService
    {
        Task<IEnumerable<BookingDto>> GetAllBookingsAsync();
        Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId);
        Task<BookingDto> GetBookingByIdAsync(int id);
        Task<BookingDto> CreateBookingAsync(int userId, BookingCreateDto bookingDto);
        Task<BookingDto> UpdateBookingAsync(int id, BookingUpdateDto bookingDto);
        Task<bool> CancelBookingAsync(int id);
        Task<decimal> CalculateTotalPriceAsync(int roomId, DateTime checkIn, DateTime checkOut);
    }

    public interface IPaymentService
    {
        Task<IEnumerable<PaymentDto>> GetPaymentsByBookingAsync(int bookingId);
        Task<PaymentDto> GetPaymentByIdAsync(int id);
        Task<PaymentDto> CreatePaymentAsync(PaymentCreateDto paymentDto);
        Task<PaymentSummaryDto> GetPaymentSummaryAsync(int bookingId);
    }

    public interface IReviewService
    {
        Task<IEnumerable<ReviewDto>> GetHotelReviewsAsync(int hotelId);
        Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(int userId);
        Task<ReviewDto> GetReviewByIdAsync(int id);
        Task<ReviewDto> CreateReviewAsync(int userId, ReviewCreateDto reviewDto);
        Task<ReviewDto> UpdateReviewAsync(int id, ReviewUpdateDto reviewDto);
        Task<bool> DeleteReviewAsync(int id);
        Task<decimal> UpdateHotelRatingAsync(int hotelId);
    }
}