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
    public class RoomService : IRoomService
    {
        private readonly HotelBookingContext _context;
        private readonly IMapper _mapper;

        public RoomService(HotelBookingContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<RoomTypeDto>> GetRoomTypesByHotelAsync(int hotelId)
        {
            var roomTypes = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .Where(rt => rt.MaKhachSan == hotelId)
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<RoomTypeDto>>(roomTypes);
        }

        public async Task<RoomTypeDto> GetRoomTypeByIdAsync(int id)
        {
            var roomType = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .FirstOrDefaultAsync(rt => rt.MaLoaiPhong == id);
                
            if (roomType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại phòng với ID: {id}");
            }
            
            return _mapper.Map<RoomTypeDto>(roomType);
        }

        public async Task<RoomTypeDto> CreateRoomTypeAsync(RoomTypeCreateDto roomTypeDto)
        {
            var roomType = _mapper.Map<LoaiPhong>(roomTypeDto);
            _context.LoaiPhongs.Add(roomType);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            roomType = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .FirstAsync(rt => rt.MaLoaiPhong == roomType.MaLoaiPhong);
                
            return _mapper.Map<RoomTypeDto>(roomType);
        }

        public async Task<RoomTypeDto> UpdateRoomTypeAsync(int id, RoomTypeUpdateDto roomTypeDto)
        {
            var roomType = await _context.LoaiPhongs.FindAsync(id);
            if (roomType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại phòng với ID: {id}");
            }

            _mapper.Map(roomTypeDto, roomType);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            roomType = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .FirstAsync(rt => rt.MaLoaiPhong == id);
                
            return _mapper.Map<RoomTypeDto>(roomType);
        }

        public async Task<bool> DeleteRoomTypeAsync(int id)
        {
            var roomType = await _context.LoaiPhongs.FindAsync(id);
            if (roomType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại phòng với ID: {id}");
            }

            _context.LoaiPhongs.Remove(roomType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<RoomDto>> GetRoomsByTypeAsync(int roomTypeId)
        {
            var rooms = await _context.Phongs
                .Include(r => r.LoaiPhong)
                    .ThenInclude(rt => rt.KhachSan)
                .Where(r => r.MaLoaiPhong == roomTypeId)
                .ToListAsync();
                
            return _mapper.Map<IEnumerable<RoomDto>>(rooms);
        }

        public async Task<RoomDto> GetRoomByIdAsync(int id)
        {
            var room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                    .ThenInclude(rt => rt.KhachSan)
                .FirstOrDefaultAsync(r => r.MaPhong == id);
                
            if (room == null)
            {
                throw new ArgumentException($"Không tìm thấy phòng với ID: {id}");
            }
            
            return _mapper.Map<RoomDto>(room);
        }

        public async Task<RoomDto> CreateRoomAsync(RoomCreateDto roomDto)
        {
            var room = _mapper.Map<Phong>(roomDto);
            _context.Phongs.Add(room);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                    .ThenInclude(rt => rt.KhachSan)
                .FirstAsync(r => r.MaPhong == room.MaPhong);
                
            return _mapper.Map<RoomDto>(room);
        }

        public async Task<RoomDto> UpdateRoomAsync(int id, RoomUpdateDto roomDto)
        {
            var room = await _context.Phongs.FindAsync(id);
            if (room == null)
            {
                throw new ArgumentException($"Không tìm thấy phòng với ID: {id}");
            }

            _mapper.Map(roomDto, room);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                    .ThenInclude(rt => rt.KhachSan)
                .FirstAsync(r => r.MaPhong == id);
                
            return _mapper.Map<RoomDto>(room);
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            var room = await _context.Phongs.FindAsync(id);
            if (room == null)
            {
                throw new ArgumentException($"Không tìm thấy phòng với ID: {id}");
            }

            _context.Phongs.Remove(room);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<RoomAvailabilityDto>> CheckRoomAvailabilityAsync(BookingSearchDto searchDto)
        {
            var query = _context.Phongs
                .Include(r => r.LoaiPhong)
                .Include(r => r.DatPhongs)
                .AsQueryable();

            if (searchDto.MaKhachSan.HasValue)
            {
                query = query.Where(r => r.LoaiPhong.MaKhachSan == searchDto.MaKhachSan.Value);
            }

            if (searchDto.SoNguoi.HasValue)
            {
                query = query.Where(r => r.LoaiPhong.SucChua >= searchDto.SoNguoi.Value);
            }

            if (searchDto.GiaMin.HasValue)
            {
                query = query.Where(r => r.LoaiPhong.GiaMotDem >= searchDto.GiaMin.Value);
            }

            if (searchDto.GiaMax.HasValue)
            {
                query = query.Where(r => r.LoaiPhong.GiaMotDem <= searchDto.GiaMax.Value);
            }

            var rooms = await query.ToListAsync();

            var availability = rooms.Select(room =>
            {
                var isAvailable = true;
                
                if (searchDto.NgayNhanPhong.HasValue && searchDto.NgayTraPhong.HasValue)
                {
                    isAvailable = !room.DatPhongs.Any(b =>
                        b.TrangThai != "Cancelled" &&
                        b.NgayNhanPhong < searchDto.NgayTraPhong &&
                        b.NgayTraPhong > searchDto.NgayNhanPhong);
                }

                return new RoomAvailabilityDto
                {
                    MaPhong = room.MaPhong,
                    SoPhong = room.SoPhong,
                    IsAvailable = isAvailable
                };
            });

            return availability;
        }
    }
}