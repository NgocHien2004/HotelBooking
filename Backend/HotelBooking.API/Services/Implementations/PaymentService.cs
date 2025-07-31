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
    public class PaymentService : IPaymentService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;

        public PaymentService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PaymentDto>> GetPaymentsByBookingAsync(int bookingId)
        {
            var payments = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .Where(p => p.MaDatPhong == bookingId)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<PaymentDto>>(payments);
        }

        public async Task<PaymentDto> GetPaymentByIdAsync(int id)
        {
            var payment = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .FirstOrDefaultAsync(p => p.MaThanhToan == id);
                
            if (payment == null)
            {
                throw new ArgumentException($"Không tìm thấy thanh toán với ID: {id}");
            }
            
            return _mapper.Map<PaymentDto>(payment);
        }

        public async Task<PaymentDto> CreatePaymentAsync(PaymentCreateDto paymentDto)
        {
            // Validate booking exists
            var booking = await _context.DatPhongs
                .Include(b => b.ThanhToans)
                .FirstOrDefaultAsync(b => b.MaDatPhong == paymentDto.MaDatPhong);
                
            if (booking == null)
            {
                throw new ArgumentException($"Không tìm thấy đặt phòng với ID: {paymentDto.MaDatPhong}");
            }

            // Check if booking is not cancelled
            if (booking.TrangThai == "Cancelled")
            {
                throw new InvalidOperationException("Không thể thanh toán cho đặt phòng đã bị hủy");
            }

            // Check if amount doesn't exceed remaining balance
            var totalPaid = booking.ThanhToans.Sum(p => p.SoTien);
            var remaining = booking.TongTien - totalPaid;
            
            if (paymentDto.SoTien > remaining)
            {
                throw new ArgumentException($"Số tiền thanh toán ({paymentDto.SoTien}) vượt quá số tiền còn lại ({remaining})");
            }

            var payment = _mapper.Map<ThanhToan>(paymentDto);
            _context.ThanhToans.Add(payment);
            
            // Update booking status if fully paid
            if (totalPaid + paymentDto.SoTien >= booking.TongTien)
            {
                booking.TrangThai = "Confirmed";
            }
            
            await _context.SaveChangesAsync();
            
            // Reload with includes
            payment = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .FirstAsync(p => p.MaThanhToan == payment.MaThanhToan);
                
            return _mapper.Map<PaymentDto>(payment);
        }

        public async Task<PaymentSummaryDto> GetPaymentSummaryAsync(int bookingId)
        {
            var booking = await _context.DatPhongs
                .Include(b => b.ThanhToans)
                .FirstOrDefaultAsync(b => b.MaDatPhong == bookingId);
                
            if (booking == null)
            {
                throw new ArgumentException($"Không tìm thấy đặt phòng với ID: {bookingId}");
            }

            var totalPaid = booking.ThanhToans.Sum(p => p.SoTien);
            var remaining = booking.TongTien - totalPaid;
            
            return new PaymentSummaryDto
            {
                TotalAmount = booking.TongTien,
                PaidAmount = totalPaid,
                RemainingAmount = remaining,
                PaymentStatus = remaining <= 0 ? "Fully Paid" : "Partially Paid"
            };
        }
    }
}