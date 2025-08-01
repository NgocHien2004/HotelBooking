using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly IRoomService _roomService;

        public BookingService(HotelBookingContext context, IMapper mapper, IRoomService roomService)
        {
            _context = context;
            _mapper = mapper;
            _roomService = roomService;
        }

        public async Task<IEnumerable<DatPhongDto>> GetAllBookingsAsync()
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(r => r.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .OrderByDescending(b => b.NgayDat)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DatPhongDto>>(bookings);
        }

        public async Task<DatPhongDto?> GetBookingByIdAsync(int id)
        {
            var booking = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(r => r.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .FirstOrDefaultAsync(b => b.MaDatPhong == id);

            return booking == null ? null : _mapper.Map<DatPhongDto>(booking);
        }

        public async Task<IEnumerable<DatPhongDto>> GetBookingsByUserAsync(int userId)
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(r => r.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .Where(b => b.MaNguoiDung == userId)
                .OrderByDescending(b => b.NgayDat)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DatPhongDto>>(bookings);
        }

        public async Task<IEnumerable<DatPhongDto>> GetBookingsByHotelAsync(int hotelId)
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(r => r.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .Where(b => b.Phong.LoaiPhong.MaKhachSan == hotelId)
                .OrderByDescending(b => b.NgayDat)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DatPhongDto>>(bookings);
        }

        public async Task<DatPhongDto> CreateBookingAsync(int userId, CreateDatPhongDto createBookingDto)
        {
            // Validate dates
            if (createBookingDto.NgayNhanPhong >= createBookingDto.NgayTraPhong)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            if (createBookingDto.NgayNhanPhong < DateTime.Today)
            {
                throw new ArgumentException("Ngày nhận phòng không thể là ngày trong quá khứ");
            }

            // Check room availability
            var isAvailable = await _roomService.IsRoomAvailableAsync(
                createBookingDto.MaPhong, 
                createBookingDto.NgayNhanPhong, 
                createBookingDto.NgayTraPhong);

            if (!isAvailable)
            {
                throw new InvalidOperationException("Phòng không có sẵn trong thời gian đã chọn");
            }

            // Calculate total amount
            var totalAmount = await CalculateBookingTotalAsync(
                createBookingDto.MaPhong, 
                createBookingDto.NgayNhanPhong, 
                createBookingDto.NgayTraPhong);

            var booking = _mapper.Map<DatPhong>(createBookingDto);
            booking.MaNguoiDung = userId;
            booking.TongTien = totalAmount;

            _context.DatPhongs.Add(booking);
            await _context.SaveChangesAsync();

            return await GetBookingByIdAsync(booking.MaDatPhong) ?? 
                   throw new InvalidOperationException("Không thể tạo đặt phòng");
        }

        public async Task<DatPhongDto?> UpdateBookingAsync(int id, UpdateDatPhongDto updateBookingDto)
        {
            var existingBooking = await _context.DatPhongs.FindAsync(id);
            if (existingBooking == null)
            {
                return null;
            }

            // Validate dates
            if (updateBookingDto.NgayNhanPhong >= updateBookingDto.NgayTraPhong)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            // Check if dates are changing and validate availability
            if (existingBooking.NgayNhanPhong != updateBookingDto.NgayNhanPhong ||
                existingBooking.NgayTraPhong != updateBookingDto.NgayTraPhong)
            {
                var isAvailable = await _roomService.IsRoomAvailableAsync(
                    existingBooking.MaPhong,
                    updateBookingDto.NgayNhanPhong,
                    updateBookingDto.NgayTraPhong);

                if (!isAvailable)
                {
                    throw new InvalidOperationException("Phòng không có sẵn trong thời gian mới");
                }

                // Recalculate total
                existingBooking.TongTien = await CalculateBookingTotalAsync(
                    existingBooking.MaPhong,
                    updateBookingDto.NgayNhanPhong,
                    updateBookingDto.NgayTraPhong);
            }

            existingBooking.NgayNhanPhong = updateBookingDto.NgayNhanPhong;
            existingBooking.NgayTraPhong = updateBookingDto.NgayTraPhong;
            
            if (!string.IsNullOrEmpty(updateBookingDto.TrangThai))
            {
                existingBooking.TrangThai = updateBookingDto.TrangThai;
            }

            await _context.SaveChangesAsync();
            return await GetBookingByIdAsync(id);
        }

        public async Task<bool> DeleteBookingAsync(int id)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null)
            {
                return false;
            }

            _context.DatPhongs.Remove(booking);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DatPhongDto?> UpdateBookingStatusAsync(int id, string status)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null)
            {
                return null;
            }

            booking.TrangThai = status;
            await _context.SaveChangesAsync();

            return await GetBookingByIdAsync(id);
        }

        public async Task<decimal> CalculateBookingTotalAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            var room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .FirstOrDefaultAsync(r => r.MaPhong == roomId);

            if (room == null)
            {
                throw new ArgumentException("Phòng không tồn tại");
            }

            var numberOfNights = (checkOut - checkIn).Days;
            return room.LoaiPhong.GiaMotDem * numberOfNights;
        }

        public async Task<bool> CanCancelBookingAsync(int bookingId, int userId)
        {
            var booking = await _context.DatPhongs
                .FirstOrDefaultAsync(b => b.MaDatPhong == bookingId && b.MaNguoiDung == userId);

            if (booking == null)
            {
                return false;
            }

            // Can cancel if booking is pending or confirmed and check-in is at least 24 hours away
            return (booking.TrangThai == "Pending" || booking.TrangThai == "Confirmed") &&
                   booking.NgayNhanPhong > DateTime.Now.AddDays(1);
        }
    }
}