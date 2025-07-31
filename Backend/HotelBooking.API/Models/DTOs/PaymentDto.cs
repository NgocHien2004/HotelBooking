using System;

namespace HotelBooking.API.Models.DTOs
{
    public class PaymentDto
    {
        public int MaThanhToan { get; set; }
        public int MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
        public DateTime NgayThanhToan { get; set; }
        public BookingDto DatPhong { get; set; }
    }

    public class PaymentCreateDto
    {
        public int MaDatPhong { get; set; }
        public decimal SoTien { get; set; }
        public string PhuongThuc { get; set; }
    }

    public class PaymentSummaryDto
    {
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string PaymentStatus { get; set; }
    }
}