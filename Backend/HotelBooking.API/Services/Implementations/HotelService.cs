using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Models.Entities;
using HotelBooking.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        public async Task<IEnumerable<HotelDto>> GetAllHotelsAsync()
        {
            var hotels = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .ToListAsync();
            return _mapper.Map<IEnumerable<HotelDto>>(hotels);
        }

        public async Task<HotelDto> GetHotelByIdAsync(int id)
        {
            var hotel = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .FirstOrDefaultAsync(h => h.MaKhachSan == id);
                
            if (hotel == null)
            {
                throw new ArgumentException($"Không tìm thấy khách sạn với ID: {id}");
            }
            
            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task<IEnumerable<HotelDto>> SearchHotelsAsync(string searchTerm)
        {
            var hotels = await _context.KhachSans
                .Include(h => h.HinhAnhKhachSans)
                .Where(h => h.TenKhachSan.Contains(searchTerm) || 
                           h.ThanhPho.Contains(searchTerm) ||
                           h.DiaChi.Contains(searchTerm))
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<HotelDto>>(hotels);
        }

        public async Task<HotelDto> CreateHotelAsync(HotelCreateDto hotelCreateDto)
        {
            var hotel = _mapper.Map<KhachSan>(hotelCreateDto);
            _context.KhachSans.Add(hotel);
            await _context.SaveChangesAsync();
            
            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task<HotelDto> UpdateHotelAsync(int id, HotelUpdateDto hotelUpdateDto)
        {
            var hotel = await _context.KhachSans.FindAsync(id);
            if (hotel == null)
            {
                throw new ArgumentException($"Không tìm thấy khách sạn với ID: {id}");
            }

            _mapper.Map(hotelUpdateDto, hotel);
            await _context.SaveChangesAsync();
            
            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task<bool> DeleteHotelAsync(int id)
        {
            var hotel = await _context.KhachSans.FindAsync(id);
            if (hotel == null)
            {
                throw new ArgumentException($"Không tìm thấy khách sạn với ID: {id}");
            }

            _context.KhachSans.Remove(hotel);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<HotelImageDto> AddHotelImageAsync(HotelImageCreateDto imageDto)
        {
            var image = _mapper.Map<HinhAnhKhachSan>(imageDto);
            _context.HinhAnhKhachSans.Add(image);
            await _context.SaveChangesAsync();
            
            return _mapper.Map<HotelImageDto>(image);
        }

        public async Task<bool> DeleteHotelImageAsync(int imageId)
        {
            var image = await _context.HinhAnhKhachSans.FindAsync(imageId);
            if (image == null)
            {
                throw new ArgumentException($"Không tìm thấy hình ảnh với ID: {imageId}");
            }

            _context.HinhAnhKhachSans.Remove(image);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}