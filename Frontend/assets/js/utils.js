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

// Get image URL helper function - SỬAẠ ĐỔI: Cải thiện logic xử lý đường dẫn
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  // Nếu không có ảnh, trả về placeholder
  if (!image) {
    return placeholderUrl;
  }

  if (typeof image === "string") {
    // Nếu là chuỗi rỗng, trả về placeholder
    if (!image.trim()) {
      return placeholderUrl;
    }

    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      return image;
    }

    // Nếu bắt đầu bằng /uploads thì thêm base URL
    if (image.startsWith("/uploads")) {
      return baseUrl + image;
    }

    // Nếu không có prefix thì thêm path uploads/hotels/
    return `${baseUrl}/uploads/hotels/${image}`;
  }

  // Nếu là object (có thể từ API response)
  if (typeof image === "object") {
    const imagePath = image.duongDanAnh || image.path || image.url;
    if (imagePath) {
      return getImageUrl(imagePath); // Recursive call với string path
    }
  }

  return placeholderUrl;
}

// Create hotel card HTML
function createHotelCard(hotel) {
  const rating = hotel.danhGiaTrungBinh || 0;
  const city = hotel.thanhPho || "";
  const price = hotel.giaMotDem || 0;

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
                         onerror="this.src='${getImageUrl(null)}'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge bg-primary">${rating.toFixed(1)} ⭐</span>
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
                            <span class="h5 text-primary mb-0">${formatCurrency(price)}/đêm</span>
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

    if (userDropdownMenu && user.vaiTro === "Admin") {
      userDropdownMenu.innerHTML = `
        <li><h6 class="dropdown-header">Quản lý</h6></li>
        <li><a class="dropdown-item" href="admin/hotels.html"><i class="fas fa-hotel me-2"></i> Quản lý khách sạn</a></li>
        <li><a class="dropdown-item" href="admin/users.html"><i class="fas fa-users me-2"></i> Quản lý người dùng</a></li>
        <li><a class="dropdown-item" href="admin/bookings.html"><i class="fas fa-calendar-check me-2"></i> Quản lý đặt phòng</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><h6 class="dropdown-header">Tài khoản</h6></li>
        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Thông tin cá nhân</a></li>
        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Đăng xuất</a></li>
      `;
    } else if (userDropdownMenu) {
      userDropdownMenu.innerHTML = `
        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Thông tin cá nhân</a></li>
        <li><a class="dropdown-item" href="my-bookings.html"><i class="fas fa-calendar-check me-2"></i> Đặt phòng của tôi</a></li>
        <li><a class="dropdown-item" href="payment-history.html"><i class="fas fa-credit-card me-2"></i> Lịch sử thanh toán</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Đăng xuất</a></li>
      `;
    }
  } else {
    if (loginMenu) loginMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (adminMenu) adminMenu.style.display = "none";
  }
}

// Logout function
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  }
}

// Date validation functions
function validateDateRange(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    return { valid: false, message: "Ngày nhận phòng không thể là ngày quá khứ" };
  }

  if (checkOut <= checkIn) {
    return { valid: false, message: "Ngày trả phòng phải sau ngày nhận phòng" };
  }

  const maxAdvanceDays = 365;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

  if (checkInDate > maxDate) {
    return { valid: false, message: "Không thể đặt phòng quá 1 năm trước" };
  }

  return { valid: true };
}

// Get booking status badge class - UPDATED với Waiting Payment
function getBookingStatusBadge(status) {
  const statusClasses = {
    Pending: "badge bg-warning text-dark",
    Confirmed: "badge bg-success",
    "Waiting Payment": "badge bg-info",
    Cancelled: "badge bg-danger",
    Completed: "badge bg-primary",
  };
  return statusClasses[status] || "badge bg-secondary";
}

// Get payment method display text
function getPaymentMethodDisplay(method) {
  const methods = {
    Cash: "Tiền mặt",
    "Credit Card": "Thẻ tín dụng",
    "Bank Transfer": "Chuyển khoản ngân hàng",
    "E-Wallet": "Ví điện tử",
  };
  return methods[method] || method;
}

// NEW FUNCTIONS FOR PAYMENT FEATURE

// Get payment status display text
function getPaymentStatus(totalPaid, totalAmount) {
  if (totalPaid >= totalAmount) {
    return { status: "Completed", text: "Đã thanh toán đủ", class: "text-success" };
  } else if (totalPaid > 0) {
    return { status: "Partial", text: "Thanh toán một phần", class: "text-warning" };
  } else {
    return { status: "Unpaid", text: "Chưa thanh toán", class: "text-danger" };
  }
}

// Get payment status class
function getPaymentStatusClass(totalPaid, totalAmount) {
  if (totalPaid >= totalAmount) {
    return "badge bg-success";
  } else if (totalPaid > 0) {
    return "badge bg-warning";
  } else {
    return "badge bg-danger";
  }
}

// Utility to get status text in Vietnamese - UPDATED với Waiting Payment
function getStatusText(status) {
  const statusMap = {
    Pending: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    "Waiting Payment": "Chờ thanh toán",
    Cancelled: "Đã hủy",
    Completed: "Hoàn thành",
  };
  return statusMap[status] || status;
}

// Utility to get status class for badges - UPDATED với Waiting Payment
function getStatusClass(status) {
  const statusClasses = {
    Pending: "bg-warning",
    Confirmed: "bg-success",
    "Waiting Payment": "bg-info",
    Cancelled: "bg-danger",
    Completed: "bg-primary",
  };
  return statusClasses[status] || "bg-secondary";
}

// Show loading spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Đang tải...</p>
            </div>
        `;
  }
}

// Hide loading spinner
function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = "";
  }
}

// Clear an element's content
function clearElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = "";
  }
}
