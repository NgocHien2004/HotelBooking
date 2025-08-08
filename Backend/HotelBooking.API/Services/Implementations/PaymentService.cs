using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;

        public PaymentService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ThanhToanDto>> GetAllPaymentsAsync()
        {
            var payments = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.NguoiDung)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<ThanhToanDto?> GetPaymentByIdAsync(int id)
        {
            var payment = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.NguoiDung)
                .FirstOrDefaultAsync(p => p.MaThanhToan == id);

            return payment == null ? null : _mapper.Map<ThanhToanDto>(payment);
        }

        public async Task<IEnumerable<ThanhToanDto>> GetPaymentsByBookingAsync(int bookingId)
        {
            var payments = await _context.ThanhToans
                .Include(p => p.DatPhong)
                .Where(p => p.MaDatPhong == bookingId)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<ThanhToanDto> CreatePaymentAsync(CreateThanhToanDto createPaymentDto)
        {
            var payment = _mapper.Map<ThanhToan>(createPaymentDto);
            payment.NgayThanhToan = DateTime.Now;
            
            _context.ThanhToans.Add(payment);
            await _context.SaveChangesAsync();

            // Tự động cập nhật trạng thái booking nếu cần
            await UpdateBookingStatusAfterPayment(payment.MaDatPhong);

            return await GetPaymentByIdAsync(payment.MaThanhToan) ??
                   throw new InvalidOperationException("Không thể tạo thanh toán");
        }

        public async Task<bool> DeletePaymentAsync(int id)
        {
            var payment = await _context.ThanhToans.FindAsync(id);
            if (payment == null)
            {
                return false;
            }

            var bookingId = payment.MaDatPhong;
            _context.ThanhToans.Remove(payment);
            await _context.SaveChangesAsync();

            // Cập nhật lại trạng thái booking sau khi xóa thanh toán
            await UpdateBookingStatusAfterPayment(bookingId);
            return true;
        }

        private async Task UpdateBookingStatusAfterPayment(int bookingId)
        {
            var booking = await _context.DatPhongs
                .Include(d => d.ThanhToans)
                .FirstOrDefaultAsync(d => d.MaDatPhong == bookingId);

            if (booking == null) return;

            var totalPaid = booking.ThanhToans.Sum(t => t.SoTien);
            
            // Chỉ cập nhật trạng thái nếu booking đã được confirm
            if (booking.TrangThai == "Confirmed")
            {
                if (totalPaid >= booking.TongTien)
                {
                    booking.TrangThai = "Completed";
                }
                // Nếu thanh toán chưa đủ thì vẫn giữ trạng thái "Confirmed"
            }

            await _context.SaveChangesAsync();
        }
    }
}