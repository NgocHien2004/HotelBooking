using HotelBooking.API.DTOs;

namespace HotelBooking.API.Services.Interfaces
{
    public interface IImageService
    {
        Task<List<string>> UploadHotelImagesAsync(int hotelId, List<IFormFile> images);
        Task<bool> SaveHotelImageToDbAsync(int hotelId, string imagePath, string? description = null);
        Task<List<HinhAnhKhachSanDto>> GetHotelImagesAsync(int hotelId);
        Task<string> GetHotelMainImageAsync(int hotelId);
        Task<bool> DeleteHotelImageAsync(int imageId);
        Task<bool> ImageExistsInFolder(string imagePath);
        Task<int> SyncImagesFromFolderToDbAsync(int hotelId);
    }
}