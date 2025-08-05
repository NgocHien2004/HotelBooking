using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HotelBooking.API.Data;
using HotelBooking.API.Services.Interfaces;
using HotelBooking.API.Services.Implementations;
using HotelBooking.API.Mappings;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework
builder.Services.AddDbContext<HotelBookingContext>(
    options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT Key is not configured");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// Register services với interface
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IHotelService, HotelService>();
builder.Services.AddScoped<IRoomTypeService, RoomTypeService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IImageService, ImageService>();

var app = builder.Build();

// Configure the HTTP request pipeline.

// Tạo thư mục uploads
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
var tempPath = Path.Combine(uploadsPath, "temp");
var hotelsPath = Path.Combine(uploadsPath, "hotels");
var roomsPath = Path.Combine(uploadsPath, "rooms");

Console.WriteLine($"Uploads path: {uploadsPath}");

if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine("Created uploads directory");
}
if (!Directory.Exists(tempPath))
{
    Directory.CreateDirectory(tempPath);
    Console.WriteLine("Created temp directory");
}
if (!Directory.Exists(hotelsPath))
{
    Directory.CreateDirectory(hotelsPath);
    Console.WriteLine("Created hotels directory");
}
if (!Directory.Exists(roomsPath))
{
    Directory.CreateDirectory(roomsPath);
    Console.WriteLine("Created rooms directory");
}

// Kiểm tra file placeholder
var placeholderPath = Path.Combine(tempPath, "hotel-placeholder.jpg");
Console.WriteLine($"Checking placeholder at: {placeholderPath}");
Console.WriteLine($"Placeholder exists: {File.Exists(placeholderPath)}");

// Serve static files từ uploads folder với đường dẫn /uploads
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
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

// Test endpoint để kiểm tra static files và placeholder
app.MapGet("/test-image", () => 
{
    var placeholderExists = File.Exists(Path.Combine(uploadsPath, "temp", "hotel-placeholder.jpg"));
    var files = Directory.Exists(tempPath) ? Directory.GetFiles(tempPath) : new string[0];
    
    return new { 
        message = "Image test", 
        uploadsPath = uploadsPath,
        tempPath = tempPath,
        placeholderExists = placeholderExists,
        placeholderPath = Path.Combine(tempPath, "hotel-placeholder.jpg"),
        filesInTemp = files.Select(f => Path.GetFileName(f)).ToArray()
    };
});

app.Run();