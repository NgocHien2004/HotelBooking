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
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<ThanhToanDto?> GetPaymentByIdAsync(int id)
        {
            var payment = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .FirstOrDefaultAsync(p => p.MaThanhToan == id);

            return payment == null ? null : _mapper.Map<ThanhToanDto>(payment);
        }

        public async Task<IEnumerable<ThanhToanDto>> GetPaymentsByBookingAsync(int bookingId)
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

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<IEnumerable<ThanhToanDto>> GetPaymentsByUserAsync(int userId)
        {
            var payments = await _context.ThanhToans
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.NguoiDung)
                .Include(p => p.DatPhong)
                    .ThenInclude(b => b.Phong)
                        .ThenInclude(r => r.LoaiPhong)
                            .ThenInclude(rt => rt.KhachSan)
                .Where(p => p.DatPhong.MaNguoiDung == userId)
                .OrderByDescending(p => p.NgayThanhToan)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ThanhToanDto>>(payments);
        }

        public async Task<ThanhToanDto> CreatePaymentAsync(CreateThanhToanDto createPaymentDto)
        {
            // Validate booking exists
            var booking = await _context.DatPhongs.FindAsync(createPaymentDto.MaDatPhong);
            if (booking == null)
            {
                throw new ArgumentException("Đặt phòng không tồn tại");
            }

            // Validate payment amount
            if (createPaymentDto.SoTien <= 0)
            {
                throw new ArgumentException("Số tiền thanh toán phải lớn hơn 0");
            }

            // Check if total payments would exceed booking total
            var currentTotal = await GetTotalPaymentsByBookingAsync(createPaymentDto.MaDatPhong);
            if (currentTotal + createPaymentDto.SoTien > booking.TongTien)
            {
                throw new InvalidOperationException("Tổng số tiền thanh toán không thể vượt quá tổng tiền đặt phòng");
            }

            var payment = _mapper.Map<ThanhToan>(createPaymentDto);
            _context.ThanhToans.Add(payment);
            await _context.SaveChangesAsync();

            // Update booking status if fully paid
            if (await IsBookingFullyPaidAsync(createPaymentDto.MaDatPhong))
            {
                booking.TrangThai = "Confirmed";
                await _context.SaveChangesAsync();
            }

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

            _context.ThanhToans.Remove(payment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<PaymentMethodDto>> GetPaymentMethodsAsync()
        {
            return new List<PaymentMethodDto>
            {
                new PaymentMethodDto { Value = "Cash", Label = "Tiền mặt" },
                new PaymentMethodDto { Value = "Credit Card", Label = "Thẻ tín dụng" },
                new PaymentMethodDto { Value = "Bank Transfer", Label = "Chuyển khoản ngân hàng" },
                new PaymentMethodDto { Value = "E-Wallet", Label = "Ví điện tử" }
            };
        }

        public async Task<decimal> GetTotalPaymentsByBookingAsync(int bookingId)
        {
            return await _context.ThanhToans
                .Where(p => p.MaDatPhong == bookingId)
                .SumAsync(p => p.SoTien);
        }

        public async Task<bool> IsBookingFullyPaidAsync(int bookingId)
        {
            var booking = await _context.DatPhongs.FindAsync(bookingId);
            if (booking == null)
            {
                return false;
            }

            var totalPaid = await GetTotalPaymentsByBookingAsync(bookingId);
            return totalPaid >= booking.TongTien;
        }
    }
}