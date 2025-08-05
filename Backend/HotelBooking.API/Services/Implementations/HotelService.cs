using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.Models;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Implementations;

namespace HotelBooking.API.Services.Implementations
{
    public interface IHotelService
    {
        Task<IEnumerable<KhachSanDto>> GetAllHotelsAsync();
        Task<KhachSanDto?> GetHotelByIdAsync(int id);
        Task<IEnumerable<KhachSanDto>> SearchHotelsAsync(string? searchTerm, string? city);
        Task<KhachSanDto> CreateHotelAsync(CreateKhachSanDto createHotelDto);
        Task<KhachSanDto?> UpdateHotelAsync(int id, UpdateKhachSanDto updateHotelDto);
        Task<bool> DeleteHotelAsync(int id);
        Task<IEnumerable<string>> GetAvailableCitiesAsync();
    }

    public class HotelService : IHotelService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<HotelService> _logger;
        private readonly IImageService _imageService;

        public HotelService(
            HotelBookingContext context, 
            IMapper mapper, 
            ILogger<HotelService> logger,
            IImageService imageService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _imageService = imageService;
        }

        public async Task<IEnumerable<KhachSanDto>> GetAllHotelsAsync()
        {
            try
            {
                var hotels = await _context.KhachSans
                    .Include(h => h.HinhAnhKhachSans)
                    .Include(h => h.LoaiPhongs)
                    .ToListAsync();

                var hotelDtos = _mapper.Map<IEnumerable<KhachSanDto>>(hotels);

                // Cập nhật ảnh chính cho mỗi khách sạn
                foreach (var hotelDto in hotelDtos)
                {
                    try
                    {
                        var mainImage = await _imageService.GetHotelMainImageAsync(hotelDto.MaKhachSan);
                        
                        // Cập nhật ảnh chính vào danh sách hình ảnh
                        if (hotelDto.HinhAnhs.Any())
                        {
                            hotelDto.HinhAnhs.First().DuongDanAnh = mainImage;
                        }
                        else
                        {
                            // Thêm ảnh chính nếu chưa có ảnh nào
                            hotelDto.HinhAnhs = new List<HinhAnhKhachSanDto>
                            {
                                new HinhAnhKhachSanDto
                                {
                                    MaKhachSan = hotelDto.MaKhachSan,
                                    DuongDanAnh = mainImage,
                                    MoTa = "Ảnh chính"
                                }
                            };
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error getting main image for hotel {hotelDto.MaKhachSan}");
                    }
                }

                return hotelDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all hotels");
                throw;
            }
        }

        public async Task<KhachSanDto?> GetHotelByIdAsync(int id)
        {
            try
            {
                var hotel = await _context.KhachSans
                    .Include(h => h.HinhAnhKhachSans)
                    .Include(h => h.LoaiPhongs)
                        .ThenInclude(lp => lp.Phongs)
                    .Include(h => h.DanhGias)
                        .ThenInclude(dg => dg.NguoiDung)
                    .FirstOrDefaultAsync(h => h.MaKhachSan == id);

                if (hotel == null)
                {
                    return null;
                }

                var hotelDto = _mapper.Map<KhachSanDto>(hotel);

                // Cập nhật danh sách ảnh từ ImageService
                try
                {
                    var images = await _imageService.GetHotelImagesAsync(id);
                    if (images.Any())
                    {
                        hotelDto.HinhAnhs = images;
                    }
                    else
                    {
                        // Nếu không có ảnh trong DB, lấy ảnh chính (có thể là placeholder)
                        var mainImage = await _imageService.GetHotelMainImageAsync(id);
                        hotelDto.HinhAnhs = new List<HinhAnhKhachSanDto>
                        {
                            new HinhAnhKhachSanDto
                            {
                                MaKhachSan = id,
                                DuongDanAnh = mainImage,
                                MoTa = "Ảnh chính"
                            }
                        };
                    }

                    // Đồng bộ ảnh từ thư mục nếu cần
                    await _imageService.SyncImagesFromFolderToDbAsync(id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error getting images for hotel {id}");
                }

                return hotelDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting hotel by ID {id}");
                throw;
            }
        }

        public async Task<IEnumerable<KhachSanDto>> SearchHotelsAsync(string? searchTerm, string? city)
        {
            try
            {
                var query = _context.KhachSans
                    .Include(h => h.HinhAnhKhachSans)
                    .Include(h => h.LoaiPhongs)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(h => h.TenKhachSan.Contains(searchTerm) ||
                                           h.DiaChi.Contains(searchTerm) ||
                                           (h.MoTa != null && h.MoTa.Contains(searchTerm)));
                }

                if (!string.IsNullOrEmpty(city))
                {
                    query = query.Where(h => h.ThanhPho != null && h.ThanhPho.Contains(city));
                }

                var hotels = await query.ToListAsync();
                var hotelDtos = _mapper.Map<IEnumerable<KhachSanDto>>(hotels);

                // Cập nhật ảnh chính cho từng khách sạn
                foreach (var hotelDto in hotelDtos)
                {
                    try
                    {
                        var mainImage = await _imageService.GetHotelMainImageAsync(hotelDto.MaKhachSan);
                        if (hotelDto.HinhAnhs.Any())
                        {
                            hotelDto.HinhAnhs.First().DuongDanAnh = mainImage;
                        }
                        else
                        {
                            hotelDto.HinhAnhs = new List<HinhAnhKhachSanDto>
                            {
                                new HinhAnhKhachSanDto
                                {
                                    MaKhachSan = hotelDto.MaKhachSan,
                                    DuongDanAnh = mainImage,
                                    MoTa = "Ảnh chính"
                                }
                            };
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error getting main image for hotel {hotelDto.MaKhachSan}");
                    }
                }

                return hotelDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching hotels");
                throw;
            }
        }

        public async Task<KhachSanDto> CreateHotelAsync(CreateKhachSanDto createHotelDto)
        {
            try
            {
                var hotel = _mapper.Map<KhachSan>(createHotelDto);
                
                _context.KhachSans.Add(hotel);
                await _context.SaveChangesAsync();

                var hotelDto = _mapper.Map<KhachSanDto>(hotel);
                
                // Thêm ảnh placeholder mặc định
                var mainImage = await _imageService.GetHotelMainImageAsync(hotel.MaKhachSan);
                hotelDto.HinhAnhs = new List<HinhAnhKhachSanDto>
                {
                    new HinhAnhKhachSanDto
                    {
                        MaKhachSan = hotel.MaKhachSan,
                        DuongDanAnh = mainImage,
                        MoTa = "Ảnh mặc định"
                    }
                };

                _logger.LogInformation($"Created hotel: {hotel.TenKhachSan} with ID: {hotel.MaKhachSan}");
                return hotelDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating hotel");
                throw;
            }
        }

        public async Task<KhachSanDto?> UpdateHotelAsync(int id, UpdateKhachSanDto updateHotelDto)
        {
            try
            {
                var existingHotel = await _context.KhachSans.FindAsync(id);
                if (existingHotel == null)
                {
                    return null;
                }

                _mapper.Map(updateHotelDto, existingHotel);
                await _context.SaveChangesAsync();

                return await GetHotelByIdAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating hotel with ID {id}");
                throw;
            }
        }

        public async Task<bool> DeleteHotelAsync(int id)
        {
            try
            {
                var hotel = await _context.KhachSans
                    .Include(h => h.HinhAnhKhachSans)
                    .FirstOrDefaultAsync(h => h.MaKhachSan == id);
                
                if (hotel == null)
                {
                    return false;
                }

                // Xóa tất cả ảnh liên quan
                foreach (var image in hotel.HinhAnhKhachSans)
                {
                    await _imageService.DeleteHotelImageAsync(image.MaAnh);
                }

                _context.KhachSans.Remove(hotel);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Deleted hotel with ID: {id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting hotel with ID {id}");
                throw;
            }
        }

        public async Task<IEnumerable<string>> GetAvailableCitiesAsync()
        {
            try
            {
                var cities = await _context.KhachSans
                    .Where(h => !string.IsNullOrEmpty(h.ThanhPho))
                    .Select(h => h.ThanhPho!)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return cities;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available cities");
                throw;
            }
        }
    }
}