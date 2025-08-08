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

        public BookingService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<DatPhongDto>> GetAllBookingsAsync()
        {
            var bookings = await _context.DatPhongs
                .Include(d => d.NguoiDung)
                .Include(d => d.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                    .ThenInclude(lp => lp.KhachSan)
                .Include(d => d.ThanhToans)
                .OrderByDescending(d => d.NgayDat)
                .ToListAsync();

            var bookingDtos = _mapper.Map<List<DatPhongDto>>(bookings);

            // Tính toán số tiền đã thanh toán và số tiền còn lại
            foreach (var booking in bookingDtos)
            {
                var originalBooking = bookings.FirstOrDefault(b => b.MaDatPhong == booking.MaDatPhong);
                if (originalBooking != null)
                {
                    booking.TotalPaid = originalBooking.ThanhToans.Sum(t => t.SoTien);
                    booking.RemainingAmount = booking.TongTien - booking.TotalPaid;
                }
            }

            return bookingDtos;
        }

        public async Task<DatPhongDto?> GetBookingByIdAsync(int id)
        {
            var booking = await _context.DatPhongs
                .Include(d => d.NguoiDung)
                .Include(d => d.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                    .ThenInclude(lp => lp.KhachSan)
                .Include(d => d.ThanhToans)
                .FirstOrDefaultAsync(d => d.MaDatPhong == id);

            if (booking == null) return null;

            var bookingDto = _mapper.Map<DatPhongDto>(booking);
            bookingDto.TotalPaid = booking.ThanhToans.Sum(t => t.SoTien);
            bookingDto.RemainingAmount = bookingDto.TongTien - bookingDto.TotalPaid;

            return bookingDto;
        }

        public async Task<IEnumerable<DatPhongDto>> GetBookingsByUserAsync(int userId)
        {
            var bookings = await _context.DatPhongs
                .Include(d => d.NguoiDung)
                .Include(d => d.Phong)
                    .ThenInclude(p => p.LoaiPhong)
                    .ThenInclude(lp => lp.KhachSan)
                .Include(d => d.ThanhToans)
                .Where(d => d.MaNguoiDung == userId)
                .OrderByDescending(d => d.NgayDat)
                .ToListAsync();

            var bookingDtos = _mapper.Map<List<DatPhongDto>>(bookings);

            // Tính toán số tiền đã thanh toán và số tiền còn lại
            foreach (var booking in bookingDtos)
            {
                var originalBooking = bookings.FirstOrDefault(b => b.MaDatPhong == booking.MaDatPhong);
                if (originalBooking != null)
                {
                    booking.TotalPaid = originalBooking.ThanhToans.Sum(t => t.SoTien);
                    booking.RemainingAmount = booking.TongTien - booking.TotalPaid;
                }
            }

            return bookingDtos;
        }

        public async Task<DatPhongDto> CreateBookingAsync(CreateDatPhongDto createBookingDto, int userId)
        {
            var room = await _context.Phongs
                .Include(p => p.LoaiPhong)
                .FirstOrDefaultAsync(p => p.MaPhong == createBookingDto.MaPhong);

            if (room == null)
            {
                throw new ArgumentException("Phòng không tồn tại");
            }

            // Kiểm tra phòng có trống trong khoảng thời gian đó không
            var isRoomAvailable = await IsRoomAvailableAsync(
                createBookingDto.MaPhong,
                createBookingDto.NgayNhanPhong,
                createBookingDto.NgayTraPhong
            );

            if (!isRoomAvailable)
            {
                throw new InvalidOperationException("Phòng không có sẵn trong thời gian này");
            }

            var booking = _mapper.Map<DatPhong>(createBookingDto);
            booking.MaNguoiDung = userId;
            booking.TrangThai = "Pending"; // Trạng thái ban đầu là Pending
            booking.NgayDat = DateTime.Now;

            // Tính tổng tiền
            var numberOfNights = (createBookingDto.NgayTraPhong - createBookingDto.NgayNhanPhong).Days;
            booking.TongTien = room.LoaiPhong.GiaMotDem * numberOfNights;

            _context.DatPhongs.Add(booking);
            await _context.SaveChangesAsync();

            return await GetBookingByIdAsync(booking.MaDatPhong) ?? throw new InvalidOperationException("Không thể tạo đặt phòng");
        }

        public async Task<DatPhongDto?> UpdateBookingAsync(int id, UpdateDatPhongDto updateBookingDto)
        {
            var existingBooking = await _context.DatPhongs.FindAsync(id);
            if (existingBooking == null)
            {
                return null;
            }

            if (updateBookingDto.NgayNhanPhong.HasValue)
            {
                existingBooking.NgayNhanPhong = updateBookingDto.NgayNhanPhong.Value;
            }

            if (updateBookingDto.NgayTraPhong.HasValue)
            {
                existingBooking.NgayTraPhong = updateBookingDto.NgayTraPhong.Value;
            }

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
            var booking = await _context.DatPhongs.Include(d => d.ThanhToans).FirstOrDefaultAsync(d => d.MaDatPhong == id);
            if (booking == null)
            {
                return null;
            }

            // Logic xử lý trạng thái mới
            if (status == "Confirmed")
            {
                // Khi admin xác nhận đặt phòng
                var totalPaid = booking.ThanhToans.Sum(t => t.SoTien);
                
                if (totalPaid >= booking.TongTien)
                {
                    // Nếu đã thanh toán đủ thì chuyển sang "Completed"
                    booking.TrangThai = "Completed";
                }
                else if (totalPaid > 0)
                {
                    // Nếu đã thanh toán một phần thì giữ "Confirmed"
                    booking.TrangThai = "Confirmed";
                }
                else
                {
                    // Nếu chưa thanh toán gì thì chuyển sang "Confirmed" và chờ thanh toán
                    booking.TrangThai = "Confirmed";
                }
            }
            else
            {
                booking.TrangThai = status;
            }

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

            return (booking.TrangThai == "Pending" || booking.TrangThai == "Confirmed") &&
                   booking.NgayNhanPhong > DateTime.Now.AddDays(1);
        }

        public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            var conflictingBookings = await _context.DatPhongs
                .Where(b => b.MaPhong == roomId &&
                           b.TrangThai != "Cancelled" &&
                           ((b.NgayNhanPhong < checkOut && b.NgayTraPhong > checkIn)))
                .CountAsync();

            return conflictingBookings == 0;
        }

        // Thêm method để tự động cập nhật trạng thái khi có thanh toán mới
        public async Task<DatPhongDto?> UpdateBookingAfterPaymentAsync(int bookingId)
        {
            var booking = await _context.DatPhongs.Include(d => d.ThanhToans).FirstOrDefaultAsync(d => d.MaDatPhong == bookingId);
            if (booking == null)
            {
                return null;
            }

            var totalPaid = booking.ThanhToans.Sum(t => t.SoTien);
            
            // Chỉ cập nhật trạng thái nếu đặt phòng đã được xác nhận
            if (booking.TrangThai == "Confirmed" && totalPaid >= booking.TongTien)
            {
                booking.TrangThai = "Completed";
                await _context.SaveChangesAsync();
            }

            return await GetBookingByIdAsync(bookingId);
        }
    }
}