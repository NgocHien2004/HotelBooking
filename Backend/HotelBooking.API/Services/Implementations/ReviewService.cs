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

        public ReviewService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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
            var canReview = await CanUserReviewHotelAsync(userId, createReviewDto.MaKhachSan);
            if (!canReview)
            {
                throw new InvalidOperationException("Bạn chỉ có thể đánh giá khách sạn mà bạn đã từng đặt phòng");
            }

            var existingReview = await _context.DanhGias
                .FirstOrDefaultAsync(r => r.MaNguoiDung == userId && r.MaKhachSan == createReviewDto.MaKhachSan);

            if (existingReview != null)
            {
                throw new InvalidOperationException("Bạn đã đánh giá khách sạn này rồi");
            }

            var review = _mapper.Map<DanhGia>(createReviewDto);
            review.MaNguoiDung = userId;

            _context.DanhGias.Add(review);
            await _context.SaveChangesAsync();

            await UpdateHotelAverageRatingAsync(createReviewDto.MaKhachSan);

            return await GetReviewByIdAsync(review.MaDanhGia) ??
                   throw new InvalidOperationException("Không thể tạo đánh giá");
        }

        public async Task<DanhGiaDto?> UpdateReviewAsync(int id, int userId, UpdateDanhGiaDto updateReviewDto)
        {
            var existingReview = await _context.DanhGias
                .FirstOrDefaultAsync(r => r.MaDanhGia == id && r.MaNguoiDung == userId);

            if (existingReview == null)
            {
                return null;
            }

            _mapper.Map(updateReviewDto, existingReview);
            await _context.SaveChangesAsync();

            await UpdateHotelAverageRatingAsync(existingReview.MaKhachSan);

            return await GetReviewByIdAsync(id);
        }

        public async Task<bool> DeleteReviewAsync(int id, int userId)
        {
            var review = await _context.DanhGias
                .FirstOrDefaultAsync(r => r.MaDanhGia == id && r.MaNguoiDung == userId);

            if (review == null)
            {
                return false;
            }

            var hotelId = review.MaKhachSan;
            _context.DanhGias.Remove(review);
            await _context.SaveChangesAsync();

            await UpdateHotelAverageRatingAsync(hotelId);

            return true;
        }

        public async Task<ReviewSummaryDto?> GetReviewSummaryAsync(int hotelId)
        {
            var hotel = await _context.KhachSans.FindAsync(hotelId);
            if (hotel == null)
            {
                return null;
            }

            var reviews = await _context.DanhGias
                .Where(r => r.MaKhachSan == hotelId && r.DiemDanhGia.HasValue)
                .ToListAsync();

            var summary = new ReviewSummaryDto
            {
                MaKhachSan = hotelId,
                TenKhachSan = hotel.TenKhachSan,
                TongSoDanhGia = reviews.Count,
                DanhGiaTrungBinh = reviews.Any() ? (decimal)reviews.Average(r => r.DiemDanhGia!.Value) : 0
            };

            for (int i = 1; i <= 5; i++)
            {
                summary.PhanBoSao[i] = reviews.Count(r => r.DiemDanhGia == i);
            }

            return summary;
        }

        public async Task<bool> CanUserReviewHotelAsync(int userId, int hotelId)
        {
            return await _context.DatPhongs
                .AnyAsync(b => b.MaNguoiDung == userId &&
                              b.Phong.LoaiPhong.MaKhachSan == hotelId &&
                              b.TrangThai == "Completed" &&
                              b.NgayTraPhong < DateTime.Now);
        }

        public async Task UpdateHotelAverageRatingAsync(int hotelId)
        {
            var hotel = await _context.KhachSans.FindAsync(hotelId);
            if (hotel == null)
            {
                return;
            }

            var averageRating = await _context.DanhGias
                .Where(r => r.MaKhachSan == hotelId && r.DiemDanhGia.HasValue)
                .AverageAsync(r => (decimal?)r.DiemDanhGia) ?? 0;

            hotel.DanhGiaTrungBinh = Math.Round(averageRating, 1);
            await _context.SaveChangesAsync();
        }
    }
    
    
}