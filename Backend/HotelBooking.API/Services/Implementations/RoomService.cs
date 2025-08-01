using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBooking.API.Data;
using HotelBooking.API.DTOs;
using HotelBooking.API.Models;
using HotelBooking.API.Services.Interfaces;

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

        #region Room Type Methods

        public async Task<IEnumerable<LoaiPhongDto>> GetAllRoomTypesAsync()
        {
            var roomTypes = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .Include(rt => rt.Phongs)
                .OrderBy(rt => rt.TenLoaiPhong)
                .ToListAsync();

            return _mapper.Map<IEnumerable<LoaiPhongDto>>(roomTypes);
        }

        public async Task<LoaiPhongDto?> GetRoomTypeByIdAsync(int id)
        {
            var roomType = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .Include(rt => rt.Phongs)
                .FirstOrDefaultAsync(rt => rt.MaLoaiPhong == id);

            return roomType == null ? null : _mapper.Map<LoaiPhongDto>(roomType);
        }

        public async Task<IEnumerable<LoaiPhongDto>> GetRoomTypesByHotelAsync(int hotelId)
        {
            var roomTypes = await _context.LoaiPhongs
                .Include(rt => rt.KhachSan)
                .Include(rt => rt.Phongs)
                .Where(rt => rt.MaKhachSan == hotelId)
                .OrderBy(rt => rt.TenLoaiPhong)
                .ToListAsync();

            return _mapper.Map<IEnumerable<LoaiPhongDto>>(roomTypes);
        }

        public async Task<LoaiPhongDto> CreateRoomTypeAsync(CreateLoaiPhongDto createRoomTypeDto)
        {
            var roomType = _mapper.Map<LoaiPhong>(createRoomTypeDto);
            
            _context.LoaiPhongs.Add(roomType);
            await _context.SaveChangesAsync();

            return await GetRoomTypeByIdAsync(roomType.MaLoaiPhong) ?? throw new InvalidOperationException("Không thể tạo loại phòng");
        }

        public async Task<LoaiPhongDto?> UpdateRoomTypeAsync(int id, UpdateLoaiPhongDto updateRoomTypeDto)
        {
            var existingRoomType = await _context.LoaiPhongs.FindAsync(id);
            if (existingRoomType == null)
            {
                return null;
            }

            _mapper.Map(updateRoomTypeDto, existingRoomType);
            await _context.SaveChangesAsync();

            return await GetRoomTypeByIdAsync(id);
        }

        public async Task<bool> DeleteRoomTypeAsync(int id)
        {
            var roomType = await _context.LoaiPhongs.FindAsync(id);
            if (roomType == null)
            {
                return false;
            }

            _context.LoaiPhongs.Remove(roomType);
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Room Methods

        public async Task<IEnumerable<PhongDto>> GetAllRoomsAsync()
        {
            var rooms = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .OrderBy(r => r.SoPhong)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhongDto>>(rooms);
        }

        public async Task<PhongDto?> GetRoomByIdAsync(int id)
        {
            var room = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .FirstOrDefaultAsync(r => r.MaPhong == id);

            return room == null ? null : _mapper.Map<PhongDto>(room);
        }

        public async Task<IEnumerable<PhongDto>> GetRoomsByTypeAsync(int roomTypeId)
        {
            var rooms = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .Where(r => r.MaLoaiPhong == roomTypeId)
                .OrderBy(r => r.SoPhong)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhongDto>>(rooms);
        }

        public async Task<IEnumerable<PhongDto>> GetRoomsByHotelAsync(int hotelId)
        {
            var rooms = await _context.Phongs
                .Include(r => r.LoaiPhong)
                .Where(r => r.LoaiPhong.MaKhachSan == hotelId)
                .OrderBy(r => r.SoPhong)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhongDto>>(rooms);
        }

        public async Task<PhongDto> CreateRoomAsync(CreatePhongDto createRoomDto)
        {
            var room = _mapper.Map<Phong>(createRoomDto);
            
            _context.Phongs.Add(room);
            await _context.SaveChangesAsync();

            return await GetRoomByIdAsync(room.MaPhong) ?? throw new InvalidOperationException("Không thể tạo phòng");
        }

        public async Task<PhongDto?> UpdateRoomAsync(int id, UpdatePhongDto updateRoomDto)
        {
            var existingRoom = await _context.Phongs.FindAsync(id);
            if (existingRoom == null)
            {
                return null;
            }

            _mapper.Map(updateRoomDto, existingRoom);
            await _context.SaveChangesAsync();

            return await GetRoomByIdAsync(id);
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            var room = await _context.Phongs.FindAsync(id);
            if (room == null)
            {
                return false;
            }

            _context.Phongs.Remove(room);
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Availability Methods

        public async Task<IEnumerable<PhongDto>> GetAvailableRoomsAsync(RoomAvailabilityDto availabilityDto)
        {
            var query = _context.Phongs
                .Include(r => r.LoaiPhong)
                    .ThenInclude(rt => rt.KhachSan)
                .Where(r => r.TrangThai == "Available")
                .AsQueryable();

            if (availabilityDto.MaKhachSan.HasValue)
            {
                query = query.Where(r => r.LoaiPhong.MaKhachSan == availabilityDto.MaKhachSan.Value);
            }

            if (availabilityDto.MaLoaiPhong.HasValue)
            {
                query = query.Where(r => r.MaLoaiPhong == availabilityDto.MaLoaiPhong.Value);
            }

            // Check for overlapping bookings
            var unavailableRoomIds = await _context.DatPhongs
                .Where(b => b.TrangThai != "Cancelled" &&
                           ((b.NgayNhanPhong <= availabilityDto.NgayTraPhong && b.NgayTraPhong >= availabilityDto.NgayNhanPhong)))
                .Select(b => b.MaPhong)
                .ToListAsync();

            query = query.Where(r => !unavailableRoomIds.Contains(r.MaPhong));

            var availableRooms = await query.OrderBy(r => r.SoPhong).ToListAsync();
            return _mapper.Map<IEnumerable<PhongDto>>(availableRooms);
        }

        public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            var room = await _context.Phongs.FindAsync(roomId);
            if (room == null || room.TrangThai != "Available")
            {
                return false;
            }

            var hasOverlappingBookings = await _context.DatPhongs
                .AnyAsync(b => b.MaPhong == roomId &&
                              b.TrangThai != "Cancelled" &&
                              ((b.NgayNhanPhong <= checkOut && b.NgayTraPhong >= checkIn)));

            return !hasOverlappingBookings;
        }

        #endregion
    }
}