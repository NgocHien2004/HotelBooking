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
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.Phong)
                        .ThenInclude(ph => ph.LoaiPhong)
                            .ThenInclude(lp => lp.KhachSan)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<ThanhToanDto?> GetPaymentByIdAsync(int id)
        {
            var payment = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.Phong)
                        .ThenInclude(ph => ph.LoaiPhong)
                            .ThenInclude(lp => lp.KhachSan)
                .FirstOrDefaultAsync(p => p.MaThanhToan == id);

            return payment == null ? null : _mapper.Map<ThanhToanDto>(payment);
        }

        public async Task<IEnumerable<ThanhToanDto>> GetPaymentsByBookingAsync(int bookingId)
        {
            var payments = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(d => d.Phong)
                        .ThenInclude(ph => ph.LoaiPhong)
                            .ThenInclude(lp => lp.KhachSan)
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

            // Auto-update booking status based on payment
            var booking = await _context.DatPhongs.FindAsync(payment.MaDatPhong);
            if (booking != null)
            {
                var totalPaid = await _context.ThanhToans
                    .Where(p => p.MaDatPhong == booking.MaDatPhong)
                    .SumAsync(p => p.SoTien);

                // Chỉ update nếu booking ở trạng thái cho phép
                if (booking.TrangThai == "Pending" || booking.TrangThai == "Confirmed" || booking.TrangThai == "Waiting Payment")
                {
                    if (totalPaid >= booking.TongTien)
                    {
                        booking.TrangThai = "Completed";
                    }
                    else if (totalPaid > 0 && booking.TrangThai == "Confirmed")
                    {
                        booking.TrangThai = "Waiting Payment";
                    }
                    
                    await _context.SaveChangesAsync();
                }
            }

            return await GetPaymentByIdAsync(payment.MaThanhToan) ?? 
                   throw new InvalidOperationException("Failed to retrieve created payment");
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