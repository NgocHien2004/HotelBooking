namespace HotelBooking.API.Models.DTOs
{
    public class RoomTypeDto
    {
        public int MaLoaiPhong { get; set; }
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
        public string TenKhachSan { get; set; } = string.Empty;
    }

    public class RoomTypeCreateDto
    {
        public int MaKhachSan { get; set; }
        public string TenLoaiPhong { get; set; } = string.Empty;
        public decimal GiaMotDem { get; set; }
        public int SucChua { get; set; }
        public string? MoTa { get; set; }
    }

    public class RoomTypeUpdateDto
    {
        public string? TenLoaiPhong { get; set; }
        public decimal? GiaMotDem { get; set; }
        public int? SucChua { get; set; }
        public string? MoTa { get; set; }
    }

    public class RoomDto
    {
        public int MaPhong { get; set; }
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public RoomTypeDto? LoaiPhong { get; set; }
    }

    public class RoomCreateDto
    {
        public int MaLoaiPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public string TrangThai { get; set; } = "Available";
    }

    public class RoomUpdateDto
    {
        public string? SoPhong { get; set; }
        public string? TrangThai { get; set; }
    }

    public class RoomAvailabilityDto
    {
        public int MaPhong { get; set; }
        public string SoPhong { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
    }
}