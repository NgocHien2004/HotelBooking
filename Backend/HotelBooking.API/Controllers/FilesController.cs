using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly ILogger<FilesController> _logger;
        private readonly IWebHostEnvironment _environment;

        public FilesController(ILogger<FilesController> logger, IWebHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        [HttpPost("upload/hotels")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadHotelImages([FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file nào được chọn" });
                }

                var uploadedFiles = new List<object>();
                var realHotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";

                // Tạo thư mục nếu chưa tồn tại
                if (!Directory.Exists(realHotelsPath))
                {
                    Directory.CreateDirectory(realHotelsPath);
                    _logger.LogInformation("Created hotels directory: " + realHotelsPath);
                }

                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        // Kiểm tra loại file
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                        
                        if (!allowedExtensions.Contains(fileExtension))
                        {
                            return BadRequest(new { 
                                success = false, 
                                message = $"File {file.FileName} không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", allowedExtensions)}" 
                            });
                        }

                        // Tạo tên file unique
                        var fileName = $"{Guid.NewGuid()}{fileExtension}";
                        var filePath = Path.Combine(realHotelsPath, fileName);

                        // Lưu file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        uploadedFiles.Add(new
                        {
                            originalName = file.FileName,
                            fileName = fileName,
                            url = $"/uploads/hotels/{fileName}",
                            size = file.Length
                        });

                        _logger.LogInformation($"Uploaded hotel image: {fileName} to {filePath}");
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Upload thành công {uploadedFiles.Count} file", 
                    files = uploadedFiles 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading hotel images");
                return StatusCode(500, new { success = false, message = "Lỗi khi upload file: " + ex.Message });
            }
        }

        [HttpPost("upload/rooms")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadRoomImages([FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file nào được chọn" });
                }

                var uploadedFiles = new List<object>();
                var realRoomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";

                // Tạo thư mục nếu chưa tồn tại
                if (!Directory.Exists(realRoomsPath))
                {
                    Directory.CreateDirectory(realRoomsPath);
                    _logger.LogInformation("Created rooms directory: " + realRoomsPath);
                }

                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        // Kiểm tra loại file
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                        
                        if (!allowedExtensions.Contains(fileExtension))
                        {
                            return BadRequest(new { 
                                success = false, 
                                message = $"File {file.FileName} không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", allowedExtensions)}" 
                            });
                        }

                        // Tạo tên file unique
                        var fileName = $"{Guid.NewGuid()}{fileExtension}";
                        var filePath = Path.Combine(realRoomsPath, fileName);

                        // Lưu file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        uploadedFiles.Add(new
                        {
                            originalName = file.FileName,
                            fileName = fileName,
                            url = $"/uploads/rooms/{fileName}",
                            size = file.Length
                        });

                        _logger.LogInformation($"Uploaded room image: {fileName} to {filePath}");
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Upload thành công {uploadedFiles.Count} file", 
                    files = uploadedFiles 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading room images");
                return StatusCode(500, new { success = false, message = "Lỗi khi upload file: " + ex.Message });
            }
        }

        [HttpDelete("hotels/{fileName}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteHotelImage(string fileName)
        {
            try
            {
                var realHotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
                var filePath = Path.Combine(realHotelsPath, fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    _logger.LogInformation($"Deleted hotel image: {fileName}");
                    return Ok(new { success = true, message = "Xóa file thành công" });
                }

                return NotFound(new { success = false, message = "File không tồn tại" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting hotel image: {fileName}");
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa file: " + ex.Message });
            }
        }

        [HttpDelete("rooms/{fileName}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteRoomImage(string fileName)
        {
            try
            {
                var realRoomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";
                var filePath = Path.Combine(realRoomsPath, fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    _logger.LogInformation($"Deleted room image: {fileName}");
                    return Ok(new { success = true, message = "Xóa file thành công" });
                }

                return NotFound(new { success = false, message = "File không tồn tại" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting room image: {fileName}");
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa file: " + ex.Message });
            }
        }

        // Test endpoint để kiểm tra upload functionality
        [HttpGet("test")]
        public IActionResult Test()
        {
            var realHotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
            var realRoomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";

            return Ok(new
            {
                success = true,
                message = "Files controller is working!",
                realHotelsPath = realHotelsPath,
                realRoomsPath = realRoomsPath,
                hotelsPathExists = Directory.Exists(realHotelsPath),
                roomsPathExists = Directory.Exists(realRoomsPath),
                timestamp = DateTime.Now
            });
        }
    }
}