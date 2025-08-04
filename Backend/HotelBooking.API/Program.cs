using HotelBooking.API.Data;
using HotelBooking.API.Services.Implementations;
using HotelBooking.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Add DbContext
builder.Services.AddDbContext<HotelBookingContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IHotelService, HotelService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IUserService, UserService>();
// Add other services here...

// Add Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"] ?? ""))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
// KHÔNG dùng HTTPS redirect trong development
// app.UseHttpsRedirection();

// === SỬA ĐỔI: Cấu hình static files cho nhiều thư mục ảnh ===

// 1. Thư mục uploads trong project (cho placeholder)
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
var tempPath = Path.Combine(uploadsPath, "temp");
var hotelsPathLocal = Path.Combine(uploadsPath, "hotels");
var roomsPathLocal = Path.Combine(uploadsPath, "rooms");

Console.WriteLine($"Local uploads path: {uploadsPath}");

// Tạo thư mục local nếu chưa có
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine("Created local uploads directory");
}
if (!Directory.Exists(tempPath))
{
    Directory.CreateDirectory(tempPath);
    Console.WriteLine("Created temp directory");
}
if (!Directory.Exists(hotelsPathLocal))
{
    Directory.CreateDirectory(hotelsPathLocal);
    Console.WriteLine("Created local hotels directory");
}
if (!Directory.Exists(roomsPathLocal))
{
    Directory.CreateDirectory(roomsPathLocal);
    Console.WriteLine("Created local rooms directory");
}

// 2. Đường dẫn thực tế của ảnh khách sạn và phòng
var realHotelsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\hotels";
var realRoomsPath = @"D:\Temp\HotelBooking\Backend\HotelBooking.API\uploads\rooms";

Console.WriteLine($"Real hotels path: {realHotelsPath}");
Console.WriteLine($"Real rooms path: {realRoomsPath}");
Console.WriteLine($"Real hotels exists: {Directory.Exists(realHotelsPath)}");
Console.WriteLine($"Real rooms exists: {Directory.Exists(realRoomsPath)}");

// Tạo thư mục thực tế nếu chưa có
if (!Directory.Exists(realHotelsPath))
{
    Directory.CreateDirectory(realHotelsPath);
    Console.WriteLine("Created real hotels directory");
}
if (!Directory.Exists(realRoomsPath))
{
    Directory.CreateDirectory(realRoomsPath);
    Console.WriteLine("Created real rooms directory");
}

// === STATIC FILES CONFIGURATION ===

// 1. Serve ảnh khách sạn từ thư mục thực tế
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(realHotelsPath),
    RequestPath = "/uploads/hotels"
});

// 2. Serve ảnh phòng từ thư mục thực tế  
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(realRoomsPath),
    RequestPath = "/uploads/rooms"
});

// 3. Serve placeholder và temp files từ thư mục local
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(tempPath),
    RequestPath = "/uploads/temp"
});

// 4. Serve các file uploads khác từ thư mục local
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseRouting();

// CORS phải đặt trước Authentication
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add a simple test endpoint
app.MapGet("/", () => "API is running!");

// Test endpoint để kiểm tra static files và ảnh
app.MapGet("/test-image", () => 
{
    var placeholderExists = File.Exists(Path.Combine(tempPath, "hotel-placeholder.jpg"));
    var tempFiles = Directory.Exists(tempPath) ? Directory.GetFiles(tempPath) : new string[0];
    var hotelFiles = Directory.Exists(realHotelsPath) ? Directory.GetFiles(realHotelsPath) : new string[0];
    var roomFiles = Directory.Exists(realRoomsPath) ? Directory.GetFiles(realRoomsPath) : new string[0];
    
    return new { 
        message = "Image test", 
        localUploadsPath = uploadsPath,
        realHotelsPath = realHotelsPath,
        realRoomsPath = realRoomsPath,
        placeholderExists = placeholderExists,
        placeholderPath = Path.Combine(tempPath, "hotel-placeholder.jpg"),
        tempFiles = tempFiles.Select(f => Path.GetFileName(f)).ToArray(),
        hotelFiles = hotelFiles.Select(f => Path.GetFileName(f)).ToArray(),
        roomFiles = roomFiles.Select(f => Path.GetFileName(f)).ToArray()
    };
});

// Test endpoint để kiểm tra từng loại ảnh
app.MapGet("/test-hotel-image/{fileName}", (string fileName) => 
{
    var filePath = Path.Combine(realHotelsPath, fileName);
    var exists = File.Exists(filePath);
    return new { 
        fileName = fileName,
        fullPath = filePath,
        exists = exists,
        url = $"/uploads/hotels/{fileName}"
    };
});

app.MapGet("/test-room-image/{fileName}", (string fileName) => 
{
    var filePath = Path.Combine(realRoomsPath, fileName);
    var exists = File.Exists(filePath);
    return new { 
        fileName = fileName,
        fullPath = filePath,
        exists = exists,
        url = $"/uploads/rooms/{fileName}"
    };
});

app.Run();