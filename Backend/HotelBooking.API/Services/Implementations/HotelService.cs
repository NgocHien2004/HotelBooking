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

        public HotelService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<KhachSanDto>> GetAllHotelsAsync()
        {
            var hotels = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .Include(h => h.LoaiPhongs)
                .OrderBy(h => h.TenKhachSan)
                .ToListAsync();

            var hotelDtos = _mapper.Map<IEnumerable<KhachSanDto>>(hotels);
            
            // Tính giá phòng thấp nhất cho mỗi khách sạn
            foreach (var hotelDto in hotelDtos)
            {
                if (hotelDto.LoaiPhongs != null && hotelDto.LoaiPhongs.Any())
                {
                    hotelDto.GiaPhongThapNhat = hotelDto.LoaiPhongs.Min(lp => lp.GiaMotDem);
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
            
            // Tính giá phòng thấp nhất
            if (hotelDto.LoaiPhongs != null && hotelDto.LoaiPhongs.Any())
            {
                hotelDto.GiaPhongThapNhat = hotelDto.LoaiPhongs.Min(lp => lp.GiaMotDem);
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
            
            // Tính giá phòng thấp nhất cho mỗi khách sạn
            foreach (var hotelDto in hotelDtos)
            {
                if (hotelDto.LoaiPhongs != null && hotelDto.LoaiPhongs.Any())
                {
                    hotelDto.GiaPhongThapNhat = hotelDto.LoaiPhongs.Min(lp => lp.GiaMotDem);
                }
            }

            return hotelDtos;
        }

        public async Task<KhachSanDto> CreateHotelAsync(CreateKhachSanDto createHotelDto)
        {
            var hotel = _mapper.Map<KhachSan>(createHotelDto);
            
            // Thêm tiện nghi nếu có (lưu vào một field khác nếu cần)
            // Tùy thuộc vào cách bạn muốn lưu tiện nghi trong database
            
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

        public async Task<IEnumerable<string>> GetAvailableCitiesAsync()
        {
            var cities = await _context.KhachSans
                .Where(h => !string.IsNullOrEmpty(h.ThanhPho))
                .Select(h => h.ThanhPho!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return cities;
        }
    }
}