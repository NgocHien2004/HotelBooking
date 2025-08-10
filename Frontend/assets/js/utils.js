// API Base URL - Sử dụng port 5233 theo backend của bạn
const API_URL = "http://localhost:5233/api";
const API_BASE_URL = "http://localhost:5233";

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

// Format datetime for display
function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return token && user;
}

// Check if user is admin
function isAdmin() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user && user.vaiTro === "Admin";
}

// Get current user from token
function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.nameid,
      email: payload.email,
      hoTen: payload.given_name,
      vaiTro: payload.role,
    };
  } catch (error) {
    return null;
  }
}

// Get auth headers
function getAuthHeaders(includeContentType = true) {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
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

// SỬA ĐỔI: Get image URL helper function - Sửa đường dẫn placeholder
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  // SỬA ĐỔI: Placeholder nằm trong wwwroot/uploads/temp/
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  console.log("[getImageUrl] Input:", image);

  // Nếu không có ảnh, trả về placeholder
  if (!image) {
    console.log("[getImageUrl] No image, using placeholder");
    return placeholderUrl;
  }

  // Xử lý chuỗi
  if (typeof image === "string") {
    // Nếu là chuỗi rỗng, trả về placeholder
    if (!image.trim()) {
      console.log("[getImageUrl] Empty string, using placeholder");
      return placeholderUrl;
    }

    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      console.log("[getImageUrl] Full URL detected:", image);
      return image;
    }

    // SỬA ĐỔI: Xử lý path từ database
    // Nếu bắt đầu bằng /uploads thì dùng trực tiếp với baseUrl
    if (image.startsWith("/uploads")) {
      const finalUrl = baseUrl + image;
      console.log("[getImageUrl] Uploads path detected, final URL:", finalUrl);
      return finalUrl;
    }

    // Nếu bắt đầu bằng uploads (không có /) thì thêm /
    if (image.startsWith("uploads")) {
      const finalUrl = `${baseUrl}/${image}`;
      console.log("[getImageUrl] Uploads path without slash, final URL:", finalUrl);
      return finalUrl;
    }

    // Nếu không có prefix thì thêm path uploads/hotels/
    const finalUrl = `${baseUrl}/uploads/hotels/${image}`;
    console.log("[getImageUrl] Filename only, final URL:", finalUrl);
    return finalUrl;
  }

  // Xử lý object (từ API response)
  if (typeof image === "object" && image !== null) {
    const imagePath = image.duongDanAnh || image.path || image.url || image.fileName;
    console.log("[getImageUrl] Object detected, path:", imagePath);

    if (imagePath) {
      return getImageUrl(imagePath); // Recursive call với string path
    }
  }

  console.log("[getImageUrl] Fallback to placeholder");
  return placeholderUrl;
}

// Thêm function tính giá phòng thấp nhất
function getMinPriceFromHotel(hotel) {
  // Tính giá phòng thấp nhất từ các loại phòng
  if (hotel.loaiPhongs && hotel.loaiPhongs.length > 0) {
    const prices = hotel.loaiPhongs.map((room) => room.giaMotDem).filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  return hotel.price || 0;
}

// Create hotel card HTML
function createHotelCard(hotel) {
  const rating = hotel.danhGiaTrungBinh || 0;
  const city = hotel.thanhPho || "";
  const minPrice = getMinPriceFromHotel(hotel);

  // Get the main image
  let imageUrl = getImageUrl(null); // Default placeholder
  if (hotel.hinhAnhs && hotel.hinhAnhs.length > 0) {
    imageUrl = getImageUrl(hotel.hinhAnhs[0]);
  }

  return `
        <div class="col-md-4 mb-4">
            <div class="card hotel-card h-100">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="${hotel.tenKhachSan}" 
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white;">
                          ${rating.toFixed(1)} ⭐
                        </span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${hotel.tenKhachSan}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${city}
                    </p>
                    <p class="card-text">${truncateText(hotel.moTa || "", 100)}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold" style="color: #28a745; font-size: 1.1rem;">
                                ${minPrice > 0 ? `Chỉ từ ${formatCurrency(minPrice)}/đêm` : "Liên hệ để biết giá"}
                            </span>
                            <button class="btn btn-outline-primary" onclick="viewHotelDetails(${hotel.maKhachSan})">
                                Xem chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Enhanced API call with better error handling
async function apiCall(endpoint, method = "GET", data = null, customHeaders = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && method !== "GET") {
    if (typeof data === "string") {
      config.body = JSON.stringify(data);
    } else {
      config.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } else {
      // Handle non-JSON responses
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { success: true };
    }
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
}

// Truncate text helper
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// View hotel details
function viewHotelDetails(hotelId) {
  window.location.href = `hotel-detail.html?id=${hotelId}`;
}

// Check auth and update UI
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loginMenu = document.getElementById("loginMenu");
  const userMenu = document.getElementById("userMenu");
  const adminMenu = document.getElementById("adminMenu");
  const username = document.getElementById("username");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  if (token && user.email) {
    if (loginMenu) loginMenu.style.display = "none";
    if (userMenu) {
      userMenu.style.display = "block";
      if (username) username.textContent = user.hoTen || user.email;
    }

    if (adminMenu && user.vaiTro === "Admin") {
      adminMenu.style.display = "block";
    } else if (adminMenu) {
      adminMenu.style.display = "none";
    }

    if (userDropdownMenu) {
      if (user.vaiTro === "Admin") {
        userDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="admin/dashboard.html">Dashboard</a></li>
                    <li><a class="dropdown-item" href="admin/hotels.html">Quản lý khách sạn</a></li>
                    <li><a class="dropdown-item" href="admin/users.html">Quản lý người dùng</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="profile.html">Thông tin cá nhân</a></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">Đăng xuất</a></li>
                `;
      } else {
        userDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="profile.html">Thông tin cá nhân</a></li>
                    <li><a class="dropdown-item" href="my-bookings.html">Đặt phòng của tôi</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">Đăng xuất</a></li>
                `;
      }
    }
  } else {
    if (loginMenu) loginMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (adminMenu) adminMenu.style.display = "none";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function isAuthenticated() {
  return localStorage.getItem("token") !== null;
}
