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

// Create hotel card HTML
function createHotelCard(hotel) {
  const amenities = hotel.amenities ? hotel.amenities.split(",").slice(0, 3) : [];
  const imageUrl =
    hotel.images && hotel.images.length > 0 ? `http://localhost:5233${hotel.images[0]}` : "https://via.placeholder.com/300x200?text=No+Image";

  return `
        <div class="col-md-4 mb-4">
            <div class="card hotel-card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${
    hotel.name
  }" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${hotel.name}</h5>
                    <p class="text-muted mb-2"><i class="bi bi-geo-alt"></i> ${hotel.city}</p>
                    <div class="mb-2">
                        ${amenities.map((a) => `<span class="badge bg-secondary amenity-badge">${a.trim()}</span>`).join("")}
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="hotel-price">${formatCurrency(hotel.price)}/đêm</span>
                        <span class="hotel-rating">
                            <i class="bi bi-star-fill"></i> ${hotel.rating || "4.0"}
                        </span>
                    </div>
                    <a href="hotel-detail.html?id=${hotel.id}" class="btn btn-primary btn-sm mt-3 w-100">Xem chi tiết</a>
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

// Check if token is expired
function isTokenExpired(token) {
  const decoded = parseJwt(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

// Validate token and refresh if needed
function validateToken() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }

  return true;
}

// Format date to Vietnamese format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
