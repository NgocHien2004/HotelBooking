using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly ILogger<UploadController> _logger;
        private readonly string _hotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
        private readonly string _roomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";

        public UploadController(ILogger<UploadController> logger)
        {
            _logger = logger;
            
            // Ensure directories exist
            if (!Directory.Exists(_hotelsPath))
                Directory.CreateDirectory(_hotelsPath);
            if (!Directory.Exists(_roomsPath))
                Directory.CreateDirectory(_roomsPath);
        }

        [HttpPost("hotels/{hotelId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadHotelImages(int hotelId, List<IFormFile> images)
        {
            try
            {
                if (images == null || images.Count == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file nào được chọn" });
                }

                var uploadedFiles = new List<string>();

                foreach (var image in images)
                {
                    if (image.Length > 0)
                    {
                        // Validate file type
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                        
                        if (!allowedExtensions.Contains(extension))
                        {
                            continue; // Skip invalid files
                        }

                        // Generate unique filename
                        var fileName = $"hotel_{hotelId}_{Guid.NewGuid()}{extension}";
                        var filePath = Path.Combine(_hotelsPath, fileName);

                        // Save file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        uploadedFiles.Add($"/uploads/hotels/{fileName}");
                        _logger.LogInformation($"Uploaded hotel image: {fileName}");
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Đã upload {uploadedFiles.Count} ảnh thành công",
                    files = uploadedFiles 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading hotel images");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("rooms/{roomId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadRoomImages(int roomId, List<IFormFile> images)
        {
            try
            {
                if (images == null || images.Count == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file nào được chọn" });
                }

                var uploadedFiles = new List<string>();

                foreach (var image in images)
                {
                    if (image.Length > 0)
                    {
                        // Validate file type
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                        
                        if (!allowedExtensions.Contains(extension))
                        {
                            continue;
                        }

                        // Generate unique filename
                        var fileName = $"room_{roomId}_{Guid.NewGuid()}{extension}";
                        var filePath = Path.Combine(_roomsPath, fileName);

                        // Save file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        uploadedFiles.Add($"/uploads/rooms/{fileName}");
                        _logger.LogInformation($"Uploaded room image: {fileName}");
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Đã upload {uploadedFiles.Count} ảnh thành công",
                    files = uploadedFiles 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading room images");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}