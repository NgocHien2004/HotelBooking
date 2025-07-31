using System;
using System.Collections.Generic;

namespace HotelBooking.API.Models.DTOs
{
    public class HotelDto
    {
        public int MaKhachSan { get; set; }
        public string TenKhachSan { get; set; } = string.Empty;
        public string DiaChi { get; set; } = string.Empty;
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
        public decimal? DanhGiaTrungBinh { get; set; }
        public DateTime NgayTao { get; set; }
        public List<string> HinhAnhs { get; set; } = new List<string>();
    }

    public class HotelCreateDto
    {
        public string TenKhachSan { get; set; } = string.Empty;
        public string DiaChi { get; set; } = string.Empty;
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
    }

    public class HotelUpdateDto
    {
        public string? TenKhachSan { get; set; }
        public string? DiaChi { get; set; }
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
    }

    public class HotelImageDto
    {
        public int MaAnh { get; set; }
        public string DuongDanAnh { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }

    public class HotelImageCreateDto
    {
        public int MaKhachSan { get; set; }
        public string DuongDanAnh { get; set; } = string.Empty;
        public string? MoTa { get; set; }
    }
}