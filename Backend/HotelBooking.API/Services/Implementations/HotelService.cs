using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Services.Implementations
{
    public class HotelService : IHotelService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _environment;

        public HotelService(HotelBookingContext context, IMapper mapper, IWebHostEnvironment environment)
        {
            _context = context;
            _mapper = mapper;
            _environment = environment;
        }

        public async Task<IEnumerable<KhachSanDto>> GetAllHotelsAsync()
        {
            var hotels = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .Include(h => h.LoaiPhongs)
                .OrderBy(h => h.TenKhachSan)
                .ToListAsync();

            var hotelDtos = _mapper.Map<IEnumerable<KhachSanDto>>(hotels);
            
            // Xử lý ảnh placeholder cho các khách sạn không có ảnh
            foreach (var hotelDto in hotelDtos)
            {
                if (!hotelDto.HinhAnhs.Any())
                {
                    hotelDto.HinhAnhs.Add(new HinhAnhKhachSanDto
                    {
                        MaAnh = 0,
                        MaKhachSan = hotelDto.MaKhachSan,
                        DuongDanAnh = "/uploads/temp/hotel-placeholder.jpg",
                        MoTa = "Ảnh mặc định"
                    });
                }
            }

            return hotelDtos;
        }

        public async Task<KhachSanDto?> GetHotelByIdAsync(int id)
        {
            var hotel = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .Include(h => h.LoaiPhongs)
                    .ThenInclude(lt => lt.Phongs)
                .FirstOrDefaultAsync(h => h.MaKhachSan == id);

            if (hotel == null) return null;

            var hotelDto = _mapper.Map<KhachSanDto>(hotel);
            
            // Xử lý ảnh placeholder nếu không có ảnh
            if (!hotelDto.HinhAnhs.Any())
            {
                hotelDto.HinhAnhs.Add(new HinhAnhKhachSanDto
                {
                    MaAnh = 0,
                    MaKhachSan = hotelDto.MaKhachSan,
                    DuongDanAnh = "/uploads/temp/hotel-placeholder.jpg",
                    MoTa = "Ảnh mặc định"
                });
            }

            return hotelDto;
        }

        public async Task<IEnumerable<KhachSanDto>> SearchHotelsAsync(string? searchTerm, string? city)
        {
            var query = _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .Include(h => h.LoaiPhongs)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(h => h.TenKhachSan.Contains(searchTerm) || 
                                        h.DiaChi.Contains(searchTerm) ||
                                        (h.MoTa != null && h.MoTa.Contains(searchTerm)));
            }

            if (!string.IsNullOrWhiteSpace(city))
            {
                query = query.Where(h => h.ThanhPho != null && h.ThanhPho.Contains(city));
            }

            var hotels = await query.OrderBy(h => h.TenKhachSan).ToListAsync();
            var hotelDtos = _mapper.Map<IEnumerable<KhachSanDto>>(hotels);
            
            // Xử lý ảnh placeholder cho các khách sạn không có ảnh
            foreach (var hotelDto in hotelDtos)
            {
                if (!hotelDto.HinhAnhs.Any())
                {
                    hotelDto.HinhAnhs.Add(new HinhAnhKhachSanDto
                    {
                        MaAnh = 0,
                        MaKhachSan = hotelDto.MaKhachSan,
                        DuongDanAnh = "/uploads/temp/hotel-placeholder.jpg",
                        MoTa = "Ảnh mặc định"
                    });
                }
            }

            return hotelDtos;
        }

        public async Task<IEnumerable<string>> GetAvailableCitiesAsync()
        {
            var cities = await _context.KhachSans
                .Where(h => !string.IsNullOrWhiteSpace(h.ThanhPho))
                .Select(h => h.ThanhPho!)
                .Distinct()
                .OrderBy(city => city)
                .ToListAsync();

            return cities;
        }

        public async Task<KhachSanDto> CreateHotelAsync(CreateKhachSanDto createHotelDto)
        {
            var hotel = _mapper.Map<KhachSan>(createHotelDto);
            
            _context.KhachSans.Add(hotel);
            await _context.SaveChangesAsync();

            return await GetHotelByIdAsync(hotel.MaKhachSan) ??
                throw new InvalidOperationException("Không thể tạo khách sạn");
        }

        public async Task<KhachSanDto?> UpdateHotelAsync(int id, UpdateKhachSanDto updateHotelDto)
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

        public async Task<bool> DeleteHotelAsync(int id)
        {
            var hotel = await _context.KhachSans.FindAsync(id);
            if (hotel == null)
            {
                return false;
            }

            _context.KhachSans.Remove(hotel);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<HinhAnhKhachSanDto> AddHotelImageAsync(CreateHinhAnhKhachSanDto createImageDto)
        {
            var image = _mapper.Map<HinhAnhKhachSan>(createImageDto);
            
            _context.HinhAnhKhachSans.Add(image);
            await _context.SaveChangesAsync();

            return _mapper.Map<HinhAnhKhachSanDto>(image);
        }

        public async Task<bool> DeleteHotelImageAsync(int imageId)
        {
            var image = await _context.HinhAnhKhachSans.FindAsync(imageId);
            if (image == null)
            {
                return false;
            }

            _context.HinhAnhKhachSans.Remove(image);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<HinhAnhKhachSanDto>> GetHotelImagesAsync(int hotelId)
        {
            var images = await _context.HinhAnhKhachSans
                .Where(img => img.MaKhachSan == hotelId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<HinhAnhKhachSanDto>>(images);
        }
    }
}