using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IBookingService _bookingService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IPaymentService paymentService, IBookingService bookingService, ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _bookingService = bookingService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ThanhToanDto>>> GetAllPayments()
        {
            try
            {
                var payments = await _paymentService.GetAllPaymentsAsync();
                return Ok(new { success = true, data = payments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all payments");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("my-payments")]
        public async Task<ActionResult<IEnumerable<ThanhToanDto>>> GetMyPayments()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var userBookings = await _bookingService.GetBookingsByUserAsync(currentUserId);
                var allPayments = new List<ThanhToanDto>();

                foreach (var booking in userBookings)
                {
                    var payments = await _paymentService.GetPaymentsByBookingAsync(booking.MaDatPhong);
                    allPayments.AddRange(payments);
                }

                var sortedPayments = allPayments.OrderByDescending(p => p.NgayThanhToan);
                return Ok(new { success = true, data = sortedPayments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user payments");
                return StatusCode(500, new { success = false, message = "Lỗi tải lịch sử thanh toán" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ThanhToanDto>> GetPayment(int id)
        {
            try
            {
                var payment = await _paymentService.GetPaymentByIdAsync(id);
                if (payment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin thanh toán" });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                var booking = await _bookingService.GetBookingByIdAsync(payment.MaDatPhong);
                if (booking != null && currentUserId != booking.MaNguoiDung && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                return Ok(new { success = true, data = payment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment {PaymentId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("user-payment")]
        public async Task<ActionResult<ThanhToanDto>> CreateUserPayment(CreateThanhToanDto createPaymentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = GetCurrentUserId();

                var booking = await _bookingService.GetBookingByIdAsync(createPaymentDto.MaDatPhong);
                if (booking == null)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                if (booking.MaNguoiDung != currentUserId)
                {
                    return Forbid();
                }

                var existingPayments = await _paymentService.GetPaymentsByBookingAsync(createPaymentDto.MaDatPhong);
                var totalPaid = existingPayments.Sum(p => p.SoTien);
                var remainingAmount = booking.TongTien - totalPaid;

                if (createPaymentDto.SoTien > remainingAmount)
                {
                    return BadRequest(new { success = false, message = $"Số tiền thanh toán không được vượt quá số tiền còn lại: {remainingAmount:N0} VNĐ" });
                }

                if (createPaymentDto.SoTien <= 0)
                {
                    return BadRequest(new { success = false, message = "Số tiền thanh toán phải lớn hơn 0" });
                }

                var payment = await _paymentService.CreatePaymentAsync(createPaymentDto);
                
                return CreatedAtAction(nameof(GetPayment), new { id = payment.MaThanhToan }, 
                    new { success = true, data = payment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user payment");
                return StatusCode(500, new { success = false, message = "Lỗi tạo thanh toán" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ThanhToanDto>> CreatePayment(CreateThanhToanDto createPaymentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var booking = await _bookingService.GetBookingByIdAsync(createPaymentDto.MaDatPhong);
                if (booking == null)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                var payment = await _paymentService.CreatePaymentAsync(createPaymentDto);
                
                return CreatedAtAction(nameof(GetPayment), new { id = payment.MaThanhToan }, 
                    new { success = true, data = payment });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, new { success = false, message = "Lỗi tạo thanh toán" });
            }
        }

        [HttpPost("mark-paid/{bookingId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> MarkBookingAsPaid(int bookingId)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(bookingId);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đặt phòng" });
                }

                var updatedBooking = await _bookingService.UpdateBookingStatusAsync(bookingId, "Paid");
                if (updatedBooking == null)
                {
                    return BadRequest(new { success = false, message = "Không thể cập nhật trạng thái" });
                }

                return Ok(new { success = true, message = "Đã đánh dấu đặt phòng là đã thanh toán", data = updatedBooking });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking booking {BookingId} as paid", bookingId);
                return StatusCode(500, new { success = false, message = "Lỗi cập nhật trạng thái" });
            }
        }

        [HttpPost("{id}/process")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ProcessPayment(int id)
        {
            try
            {
                var result = await _paymentService.ProcessPaymentAsync(id);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể xử lý thanh toán" });
                }

                return Ok(new { success = true, message = "Đã xử lý thanh toán thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment {PaymentId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi xử lý thanh toán" });
            }
        }

        [HttpPost("{id}/refund")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RefundPayment(int id)
        {
            try
            {
                var result = await _paymentService.RefundPaymentAsync(id);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể hoàn tiền" });
                }

                return Ok(new { success = true, message = "Đã hoàn tiền thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refunding payment {PaymentId}", id);
                return StatusCode(500, new { success = false, message = "Lỗi hoàn tiền" });
            }
        }

        [HttpGet("payment-methods")]
        public ActionResult<IEnumerable<PaymentMethodDto>> GetPaymentMethods()
        {
            var paymentMethods = new List<PaymentMethodDto>
            {
                new PaymentMethodDto { Value = "Cash", Label = "Tiền mặt" },
                new PaymentMethodDto { Value = "Credit Card", Label = "Thẻ tín dụng" },
                new PaymentMethodDto { Value = "Bank Transfer", Label = "Chuyển khoản ngân hàng" },
                new PaymentMethodDto { Value = "E-Wallet", Label = "Ví điện tử" }
            };

            return Ok(new { success = true, data = paymentMethods });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "";
        }
    }
}