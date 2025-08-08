using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace HotelBooking.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HotelsController : ControllerBase
    {
        private readonly string _connectionString;

        public HotelsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetHotels()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT ks.ma_khach_san, ks.ten_khach_san, ks.dia_chi, ks.thanh_pho, 
                           ks.mo_ta, ks.danh_gia_trung_binh, ks.ngay_tao,
                           MIN(lp.gia_mot_dem) as gia_phong_thap_nhat
                    FROM KhachSan ks
                    LEFT JOIN LoaiPhong lp ON ks.ma_khach_san = lp.ma_khach_san
                    GROUP BY ks.ma_khach_san, ks.ten_khach_san, ks.dia_chi, ks.thanh_pho, 
                             ks.mo_ta, ks.danh_gia_trung_binh, ks.ngay_tao
                    ORDER BY ks.ngay_tao DESC";

                using var command = new SqlCommand(query, connection);
                var hotels = new List<object>();

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var hotelId = reader.GetInt32("ma_khach_san");
                    
                    hotels.Add(new
                    {
                        maKhachSan = hotelId,
                        tenKhachSan = reader.GetString("ten_khach_san"),
                        diaChi = reader.GetString("dia_chi"),
                        thanhPho = reader.IsDBNull("thanh_pho") ? null : reader.GetString("thanh_pho"),
                        moTa = reader.IsDBNull("mo_ta") ? null : reader.GetString("mo_ta"),
                        danhGiaTrungBinh = reader.GetDecimal("danh_gia_trung_binh"),
                        ngayTao = reader.GetDateTime("ngay_tao"),
                        giaPhongThapNhat = reader.IsDBNull("gia_phong_thap_nhat") ? (decimal?)null : reader.GetDecimal("gia_phong_thap_nhat")
                    });
                }
                
                reader.Close();

                var hotelsList = new List<object>();
                foreach (var hotel in hotels)
                {
                    var hotelDict = new Dictionary<string, object>
                    {
                        ["maKhachSan"] = ((dynamic)hotel).maKhachSan,
                        ["tenKhachSan"] = ((dynamic)hotel).tenKhachSan,
                        ["diaChi"] = ((dynamic)hotel).diaChi,
                        ["thanhPho"] = ((dynamic)hotel).thanhPho,
                        ["moTa"] = ((dynamic)hotel).moTa,
                        ["danhGiaTrungBinh"] = ((dynamic)hotel).danhGiaTrungBinh,
                        ["ngayTao"] = ((dynamic)hotel).ngayTao,
                        ["giaPhongThapNhat"] = ((dynamic)hotel).giaPhongThapNhat
                    };

                    var images = await GetHotelImages((int)((dynamic)hotel).maKhachSan, connection);
                    hotelDict["hinhAnhs"] = images;
                    
                    hotelsList.Add(hotelDict);
                }

                return Ok(new { success = true, data = hotelsList });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHotelById(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT ks.ma_khach_san, ks.ten_khach_san, ks.dia_chi, ks.thanh_pho, 
                           ks.mo_ta, ks.danh_gia_trung_binh, ks.ngay_tao
                    FROM KhachSan ks 
                    WHERE ks.ma_khach_san = @Id";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Id", id);

                using var reader = await command.ExecuteReaderAsync();
                
                if (!await reader.ReadAsync())
                {
                    return NotFound(new { success = false, message = "Khách sạn không tồn tại" });
                }

                var hotel = new
                {
                    maKhachSan = reader.GetInt32("ma_khach_san"),
                    tenKhachSan = reader.GetString("ten_khach_san"),
                    diaChi = reader.GetString("dia_chi"),
                    thanhPho = reader.IsDBNull("thanh_pho") ? null : reader.GetString("thanh_pho"),
                    moTa = reader.IsDBNull("mo_ta") ? null : reader.GetString("mo_ta"),
                    danhGiaTrungBinh = reader.GetDecimal("danh_gia_trung_binh"),
                    ngayTao = reader.GetDateTime("ngay_tao")
                };
                
                reader.Close();

                var images = await GetHotelImages(id, connection);

                var roomTypesQuery = @"
                    SELECT lp.ma_loai_phong, lp.ten_loai_phong, lp.gia_mot_dem, 
                           lp.suc_chua, lp.mo_ta
                    FROM LoaiPhong lp 
                    WHERE lp.ma_khach_san = @HotelId";

                var roomTypes = new List<object>();
                using var roomCmd = new SqlCommand(roomTypesQuery, connection);
                roomCmd.Parameters.AddWithValue("@HotelId", id);

                using var roomReader = await roomCmd.ExecuteReaderAsync();
                while (await roomReader.ReadAsync())
                {
                    roomTypes.Add(new
                    {
                        maLoaiPhong = roomReader.GetInt32("ma_loai_phong"),
                        tenLoaiPhong = roomReader.GetString("ten_loai_phong"),
                        giaMotDem = roomReader.GetDecimal("gia_mot_dem"),
                        sucChua = roomReader.GetInt32("suc_chua"),
                        moTa = roomReader.IsDBNull("mo_ta") ? null : roomReader.GetString("mo_ta")
                    });
                }

                var result = new
                {
                    maKhachSan = hotel.maKhachSan,
                    tenKhachSan = hotel.tenKhachSan,
                    diaChi = hotel.diaChi,
                    thanhPho = hotel.thanhPho,
                    moTa = hotel.moTa,
                    danhGiaTrungBinh = hotel.danhGiaTrungBinh,
                    ngayTao = hotel.ngayTao,
                    hinhAnhs = images,
                    loaiPhongs = roomTypes
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateHotel([FromBody] CreateHotelRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    INSERT INTO KhachSan (ten_khach_san, dia_chi, thanh_pho, mo_ta, danh_gia_trung_binh, ngay_tao)
                    VALUES (@TenKhachSan, @DiaChi, @ThanhPho, @MoTa, @DanhGiaTrungBinh, @NgayTao);
                    SELECT SCOPE_IDENTITY();";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@TenKhachSan", request.TenKhachSan);
                command.Parameters.AddWithValue("@DiaChi", request.DiaChi);
                command.Parameters.AddWithValue("@ThanhPho", request.ThanhPho ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@MoTa", request.MoTa ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@DanhGiaTrungBinh", request.DanhGiaTrungBinh);
                command.Parameters.AddWithValue("@NgayTao", DateTime.Now);

                var hotelId = await command.ExecuteScalarAsync();

                return Ok(new { 
                    success = true, 
                    message = "Tạo khách sạn thành công",
                    data = new { maKhachSan = Convert.ToInt32(hotelId) }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHotel(int id, [FromBody] UpdateHotelRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    UPDATE KhachSan 
                    SET ten_khach_san = @TenKhachSan,
                        dia_chi = @DiaChi,
                        thanh_pho = @ThanhPho,
                        mo_ta = @MoTa,
                        danh_gia_trung_binh = @DanhGiaTrungBinh
                    WHERE ma_khach_san = @Id";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Id", id);
                command.Parameters.AddWithValue("@TenKhachSan", request.TenKhachSan);
                command.Parameters.AddWithValue("@DiaChi", request.DiaChi);
                command.Parameters.AddWithValue("@ThanhPho", request.ThanhPho ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@MoTa", request.MoTa ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@DanhGiaTrungBinh", request.DanhGiaTrungBinh);

                var rowsAffected = await command.ExecuteNonQueryAsync();

                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Cập nhật khách sạn thành công" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Khách sạn không tồn tại" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHotel(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                try
                {
                    var deleteImagesQuery = "DELETE FROM HinhAnhKhachSan WHERE ma_khach_san = @HotelId";
                    using var deleteImagesCmd = new SqlCommand(deleteImagesQuery, connection, transaction);
                    deleteImagesCmd.Parameters.AddWithValue("@HotelId", id);
                    await deleteImagesCmd.ExecuteNonQueryAsync();

                    var deleteRoomTypesQuery = "DELETE FROM LoaiPhong WHERE ma_khach_san = @HotelId";
                    using var deleteRoomTypesCmd = new SqlCommand(deleteRoomTypesQuery, connection, transaction);
                    deleteRoomTypesCmd.Parameters.AddWithValue("@HotelId", id);
                    await deleteRoomTypesCmd.ExecuteNonQueryAsync();

                    var deleteHotelQuery = "DELETE FROM KhachSan WHERE ma_khach_san = @HotelId";
                    using var deleteHotelCmd = new SqlCommand(deleteHotelQuery, connection, transaction);
                    deleteHotelCmd.Parameters.AddWithValue("@HotelId", id);
                    var rowsAffected = await deleteHotelCmd.ExecuteNonQueryAsync();

                    if (rowsAffected > 0)
                    {
                        transaction.Commit();
                        return Ok(new { success = true, message = "Xóa khách sạn thành công" });
                    }
                    else
                    {
                        transaction.Rollback();
                        return NotFound(new { success = false, message = "Khách sạn không tồn tại" });
                    }
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<List<object>> GetHotelImages(int hotelId, SqlConnection connection)
        {
            var images = new List<object>();
            var imageQuery = @"
                SELECT ma_anh, duong_dan_anh, mo_ta 
                FROM HinhAnhKhachSan 
                WHERE ma_khach_san = @HotelId 
                ORDER BY ma_anh";

            using var imageCmd = new SqlCommand(imageQuery, connection);
            imageCmd.Parameters.AddWithValue("@HotelId", hotelId);

            using var imageReader = await imageCmd.ExecuteReaderAsync();
            while (await imageReader.ReadAsync())
            {
                images.Add(new
                {
                    maAnh = imageReader.GetInt32("ma_anh"),
                    duongDanAnh = imageReader.GetString("duong_dan_anh"),
                    moTa = imageReader.IsDBNull("mo_ta") ? null : imageReader.GetString("mo_ta")
                });
            }

            return images;
        }
    }

    public class CreateHotelRequest
    {
        public string TenKhachSan { get; set; }
        public string DiaChi { get; set; }
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
        public decimal DanhGiaTrungBinh { get; set; } = 4.0m;
    }

    public class UpdateHotelRequest
    {
        public string TenKhachSan { get; set; }
        public string DiaChi { get; set; }
        public string? ThanhPho { get; set; }
        public string? MoTa { get; set; }
        public decimal DanhGiaTrungBinh { get; set; }
    }
}