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
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(lp => lp.KhachSan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DatPhongDto>>(bookings);
        }

        public async Task<DatPhongDto?> GetBookingByIdAsync(int id)
        {
            var booking = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(lp => lp.KhachSan)
                .FirstOrDefaultAsync(b => b.MaDatPhong == id);

            return booking == null ? null : _mapper.Map<DatPhongDto>(booking);
        }

        public async Task<IEnumerable<DatPhongDto>> GetBookingsByUserAsync(int userId)
        {
            var bookings = await _context.DatPhongs
                .Include(b => b.NguoiDung)
                .Include(b => b.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(lp => lp.KhachSan)
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
                    .ThenInclude(p => p.LoaiPhong)
                        .ThenInclude(lp => lp.KhachSan)
                .Where(b => b.Phong.LoaiPhong.MaKhachSan == hotelId)
                .OrderByDescending(b => b.NgayDat)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DatPhongDto>>(bookings);
        }

        public async Task<DatPhongDto> CreateBookingAsync(int userId, CreateDatPhongDto createBookingDto)
        {
            if (createBookingDto.NgayNhanPhong >= createBookingDto.NgayTraPhong)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            if (createBookingDto.NgayNhanPhong < DateTime.Today)
            {
                throw new ArgumentException("Ngày nhận phòng không thể là ngày quá khứ");
            }

            var isAvailable = await _roomService.IsRoomAvailableAsync(
                createBookingDto.MaPhong,
                createBookingDto.NgayNhanPhong,
                createBookingDto.NgayTraPhong);

            if (!isAvailable)
            {
                throw new InvalidOperationException("Phòng không có sẵn trong thời gian này");
            }

            var total = await CalculateBookingTotalAsync(
                createBookingDto.MaPhong,
                createBookingDto.NgayNhanPhong,
                createBookingDto.NgayTraPhong);

            var booking = _mapper.Map<DatPhong>(createBookingDto);
            booking.MaNguoiDung = userId;
            booking.TongTien = total;
            booking.NgayDat = DateTime.Now;
            booking.TrangThai = "Pending";

            _context.DatPhongs.Add(booking);
            await _context.SaveChangesAsync();

            var result = await GetBookingByIdAsync(booking.MaDatPhong);
            return result ?? throw new InvalidOperationException("Failed to create booking");
        }

        public async Task<DatPhongDto?> UpdateBookingAsync(int id, UpdateDatPhongDto updateBookingDto)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null) return null;

            if (updateBookingDto.NgayNhanPhong.HasValue && updateBookingDto.NgayTraPhong.HasValue)
            {
                if (updateBookingDto.NgayNhanPhong >= updateBookingDto.NgayTraPhong)
                {
                    throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
                }

                if (updateBookingDto.NgayNhanPhong < DateTime.Today && booking.TrangThai == "Pending")
                {
                    throw new ArgumentException("Ngày nhận phòng không thể là ngày quá khứ");
                }

                var isAvailable = await _roomService.IsRoomAvailableAsync(
                    booking.MaPhong,
                    updateBookingDto.NgayNhanPhong.Value,
                    updateBookingDto.NgayTraPhong.Value,
                    id);

                if (!isAvailable)
                {
                    throw new InvalidOperationException("Phòng không có sẵn trong thời gian này");
                }

                booking.TongTien = await CalculateBookingTotalAsync(
                    booking.MaPhong,
                    updateBookingDto.NgayNhanPhong.Value,
                    updateBookingDto.NgayTraPhong.Value);
            }

            if (updateBookingDto.NgayNhanPhong.HasValue)
                booking.NgayNhanPhong = updateBookingDto.NgayNhanPhong.Value;
            
            if (updateBookingDto.NgayTraPhong.HasValue)
                booking.NgayTraPhong = updateBookingDto.NgayTraPhong.Value;
            
            if (!string.IsNullOrEmpty(updateBookingDto.TrangThai))
                booking.TrangThai = updateBookingDto.TrangThai;

            await _context.SaveChangesAsync();
            
            return await GetBookingByIdAsync(id);
        }

        public async Task<DatPhongDto?> UpdateBookingStatusAsync(int id, string status)
        {
            var booking = await _context.DatPhongs.FindAsync(id);
            if (booking == null) return null;

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
                throw new ArgumentException("Không tìm thấy phòng");

            var nights = (checkOut - checkIn).Days;
            if (nights <= 0)
                throw new ArgumentException("Thời gian đặt phòng không hợp lệ");

            return room.LoaiPhong.GiaMotDem * nights;
        }

        public async Task<bool> CanCancelBookingAsync(int bookingId, int userId)
        {
            var booking = await _context.DatPhongs
                .FirstOrDefaultAsync(b => b.MaDatPhong == bookingId && b.MaNguoiDung == userId);

            if (booking == null) return false;

            if (booking.TrangThai == "Cancelled" || booking.TrangThai == "Completed")
                return false;

            var hoursUntilCheckIn = (booking.NgayNhanPhong - DateTime.Now).TotalHours;
            return hoursUntilCheckIn >= 24;
        }

        public async Task<decimal> GetTotalPaidAmountAsync(int bookingId)
        {
            return await _context.ThanhToans
                .Where(p => p.MaDatPhong == bookingId)
                .SumAsync(p => p.SoTien);
        }

        public async Task<DatPhongDto?> UpdateBookingStatusBasedOnPaymentAsync(int bookingId)
        {
            var booking = await _context.DatPhongs
                .FirstOrDefaultAsync(b => b.MaDatPhong == bookingId);
            
            if (booking == null)
                return null;

            var totalPaid = await GetTotalPaidAmountAsync(bookingId);
            
            string newStatus = booking.TrangThai;
            
            // Chỉ update status nếu booking đang ở trạng thái có thể thay đổi
            if (booking.TrangThai == "Confirmed" || booking.TrangThai == "Waiting Payment")
            {
                if (totalPaid >= booking.TongTien)
                {
                    newStatus = "Completed";
                }
                else if (totalPaid > 0)
                {
                    newStatus = "Waiting Payment";
                }
                else
                {
                    newStatus = "Confirmed";
                }
            }

            if (newStatus != booking.TrangThai)
            {
                booking.TrangThai = newStatus;
                await _context.SaveChangesAsync();
            }

            return await GetBookingByIdAsync(bookingId);
        }
    }
}