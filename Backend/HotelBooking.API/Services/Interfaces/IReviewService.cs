using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IReviewService
    {
        Task<IEnumerable<DanhGiaDto>> GetAllReviewsAsync();
        Task<DanhGiaDto?> GetReviewByIdAsync(int id);
        Task<IEnumerable<DanhGiaDto>> GetReviewsByHotelAsync(int hotelId);
        Task<IEnumerable<DanhGiaDto>> GetReviewsByUserAsync(int userId);
        Task<ReviewSummaryDto?> GetReviewSummaryAsync(int hotelId);
        Task<DanhGiaDto> CreateReviewAsync(int userId, CreateDanhGiaDto createReviewDto);
        Task<DanhGiaDto?> UpdateReviewAsync(int reviewId, int userId, UpdateDanhGiaDto updateReviewDto);
        Task<bool> DeleteReviewAsync(int reviewId, int userId);
        Task<bool> CanUserReviewHotelAsync(int userId, int hotelId);
        Task UpdateHotelAverageRatingAsync(int hotelId);
    }
}