// Backend/HotelBooking.API/DTOs/CreateKhachSanWithImagesDto.cs
using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class CreateKhachSanWithImagesDto
    {
        [Required(ErrorMessage = "Tên khách sạn là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên khách sạn không được quá 200 ký tự")]
        public string TenKhachSan { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        [StringLength(300, ErrorMessage = "Địa chỉ không được quá 300 ký tự")]
        public string DiaChi { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Thành phố không được quá 100 ký tự")]
        public string? ThanhPho { get; set; }

        public string? MoTa { get; set; }

        public List<IFormFile>? Images { get; set; }
    }
}

// Backend/HotelBooking.API/DTOs/UpdateKhachSanWithImagesDto.cs
using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class UpdateKhachSanWithImagesDto
    {
        [Required(ErrorMessage = "Tên khách sạn là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên khách sạn không được quá 200 ký tự")]
        public string TenKhachSan { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        [StringLength(300, ErrorMessage = "Địa chỉ không được quá 300 ký tự")]
        public string DiaChi { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Thành phố không được quá 100 ký tự")]
        public string? ThanhPho { get; set; }

        public string? MoTa { get; set; }

        public List<IFormFile>? Images { get; set; }
    }
}

// Backend/HotelBooking.API/DTOs/UploadHotelImagesDto.cs
using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs
{
    public class UploadHotelImagesDto
    {
        [Required(ErrorMessage = "Mã khách sạn là bắt buộc")]
        public int MaKhachSan { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn ít nhất một hình ảnh")]
        public List<IFormFile> Images { get; set; } = new List<IFormFile>();
    }
}