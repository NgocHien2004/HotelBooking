using AutoMapper;
using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Models.Entities;

namespace HotelBooking.API.Configurations
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // User mappings
            CreateMap<NguoiDung, UserDto>();
            CreateMap<UserCreateDto, NguoiDung>();
            CreateMap<UserUpdateDto, NguoiDung>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Hotel mappings
            CreateMap<KhachSan, HotelDto>()
                .ForMember(dest => dest.HinhAnhs, opt => opt.MapFrom(src => 
                    src.HinhAnhKhachSans.Select(h => h.DuongDanAnh).ToList()));
            CreateMap<HotelCreateDto, KhachSan>();
            CreateMap<HotelUpdateDto, KhachSan>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Hotel Image mappings
            CreateMap<HinhAnhKhachSan, HotelImageDto>();
            CreateMap<HotelImageCreateDto, HinhAnhKhachSan>();

            // Room Type mappings
            CreateMap<LoaiPhong, RoomTypeDto>()
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.KhachSan.TenKhachSan));
            CreateMap<RoomTypeCreateDto, LoaiPhong>();
            CreateMap<RoomTypeUpdateDto, LoaiPhong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Room mappings
            CreateMap<Phong, RoomDto>();
            CreateMap<RoomCreateDto, Phong>();
            CreateMap<RoomUpdateDto, Phong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Booking mappings
            CreateMap<DatPhong, BookingDto>();
            CreateMap<BookingCreateDto, DatPhong>();
            CreateMap<BookingUpdateDto, DatPhong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Payment mappings
            CreateMap<ThanhToan, PaymentDto>();
            CreateMap<PaymentCreateDto, ThanhToan>();

            // Review mappings
            CreateMap<DanhGia, ReviewDto>()
                .ForMember(dest => dest.TenNguoiDung, opt => opt.MapFrom(src => src.NguoiDung.HoTen))
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.KhachSan.TenKhachSan));
            CreateMap<ReviewCreateDto, DanhGia>();
            CreateMap<ReviewUpdateDto, DanhGia>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}