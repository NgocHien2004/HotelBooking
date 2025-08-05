using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(HotelBookingContext context, IMapper mapper, ILogger<ReviewService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<DanhGiaDto>> GetAllReviewsAsync()
        {
            var reviews = await _context.DanhGias
                .Include(r => r.NguoiDung)
                .Include(r => r.KhachSan)
                .OrderByDescending(r => r.NgayTao)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DanhGiaDto>>(reviews);
        }

        public async Task<DanhGiaDto?> GetReviewByIdAsync(int id)
        {
            var review = await _context.DanhGias
                .Include(r => r.NguoiDung)
                .Include(r => r.KhachSan)
                .FirstOrDefaultAsync(r => r.MaDanhGia == id);

            return review == null ? null : _mapper.Map<DanhGiaDto>(review);
        }

        public async Task<IEnumerable<DanhGiaDto>> GetReviewsByHotelAsync(int hotelId)
        {
            var reviews = await _context.DanhGias
                .Include(r => r.NguoiDung)
                .Include(r => r.KhachSan)
                .Where(r => r.MaKhachSan == hotelId)
                .OrderByDescending(r => r.NgayTao)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DanhGiaDto>>(reviews);
        }

        public async Task<IEnumerable<DanhGiaDto>> GetReviewsByUserAsync(int userId)
        {
            var reviews = await _context.DanhGias
                .Include(r => r.NguoiDung)
                .Include(r => r.KhachSan)
                .Where(r => r.MaNguoiDung == userId)
                .OrderByDescending(r => r.NgayTao)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DanhGiaDto>>(reviews);
        }

        public async Task<DanhGiaDto> CreateReviewAsync(int userId, CreateDanhGiaDto createReviewDto)
        {
            var review = _mapper.Map<DanhGia>(createReviewDto);
            review.MaNguoiDung = userId;
            review.NgayTao = DateTime.Now;

            _context.DanhGias.Add(review);
            await _context.SaveChangesAsync();

            // Update hotel average rating
            await UpdateHotelAverageRatingAsync(review.MaKhachSan);

            return await GetReviewByIdAsync(review.MaDanhGia) ?? throw new InvalidOperationException("Không thể tạo đánh giá");
        }

        public async Task<DanhGiaDto?> UpdateReviewAsync(int id, int userId, UpdateDanhGiaDto updateReviewDto)
        {
            var existingReview = await _context.DanhGias.FindAsync(id);
            if (existingReview == null || existingReview.MaNguoiDung != userId)
            {
                return null;
            }

            _mapper.Map(updateReviewDto, existingReview);
            await _context.SaveChangesAsync();

            // Update hotel average rating
            await UpdateHotelAverageRatingAsync(existingReview.MaKhachSan);

            return await GetReviewByIdAsync(id);
        }

        public async Task<bool> DeleteReviewAsync(int id, int userId)
        {
            var review = await _context.DanhGias.FindAsync(id);
            if (review == null || review.MaNguoiDung != userId)
            {
                return false;
            }

            var hotelId = review.MaKhachSan;
            _context.DanhGias.Remove(review);
            await _context.SaveChangesAsync();

            // Update hotel average rating
            await UpdateHotelAverageRatingAsync(hotelId);

            return true;
        }

        public async Task<ReviewSummaryDto?> GetReviewSummaryAsync(int hotelId)
        {
            var reviews = await _context.DanhGias
                .Where(r => r.MaKhachSan == hotelId && r.DiemDanhGia.HasValue)
                .ToListAsync();

            if (!reviews.Any())
            {
                return null;
            }

            var hotel = await _context.KhachSans.FindAsync(hotelId);
            if (hotel == null)
            {
                return null;
            }

            var summary = new ReviewSummaryDto
            {
                MaKhachSan = hotelId,
                TenKhachSan = hotel.TenKhachSan,
                TongSoDanhGia = reviews.Count,
                DanhGiaTrungBinh = (decimal)reviews.Average(r => r.DiemDanhGia!.Value),
                PhanBoSao = reviews.GroupBy(r => r.DiemDanhGia!.Value)
                                 .ToDictionary(g => g.Key, g => g.Count())
            };

            return summary;
        }

        public async Task<bool> CanUserReviewHotelAsync(int userId, int hotelId)
        {
            // Check if user has a completed booking for this hotel
            var hasCompletedBooking = await _context.DatPhongs
                .Include(b => b.Phong)
                .ThenInclude(p => p.LoaiPhong)
                .AnyAsync(b => b.MaNguoiDung == userId &&
                              b.Phong.LoaiPhong.MaKhachSan == hotelId &&
                              b.TrangThai == "Completed" &&
                              b.NgayTraPhong < DateTime.Now);

            if (!hasCompletedBooking)
            {
                return false;
            }

            // Check if user already reviewed this hotel
            var existingReview = await _context.DanhGias
                .AnyAsync(r => r.MaNguoiDung == userId && r.MaKhachSan == hotelId);

            return !existingReview;
        }

        public async Task UpdateHotelAverageRatingAsync(int hotelId)
        {
            var reviews = await _context.DanhGias
                .Where(r => r.MaKhachSan == hotelId && r.DiemDanhGia.HasValue)
                .ToListAsync();

            var hotel = await _context.KhachSans.FindAsync(hotelId);
            if (hotel != null)
            {
                if (reviews.Any())
                {
                    hotel.DanhGiaTrungBinh = (decimal)reviews.Average(r => r.DiemDanhGia!.Value);
                }
                else
                {
                    hotel.DanhGiaTrungBinh = 0;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Updated average rating for hotel {hotelId}: {hotel.DanhGiaTrungBinh}");
            }
        }
    }
}