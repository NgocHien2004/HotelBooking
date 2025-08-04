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

// Get image URL helper function
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";

  if (typeof image === "string") {
    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      return image;
    }
    // Nếu bắt đầu bằng /uploads thì thêm base URL
    if (image.startsWith("/uploads")) {
      return `${baseUrl}${image}`;
    }
    // Nếu không có /uploads thì thêm vào
    return `${baseUrl}/uploads/${image}`;
  }

  if (image && image.duongDanAnh) {
    if (image.duongDanAnh.startsWith("http")) {
      return image.duongDanAnh;
    }
    if (image.duongDanAnh.startsWith("/uploads")) {
      return `${baseUrl}${image.duongDanAnh}`;
    }
    return `${baseUrl}/uploads/${image.duongDanAnh}`;
  }

  // Fallback to placeholder
  return `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;
}

// Create hotel card HTML - Hỗ trợ cả property tiếng Việt và tiếng Anh
function createHotelCard(hotel) {
  // Map properties từ backend (tiếng Việt) sang frontend (tiếng Anh)
  const hotelData = {
    id: hotel.maKhachSan || hotel.id,
    name: hotel.tenKhachSan || hotel.name,
    city: hotel.thanhPho || hotel.city,
    address: hotel.diaChi || hotel.address,
    price: hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0,
    rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
    description: hotel.moTa || hotel.description,
    images: hotel.hinhAnhs || hotel.images || [],
    amenities: hotel.tienNghi || hotel.amenities || "",
  };

  const amenities = hotelData.amenities ? hotelData.amenities.split(",").slice(0, 3) : [];

  // Xử lý đường dẫn hình ảnh với fallback tốt hơn
  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg"; // Default placeholder

  if (hotelData.images && hotelData.images.length > 0) {
    imageUrl = getImageUrl(hotelData.images[0]);
  }

  return `
        <div class="col-md-4 mb-4">
            <div class="card hotel-card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${hotelData.name}" 
                     onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'"
                     style="height: 200px; object-fit: cover; width: 100%;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${hotelData.name}</h5>
                    <p class="text-muted mb-2"><i class="bi bi-geo-alt"></i> ${hotelData.city}</p>
                    <div class="mb-2">
                        ${amenities.map((a) => `<span class="badge bg-secondary amenity-badge">${a.trim()}</span>`).join("")}
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="hotel-price">
                            ${hotelData.price > 0 ? `Từ ${formatCurrency(hotelData.price)}/đêm` : "Liên hệ"}
                        </span>
                        <span class="hotel-rating">
                            <i class="bi bi-star-fill"></i> ${hotelData.rating}
                        </span>
                    </div>
                    <a href="hotel-detail.html?id=${hotelData.id}" class="btn btn-primary btn-sm mt-3 w-100">Xem chi tiết</a>
                </div>
            </div>
        </div>
    `;
}

// Parse JWT token
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// Check admin access
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.vaiTro || user.vaiTro !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
