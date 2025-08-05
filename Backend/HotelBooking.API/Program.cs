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

// Tạo thư mục uploads trực tiếp trong project root (không dùng wwwroot)
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
app.UseStaticFiles();
app.Run();