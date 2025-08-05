using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/hotels")]
    [Authorize]
    public class ImageController : ControllerBase
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IConfiguration _configuration;

        public ImageController(IWebHostEnvironment webHostEnvironment, IConfiguration configuration)
        {
            _webHostEnvironment = webHostEnvironment;
            _configuration = configuration;
        }

        [HttpPost("{hotelId}/images")]
        public async Task<IActionResult> UploadHotelImages(int hotelId, [FromForm] List<IFormFile> images)
        {
            try
            {
                if (images == null || !images.Any())
                {
                    return BadRequest(new { success = false, message = "Không có ảnh nào được chọn" });
                }

                // Kiểm tra khách sạn có tồn tại không
                using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                var checkHotelQuery = "SELECT COUNT(*) FROM KhachSan WHERE ma_khach_san = @HotelId";
                using var checkCmd = new SqlCommand(checkHotelQuery, connection);
                checkCmd.Parameters.AddWithValue("@HotelId", hotelId);
                
                var hotelExists = (int)await checkCmd.ExecuteScalarAsync() > 0;
                if (!hotelExists)
                {
                    return NotFound(new { success = false, message = "Khách sạn không tồn tại" });
                }

                var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "hotels");
                
                // Tạo thư mục nếu chưa tồn tại
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uploadedFiles = new List<object>();

                foreach (var image in images)
                {
                    if (image.Length > 0)
                    {
                        // Tạo tên file unique
                        var fileName = $"{hotelId}_{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
                        var filePath = Path.Combine(uploadsFolder, fileName);
                        var relativePath = $"/uploads/hotels/{fileName}";

                        // Lưu file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        // Lưu thông tin ảnh vào database
                        var insertImageQuery = @"
                            INSERT INTO HinhAnhKhachSan (ma_khach_san, duong_dan_anh, mo_ta) 
                            VALUES (@HotelId, @ImagePath, @Description);
                            SELECT SCOPE_IDENTITY();";
                        
                        using var insertCmd = new SqlCommand(insertImageQuery, connection);
                        insertCmd.Parameters.AddWithValue("@HotelId", hotelId);
                        insertCmd.Parameters.AddWithValue("@ImagePath", relativePath);
                        insertCmd.Parameters.AddWithValue("@Description", image.FileName);

                        var imageId = await insertCmd.ExecuteScalarAsync();

                        uploadedFiles.Add(new
                        {
                            id = Convert.ToInt32(imageId),
                            path = relativePath,
                            name = fileName,
                            originalName = image.FileName
                        });
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = "Upload ảnh thành công",
                    data = uploadedFiles,
                    count = uploadedFiles.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{hotelId}/images")]
        public async Task<IActionResult> DeleteHotelImage(int hotelId, [FromBody] DeleteImageRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.ImagePath))
                {
                    return BadRequest(new { success = false, message = "Đường dẫn ảnh không hợp lệ" });
                }

                using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                // Xóa record trong database
                var deleteQuery = "DELETE FROM HinhAnhKhachSan WHERE ma_khach_san = @HotelId AND duong_dan_anh = @ImagePath";
                using var deleteCmd = new SqlCommand(deleteQuery, connection);
                deleteCmd.Parameters.AddWithValue("@HotelId", hotelId);
                deleteCmd.Parameters.AddWithValue("@ImagePath", request.ImagePath);

                var rowsAffected = await deleteCmd.ExecuteNonQueryAsync();

                if (rowsAffected > 0)
                {
                    // Xóa file vật lý
                    var fullPath = Path.Combine(_webHostEnvironment.WebRootPath, request.ImagePath.TrimStart('/'));
                    if (System.IO.File.Exists(fullPath))
                    {
                        System.IO.File.Delete(fullPath);
                    }

                    return Ok(new { success = true, message = "Xóa ảnh thành công" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Không tìm thấy ảnh để xóa" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{hotelId}/images")]
        public async Task<IActionResult> GetHotelImages(int hotelId)
        {
            try
            {
                using var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                await connection.OpenAsync();

                var query = @"
                    SELECT ma_anh, ma_khach_san, duong_dan_anh, mo_ta 
                    FROM HinhAnhKhachSan 
                    WHERE ma_khach_san = @HotelId 
                    ORDER BY ma_anh";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@HotelId", hotelId);

                var images = new List<object>();
                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    images.Add(new
                    {
                        maAnh = reader.GetInt32("ma_anh"),
                        maKhachSan = reader.GetInt32("ma_khach_san"),
                        duongDanAnh = reader.GetString("duong_dan_anh"),
                        moTa = reader.IsDBNull("mo_ta") ? null : reader.GetString("mo_ta")
                    });
                }

                return Ok(new { success = true, data = images });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class DeleteImageRequest
    {
        public string ImagePath { get; set; }
    }
}