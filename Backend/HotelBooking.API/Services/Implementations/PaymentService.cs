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

            var booking = await _context.DatPhongs.FindAsync(payment.MaDatPhong);
            if (booking != null)
            {
                var totalPaid = await _context.ThanhToans
                    .Where(p => p.MaDatPhong == booking.MaDatPhong)
                    .SumAsync(p => p.SoTien);

                if (totalPaid >= booking.TongTien)
                {
                    booking.TrangThai = "Confirmed";
                    await _context.SaveChangesAsync();
                }
            }

            return await GetPaymentByIdAsync(payment.MaThanhToan) ?? 
                throw new InvalidOperationException("Không thể tạo thanh toán");
        }

        public async Task<bool> ProcessPaymentAsync(int paymentId)
        {
            var payment = await _context.ThanhToans.FindAsync(paymentId);
            if (payment == null) return false;


            return true;
        }

        public async Task<bool> RefundPaymentAsync(int paymentId)
        {
            var payment = await _context.ThanhToans.FindAsync(paymentId);
            if (payment == null) return false;

            var refund = new ThanhToan
            {
                MaDatPhong = payment.MaDatPhong,
                SoTien = -payment.SoTien, 
                PhuongThuc = payment.PhuongThuc,
                NgayThanhToan = DateTime.Now
            };

            _context.ThanhToans.Add(refund);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}