// File: Backend/HotelBooking.API/DTOs/LoaiPhongDto.cs
namespace HotelBooking.API.DTOs
{
    public class LoaiPhongDto
    {
        public int MaLoaiPhong { get; set; }
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
        
        // Navigation properties
        public string? TenKhachSan { get; set; }
        public List<PhongDto>? Phongs { get; set; }
    }

    public class CreateLoaiPhongDto
    {
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
    }

    public class UpdateLoaiPhongDto
    {
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
    }
}

// File: Backend/HotelBooking.API/DTOs/PhongDto.cs
namespace HotelBooking.API.DTOs
{
    public class PhongDto
    {
        public int MaPhong { get; set; }
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = "Available";
        
        // Navigation properties
        public LoaiPhongDto? LoaiPhong { get; set; }
    }

    public class CreatePhongDto
    {
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = "Available";
    }

    public class UpdatePhongDto
    {
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = "Available";
    }
}

// File: Backend/HotelBooking.API/DTOs/RoomAvailabilityDto.cs
namespace HotelBooking.API.DTOs
{
    public class RoomAvailabilityDto
    {
        public int HotelId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int? NumberOfGuests { get; set; }
    }
}