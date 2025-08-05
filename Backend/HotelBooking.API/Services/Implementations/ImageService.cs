using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Data;
using HotelBooking.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace HotelBooking.API.Services.Implementations
{
    public class ImageService : IImageService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ImageService> _logger;
        private readonly string _hotelsPath;
        private readonly string _placeholderPath;

        public ImageService(
            HotelBookingContext context,
            IMapper mapper,
            ILogger<ImageService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            
            // Đường dẫn tuyệt đối đến thư mục uploads
            _hotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
            _placeholderPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\temp\hotel-placeholder.jpg";
            
            // Tạo thư mục nếu chưa tồn tại
            EnsureDirectoriesExist();
        }

        private void EnsureDirectoriesExist()
        {
            if (!Directory.Exists(_hotelsPath))
            {
                Directory.CreateDirectory(_hotelsPath);
                _logger.LogInformation($"Created hotels directory: {_hotelsPath}");
            }
        }

        public async Task<List<string>> UploadHotelImagesAsync(int hotelId, List<IFormFile> images)
        {
            var uploadedFiles = new List<string>();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

            try
            {
                foreach (var image in images)
                {
                    if (image.Length > 0)
                    {
                        // Validate file type
                        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                        if (!allowedExtensions.Contains(extension))
                        {
                            _logger.LogWarning($"Skipped invalid file type: {image.FileName}");
                            continue;
                        }

                        // Generate unique filename
                        var fileName = $"hotel_{hotelId}_{Guid.NewGuid()}{extension}";
                        var filePath = Path.Combine(_hotelsPath, fileName);

                        // Save file to disk
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        var relativePath = $"/uploads/hotels/{fileName}";
                        uploadedFiles.Add(relativePath);

                        // Save to database
                        await SaveHotelImageToDbAsync(hotelId, relativePath, $"Ảnh khách sạn {hotelId}");

                        _logger.LogInformation($"Uploaded and saved to DB: {fileName}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading hotel images");
                throw;
            }

            return uploadedFiles;
        }

        public async Task<bool> SaveHotelImageToDbAsync(int hotelId, string imagePath, string? description = null)
        {
            try
            {
                // Kiểm tra khách sạn có tồn tại không
                var hotelExists = await _context.KhachSans.AnyAsync(h => h.MaKhachSan == hotelId);
                if (!hotelExists)
                {
                    _logger.LogWarning($"Hotel with ID {hotelId} not found");
                    return false;
                }

                // Kiểm tra ảnh đã tồn tại trong DB chưa
                var existingImage = await _context.HinhAnhKhachSans
                    .FirstOrDefaultAsync(img => img.MaKhachSan == hotelId && img.DuongDanAnh == imagePath);

                if (existingImage != null)
                {
                    _logger.LogInformation($"Image already exists in database: {imagePath}");
                    return true;
                }

                // Thêm ảnh mới vào database
                var hinhAnhKhachSan = new HinhAnhKhachSan
                {
                    MaKhachSan = hotelId,
                    DuongDanAnh = imagePath,
                    MoTa = description ?? "Ảnh khách sạn"
                };

                _context.HinhAnhKhachSans.Add(hinhAnhKhachSan);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Saved image to database: {imagePath} for hotel {hotelId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving image to database: {imagePath}");
                return false;
            }
        }

        public async Task<List<HinhAnhKhachSanDto>> GetHotelImagesAsync(int hotelId)
        {
            try
            {
                var images = await _context.HinhAnhKhachSans
                    .Where(img => img.MaKhachSan == hotelId)
                    .OrderBy(img => img.MaAnh)
                    .ToListAsync();

                var imageDtos = _mapper.Map<List<HinhAnhKhachSanDto>>(images);

                // Kiểm tra từng ảnh xem có tồn tại trên disk không
                foreach (var imageDto in imageDtos)
                {
                    var exists = await ImageExistsInFolder(imageDto.DuongDanAnh);
                    if (!exists)
                    {
                        _logger.LogWarning($"Image file not found on disk: {imageDto.DuongDanAnh}");
                    }
                }

                return imageDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting hotel images for hotel {hotelId}");
                return new List<HinhAnhKhachSanDto>();
            }
        }

        public async Task<string> GetHotelMainImageAsync(int hotelId)
        {
            try
            {
                // 1. Ưu tiên ảnh từ database
                var dbImage = await _context.HinhAnhKhachSans
                    .Where(img => img.MaKhachSan == hotelId)
                    .OrderBy(img => img.MaAnh)
                    .Select(img => img.DuongDanAnh)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(dbImage))
                {
                    // Kiểm tra file có tồn tại không
                    var imageExists = await ImageExistsInFolder(dbImage);
                    if (imageExists)
                    {
                        _logger.LogInformation($"Found main image from database: {dbImage}");
                        return dbImage;
                    }
                    else
                    {
                        _logger.LogWarning($"Database image not found on disk: {dbImage}");
                    }
                }

                // 2. Kiểm tra thư mục hotels/ xem có ảnh nào cho hotel này không
                if (Directory.Exists(_hotelsPath))
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    var hotelFiles = Directory.GetFiles(_hotelsPath, $"hotel_{hotelId}_*")
                        .Where(f => allowedExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                        .OrderBy(f => f)
                        .ToList();

                    if (hotelFiles.Any())
                    {
                        var fileName = Path.GetFileName(hotelFiles.First());
                        var relativePath = $"/uploads/hotels/{fileName}";
                        
                        // Tự động thêm vào database nếu chưa có
                        await SaveHotelImageToDbAsync(hotelId, relativePath, "Ảnh tự động thêm từ thư mục");
                        
                        _logger.LogInformation($"Found main image from hotels folder: {relativePath}");
                        return relativePath;
                    }
                }

                // 3. Fallback về placeholder
                _logger.LogInformation($"No images found for hotel {hotelId}, using placeholder");
                return "/uploads/temp/hotel-placeholder.jpg";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting main image for hotel {hotelId}");
                return "/uploads/temp/hotel-placeholder.jpg";
            }
        }

        public async Task<bool> DeleteHotelImageAsync(int imageId)
        {
            try
            {
                var image = await _context.HinhAnhKhachSans.FindAsync(imageId);
                if (image == null)
                {
                    return false;
                }

                // Xóa file trên disk nếu có
                var fullPath = GetFullImagePath(image.DuongDanAnh);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation($"Deleted image file: {fullPath}");
                }

                // Xóa khỏi database
                _context.HinhAnhKhachSans.Remove(image);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Deleted image from database: {image.DuongDanAnh}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting image with ID {imageId}");
                return false;
            }
        }

        public async Task<bool> ImageExistsInFolder(string imagePath)
        {
            try
            {
                if (string.IsNullOrEmpty(imagePath))
                    return false;

                var fullPath = GetFullImagePath(imagePath);
                var exists = File.Exists(fullPath);
                
                if (!exists)
                {
                    _logger.LogDebug($"Image not found: {fullPath}");
                }
                
                return exists;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking image existence: {imagePath}");
                return false;
            }
        }

        public async Task<int> SyncImagesFromFolderToDbAsync(int hotelId)
        {
            try
            {
                var syncedCount = 0;
                
                if (!Directory.Exists(_hotelsPath))
                    return syncedCount;

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var hotelFiles = Directory.GetFiles(_hotelsPath, $"hotel_{hotelId}_*")
                    .Where(f => allowedExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                    .ToList();

                foreach (var filePath in hotelFiles)
                {
                    var fileName = Path.GetFileName(filePath);
                    var relativePath = $"/uploads/hotels/{fileName}";
                    
                    var success = await SaveHotelImageToDbAsync(hotelId, relativePath, "Ảnh đồng bộ từ thư mục");
                    if (success)
                    {
                        syncedCount++;
                    }
                }

                _logger.LogInformation($"Synced {syncedCount} images for hotel {hotelId}");
                return syncedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing images for hotel {hotelId}");
                return 0;
            }
        }

        private string GetFullImagePath(string relativePath)
        {
            // Convert relative path to full path
            if (string.IsNullOrEmpty(relativePath))
                return string.Empty;

            // Remove leading slash if present
            var cleanPath = relativePath.TrimStart('/');
            
            // Replace forward slashes with backslashes for Windows
            cleanPath = cleanPath.Replace('/', '\\');
            
            // Build full path
            var fullPath = Path.Combine(@"D:\Temp\HotelBooking\Backend\HotelBooking.API", cleanPath);
            
            return fullPath;
        }
    }
}