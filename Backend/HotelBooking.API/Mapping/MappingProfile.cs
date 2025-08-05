using AutoMapper;
using HotelBooking.API.Models;
using HotelBooking.API.DTOs;

namespace HotelBooking.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<NguoiDung, UserDto>();
            CreateMap<RegisterDto, NguoiDung>()
                .ForMember(dest => dest.NgayTao, opt => opt.MapFrom(src => DateTime.Now));
            CreateMap<UpdateUserDto, NguoiDung>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Hotel mappings
            CreateMap<KhachSan, KhachSanDto>()
                .ForMember(dest => dest.HinhAnhs, opt => opt.MapFrom(src => src.HinhAnhKhachSans))
                .ForMember(dest => dest.LoaiPhongs, opt => opt.MapFrom(src => src.LoaiPhongs));
            CreateMap<CreateKhachSanDto, KhachSan>()
                .ForMember(dest => dest.NgayTao, opt => opt.MapFrom(src => DateTime.Now));
            CreateMap<UpdateKhachSanDto, KhachSan>();

            // Hotel Image mappings
            CreateMap<HinhAnhKhachSan, HinhAnhKhachSanDto>();
            CreateMap<CreateHinhAnhKhachSanDto, HinhAnhKhachSan>();

            // Room Type mappings
            CreateMap<LoaiPhong, LoaiPhongDto>()
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.KhachSan.TenKhachSan))
                .ForMember(dest => dest.Phongs, opt => opt.MapFrom(src => src.Phongs));
            CreateMap<CreateLoaiPhongDto, LoaiPhong>();
            CreateMap<UpdateLoaiPhongDto, LoaiPhong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Room mappings
            CreateMap<Phong, PhongDto>()
                .ForMember(dest => dest.TenLoaiPhong, opt => opt.MapFrom(src => src.LoaiPhong.TenLoaiPhong))
                .ForMember(dest => dest.GiaMotDem, opt => opt.MapFrom(src => src.LoaiPhong.GiaMotDem))
                .ForMember(dest => dest.SucChua, opt => opt.MapFrom(src => src.LoaiPhong.SucChua));
            CreateMap<CreatePhongDto, Phong>();
            CreateMap<UpdatePhongDto, Phong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Booking mappings
            CreateMap<DatPhong, DatPhongDto>()
                .ForMember(dest => dest.HoTenKhach, opt => opt.MapFrom(src => src.NguoiDung.HoTen))
                .ForMember(dest => dest.EmailKhach, opt => opt.MapFrom(src => src.NguoiDung.Email))
                .ForMember(dest => dest.SoPhong, opt => opt.MapFrom(src => src.Phong.SoPhong))
                .ForMember(dest => dest.TenLoaiPhong, opt => opt.MapFrom(src => src.Phong.LoaiPhong.TenLoaiPhong))
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.Phong.LoaiPhong.KhachSan.TenKhachSan))
                .ForMember(dest => dest.SoNgayO, opt => opt.MapFrom(src => (src.NgayTraPhong - src.NgayNhanPhong).Days));
            CreateMap<CreateDatPhongDto, DatPhong>()
                .ForMember(dest => dest.NgayDat, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.TrangThai, opt => opt.MapFrom(src => "Pending"));
            CreateMap<UpdateDatPhongDto, DatPhong>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Payment mappings
            CreateMap<ThanhToan, ThanhToanDto>()
                .ForMember(dest => dest.HoTenKhach, opt => opt.MapFrom(src => src.DatPhong.NguoiDung.HoTen))
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.DatPhong.Phong.LoaiPhong.KhachSan.TenKhachSan))
                .ForMember(dest => dest.SoPhong, opt => opt.MapFrom(src => src.DatPhong.Phong.SoPhong))
                .ForMember(dest => dest.NgayNhanPhong, opt => opt.MapFrom(src => src.DatPhong.NgayNhanPhong))
                .ForMember(dest => dest.NgayTraPhong, opt => opt.MapFrom(src => src.DatPhong.NgayTraPhong));
            CreateMap<CreateThanhToanDto, ThanhToan>()
                .ForMember(dest => dest.NgayThanhToan, opt => opt.MapFrom(src => DateTime.Now));

            // Review mappings
            CreateMap<DanhGia, DanhGiaDto>()
                .ForMember(dest => dest.HoTenNguoiDung, opt => opt.MapFrom(src => src.NguoiDung.HoTen))
                .ForMember(dest => dest.TenKhachSan, opt => opt.MapFrom(src => src.KhachSan.TenKhachSan));
            CreateMap<CreateDanhGiaDto, DanhGia>()
                .ForMember(dest => dest.NgayTao, opt => opt.MapFrom(src => DateTime.Now));
            CreateMap<UpdateDanhGiaDto, DanhGia>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}