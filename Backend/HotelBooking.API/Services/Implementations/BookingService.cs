using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Models.Entities;
using HotelBooking.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HotelBooking.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;

        public BookingService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<BookingDto>> GetAllBookingsAsync()
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<BookingDto>>(bookings);
        }

        public async Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId)
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .Where(b => b.MaNguoiDung == userId)
                .OrderByDescending(b => b.NgayDat)
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<BookingDto>>(bookings);
        }

        public async Task<BookingDto> GetBookingByIdAsync(int id)
        {
            var booking = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .FirstOrDefaultAsync(b => b.MaDatPhong == id);
                
            if (booking == null)
            {
                throw new ArgumentException($"Không tìm thấy đặt phòng với ID: {id}");
            }
            
            return _mapper.Map<BookingDto>(booking);
        }

        public async Task<BookingDto> CreateBookingAsync(int userId, BookingCreateDto bookingDto)
        {
            // Validate dates
            if (bookingDto.NgayNhanPhong >= bookingDto.NgayTraPhong)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            if (bookingDto.NgayNhanPhong < DateTime.Today)
            {
                throw new ArgumentException("Ngày nhận phòng không thể trong quá khứ");
            }

            // Check room availability
            var isAvailable = await IsRoomAvailableAsync(
                bookingDto.MaPhong, 
                bookingDto.NgayNhanPhong, 
                bookingDto.NgayTraPhong);
                
            if (!isAvailable)
            {
                throw new ArgumentException("Phòng đã được đặt trong khoảng thời gian này");
            }

            // Calculate total price
            var totalPrice = await CalculateTotalPriceAsync(
                bookingDto.MaPhong, 
                bookingDto.NgayNhanPhong, 
                bookingDto.NgayTraPhong);

            var booking = _mapper.Map<DatPhong>(bookingDto);
            booking.MaNguoiDung = userId;
            booking.TongTien = totalPrice;
            booking.TrangThai = "Pending";
            
            _context.DatPhongs.Add(booking);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            booking = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .FirstAsync(b => b.MaDatPhong == booking.MaDatPhong);
                
            return _mapper.Map<BookingDto>(booking);
        }

        public async Task<BookingDto> UpdateBookingAsync(int id, BookingUpdateDto bookingDto)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null)
            {
                throw new ArgumentException($"Không tìm thấy đặt phòng với ID: {id}");
            }

            // If dates are being updated, recalculate total price
            if (bookingDto.NgayNhanPhong != default || bookingDto.NgayTraPhong != default)
            {
                var checkIn = bookingDto.NgayNhanPhong != default ? bookingDto.NgayNhanPhong : booking.NgayNhanPhong;
                var checkOut = bookingDto.NgayTraPhong != default ? bookingDto.NgayTraPhong : booking.NgayTraPhong;
                
                booking.TongTien = await CalculateTotalPriceAsync(booking.MaPhong, checkIn, checkOut);
            }

            _mapper.Map(bookingDto, booking);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            booking = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(rt => rt.KhachSan)
                .FirstAsync(b => b.MaDatPhong == id);
                
            return _mapper.Map<BookingDto>(booking);
        }

        public async Task<bool> CancelBookingAsync(int id)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null)
            {
                throw new ArgumentException($"Không tìm thấy đặt phòng với ID: {id}");
            }

            if (booking.TrangThai == "Completed")
            {
                throw new InvalidOperationException("Không thể hủy đặt phòng đã hoàn thành");
            }

            booking.TrangThai = "Cancelled";
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<decimal> CalculateTotalPriceAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            var room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .FirstOrDefaultAsync(r => r.MaPhong == roomId);
                
            if (room == null)
            {
                throw new ArgumentException($"Không tìm thấy phòng với ID: {roomId}");
            }

            var numberOfNights = (checkOut - checkIn).Days;
            if (numberOfNights <= 0)
            {
                throw new ArgumentException("Số đêm phải lớn hơn 0");
            }

            return room.LoaiPhong.GiaMotDem * numberOfNights;
        }

        private async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            var conflictingBookings = await _context.DatPhongs
                .Where(b => b.MaPhong == roomId &&
                           b.TrangThai != "Cancelled" &&
                           b.NgayNhanPhong < checkOut &&
                           b.NgayTraPhong > checkIn)
                .AnyAsync();
                
            return !conflictingBookings;
        }
    }
}