// API Base URL - Sử dụng port 5233 theo backend của bạn
const API_URL = "http://localhost:5233/api";

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Show alert message
function showAlert(message, type = "danger") {
  const alertDiv = document.getElementById("alertMessage");
  if (alertDiv) {
    alertDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = alertDiv.querySelector(".alert");
      if (alert) {
        alert.classList.remove("show");
        setTimeout(() => {
          alertDiv.innerHTML = "";
        }, 150);
      }
    }, 5000);
  }
}

// === IMAGE URL HELPERS - ĐÃ SỬA ĐỔI HOÀN TOÀN ===

// Hàm chính xử lý URL ảnh - SỬ DỤNG HÀM TỪ CONFIG.JS
function getImageUrl(image, imageType = "hotel") {
  console.log("[UTILS DEBUG] getImageUrl called with:", image, "type:", imageType);

  // Kiểm tra xem có hàm từ config.js không
  if (typeof getHotelImageUrl === "function" && typeof getRoomImageUrl === "function") {
    // Xử lý object với thuộc tính duongDanAnh
    if (image && typeof image === "object" && image.duongDanAnh) {
      image = image.duongDanAnh;
    }

    // Gọi hàm chuyên biệt từ config.js
    if (imageType === "room") {
      return getRoomImageUrl(image);
    } else {
      return getHotelImageUrl(image);
    }
  }

  // Fallback nếu config.js chưa load
  return getImageUrlFallback(image, imageType);
}

// Hàm fallback xử lý ảnh nếu config.js chưa load
function getImageUrlFallback(image, imageType = "hotel") {
  const baseUrl = "http://localhost:5233";

  console.log("[UTILS FALLBACK] Processing:", image, "type:", imageType);

  if (typeof image === "string") {
    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      return image;
    }
    // Nếu bắt đầu bằng /uploads thì thêm base URL
    if (image.startsWith("/uploads")) {
      return `${baseUrl}${image}`;
    }
    // Nếu là đường dẫn tương đối
    if (!image.startsWith("/")) {
      if (imageType === "room") {
        return `${baseUrl}/uploads/rooms/${image}`;
      } else {
        return `${baseUrl}/uploads/hotels/${image}`;
      }
    }
    return `${baseUrl}${image}`;
  }

  if (image && image.duongDanAnh) {
    let imagePath = image.duongDanAnh;

    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    if (imagePath.startsWith("/uploads")) {
      return `${baseUrl}${imagePath}`;
    }
    // Nếu chỉ có tên file, thêm đường dẫn đầy đủ
    if (!imagePath.startsWith("/")) {
      if (imageType === "room") {
        return `${baseUrl}/uploads/rooms/${imagePath}`;
      } else {
        return `${baseUrl}/uploads/hotels/${imagePath}`;
      }
    }
    return `${baseUrl}${imagePath}`;
  }

  // Fallback to placeholder
  return `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;
}

// Get room image URL - WRAPPER cho tương thích ngược
function getRoomImageUrl(image) {
  // Nếu có hàm từ config.js thì dùng, không thì dùng fallback
  if (typeof window.getRoomImageUrl === "function") {
    return window.getRoomImageUrl(image);
  }
  return getImageUrlFallback(image, "room");
}

// Create hotel card HTML - ĐÃ SỬA ĐỔI: Cải thiện xử lý hình ảnh
function createHotelCard(hotel) {
  console.log("[UTILS] Creating hotel card for:", hotel);

  // Map properties từ backend (tiếng Việt) sang frontend (tiếng Anh)
  const hotelData = {
    id: hotel.maKhachSan || hotel.id,
    name: hotel.tenKhachSan || hotel.name,
    city: hotel.thanhPho || hotel.city,
    address: hotel.diaChi || hotel.address,
    price: hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0,
    rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
    description: hotel.moTa || hotel.description,
    images: hotel.hinhAnhs || hotel.hinhAnhKhachSans || hotel.images || [],
    amenities: hotel.tienNghi || hotel.amenities || "",
  };

  console.log("[UTILS] Mapped hotel data:", hotelData);

  const amenities = hotelData.amenities
    ? hotelData.amenities
        .split(",")
        .slice(0, 3)
        .map((amenity) => `<span class="badge bg-light text-dark me-1">${amenity.trim()}</span>`)
        .join("")
    : '<span class="text-muted">Chưa cập nhật</span>';

  // Lấy hình ảnh đầu tiên hoặc placeholder
  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";
  if (hotelData.images && hotelData.images.length > 0) {
    const firstImage = hotelData.images[0];
    console.log("[UTILS] Processing first image:", firstImage);
    imageUrl = getImageUrl(firstImage, "hotel");
    console.log("[UTILS] Generated image URL:", imageUrl);
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm hotel-card">
        <div class="position-relative">
          <img src="${imageUrl}" 
               class="card-img-top" 
               alt="${hotelData.name}" 
               style="height: 200px; object-fit: cover;"
               onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'; console.log('Image failed to load:', this.src);"
               onload="console.log('Image loaded successfully:', this.src);">
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-primary">${hotelData.city}</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${hotelData.name}</h5>
          <p class="card-text text-muted small">${hotelData.address}</p>
          ${
            hotelData.description
              ? `<p class="card-text">${hotelData.description.substring(0, 100)}${hotelData.description.length > 100 ? "..." : ""}</p>`
              : ""
          }
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-success fw-bold">
                ${hotelData.price > 0 ? formatCurrency(hotelData.price) : "Liên hệ"}
              </span>
              <span class="text-warning">
                <i class="bi bi-star-fill"></i> ${hotelData.rating.toFixed(1)}
              </span>
            </div>
            <div class="mb-3">
              ${amenities}
            </div>
            <button class="btn btn-primary w-100" onclick="viewHotelDetails(${hotelData.id})">
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
