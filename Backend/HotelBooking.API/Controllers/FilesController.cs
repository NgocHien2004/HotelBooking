using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelBooking.API.Services.Implementations;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/upload")]
    public class UploadController : ControllerBase
    {
        private readonly ILogger<UploadController> _logger;
        private readonly IImageService _imageService;
        private readonly string _hotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
        private readonly string _roomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";

        public UploadController(ILogger<UploadController> logger, IImageService imageService)
        {
            _logger = logger;
            _imageService = imageService;
            
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
                    return BadRequest(new { 
                        success = false, 
                        message = "Không có file nào được chọn" 
                    });
                }

                _logger.LogInformation($"Starting upload of {images.Count} images for hotel {hotelId}");

                // Sử dụng ImageService để upload và lưu vào DB
                var uploadedFiles = await _imageService.UploadHotelImagesAsync(hotelId, images);

                if (uploadedFiles.Count == 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Không có file hợp lệ nào được upload" 
                    });
                }

                _logger.LogInformation($"Successfully uploaded {uploadedFiles.Count} images for hotel {hotelId}");

                return Ok(new { 
                    success = true, 
                    message = $"Đã upload {uploadedFiles.Count} ảnh thành công",
                    files = uploadedFiles,
                    hotelId = hotelId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading hotel images for hotel {hotelId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Có lỗi xảy ra khi upload ảnh",
                    details = ex.Message 
                });
            }
        }

        [HttpGet("hotels/{hotelId}/images")]
        public async Task<IActionResult> GetHotelImages(int hotelId)
        {
            try
            {
                var images = await _imageService.GetHotelImagesAsync(hotelId);
                
                return Ok(new { 
                    success = true, 
                    data = images,
                    count = images.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting hotel images for hotel {hotelId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy danh sách ảnh" 
                });
            }
        }

        [HttpGet("hotels/{hotelId}/main-image")]
        public async Task<IActionResult> GetHotelMainImage(int hotelId)
        {
            try
            {
                var mainImagePath = await _imageService.GetHotelMainImageAsync(hotelId);
                
                return Ok(new { 
                    success = true, 
                    imagePath = mainImagePath,
                    fullUrl = $"{Request.Scheme}://{Request.Host}{mainImagePath}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting main image for hotel {hotelId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy ảnh chính" 
                });
            }
        }

        [HttpDelete("images/{imageId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteHotelImage(int imageId)
        {
            try
            {
                var result = await _imageService.DeleteHotelImageAsync(imageId);
                
                if (result)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Đã xóa ảnh thành công" 
                    });
                }
                else
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Không tìm thấy ảnh để xóa" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting image {imageId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Có lỗi xảy ra khi xóa ảnh" 
                });
            }
        }

        [HttpPost("hotels/{hotelId}/sync")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SyncHotelImagesFromFolder(int hotelId)
        {
            try
            {
                var syncedCount = await _imageService.SyncImagesFromFolderToDbAsync(hotelId);
                
                return Ok(new { 
                    success = true, 
                    message = $"Đã đồng bộ {syncedCount} ảnh từ thư mục vào database",
                    syncedCount = syncedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing images for hotel {hotelId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Có lỗi xảy ra khi đồng bộ ảnh" 
                });
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
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
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

        // Test endpoint để kiểm tra trạng thái thư mục và ảnh
        [HttpGet("test/{hotelId}")]
        public async Task<IActionResult> TestHotelImages(int hotelId)
        {
            try
            {
                var result = new
                {
                    hotelId = hotelId,
                    hotelsDirectoryExists = Directory.Exists(_hotelsPath),
                    hotelsDirectory = _hotelsPath,
                    
                    // Kiểm tra files trong thư mục hotels
                    filesInHotelsFolder = Directory.Exists(_hotelsPath) 
                        ? Directory.GetFiles(_hotelsPath, $"hotel_{hotelId}_*")
                            .Select(f => Path.GetFileName(f)).ToArray()
                        : new string[0],
                    
                    // Kiểm tra ảnh trong database
                    imagesInDatabase = await _imageService.GetHotelImagesAsync(hotelId),
                    
                    // Lấy ảnh chính
                    mainImage = await _imageService.GetHotelMainImageAsync(hotelId),
                    
                    placeholderPath = "/uploads/temp/hotel-placeholder.jpg"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in test endpoint for hotel {hotelId}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}