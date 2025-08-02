/**
 * Admin Panel JavaScript
 * Shared functions and utilities for hotel booking admin
 */

// API Configuration
const API_CONFIG = {
  BASE_URL: "https://localhost:5233/api",
  ENDPOINTS: {
    AUTH: "/Auth",
    HOTELS: "/KhachSan",
    ROOMS: "/Phong",
    ROOM_TYPES: "/LoaiPhong",
    BOOKINGS: "/DatPhong",
    USERS: "/User",
    PAYMENTS: "/ThanhToan",
    REVIEWS: "/DanhGia",
    UPLOAD: "/Upload",
  },
};

// Global Admin Class
class HotelAdmin {
  constructor() {
    this.token = localStorage.getItem("adminToken");
    this.user = this.getCurrentUser();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthentication();
  }

  // ========== AUTHENTICATION ==========
  checkAuthentication() {
    if (!this.token || !this.user) {
      this.redirectToLogin();
      return false;
    }

    // Update user display
    const adminNameElement = document.getElementById("adminName");
    if (adminNameElement && this.user) {
      adminNameElement.textContent = this.user.hoTen || "Admin";
    }

    return true;
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem("adminUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  redirectToLogin() {
    const currentPath = window.location.pathname;
    const depth = currentPath.split("/").length - 2; // Calculate folder depth
    const loginPath = "../".repeat(depth) + "login.html";
    window.location.href = loginPath;
  }

  logout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      this.redirectToLogin();
    }
  }

  // ========== API METHODS ==========
  async makeRequest(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;
    const config = {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.redirectToLogin();
        return null;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // ========== UI HELPERS ==========
  showAlert(message, type = "danger", containerId = "alertContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertIcons = {
      success: "check-circle",
      warning: "exclamation-triangle",
      danger: "exclamation-circle",
      info: "info-circle",
    };

    container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${alertIcons[type]} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = container.querySelector(".alert");
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }

  showLoading(show, elementId = "loadingState") {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? "block" : "none";
    }
  }

  setButtonLoading(button, isLoading, originalText = "") {
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang xử lý...
            `;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || originalText;
    }
  }

  // ========== EVENT LISTENERS ==========
  setupEventListeners() {
    // Sidebar toggle for mobile
    document.addEventListener("click", (e) => {
      if (e.target.closest('[data-toggle="sidebar"]')) {
        this.toggleSidebar();
      }

      // Close sidebar when clicking outside
      const sidebar = document.getElementById("sidebar");
      if (sidebar && !sidebar.contains(e.target) && !e.target.closest('[data-toggle="sidebar"]') && sidebar.classList.contains("show")) {
        sidebar.classList.remove("show");
      }
    });

    // Global logout buttons
    document.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="logout"]')) {
        e.preventDefault();
        this.logout();
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("show");
    }
  }

  // ========== UTILITY FUNCTIONS ==========
  formatDate(dateString, options = {}) {
    const defaultOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...options,
    };

    return new Date(dateString).toLocaleDateString("vi-VN", defaultOptions);
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString("vi-VN");
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  generateStars(rating, showNumber = true) {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('<i class="fas fa-star text-warning"></i>');
    }

    if (hasHalfStar) {
      stars.push('<i class="fas fa-star-half-alt text-warning"></i>');
    }

    const emptyStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push('<i class="far fa-star text-warning"></i>');
    }

    const starsHtml = stars.join("");
    return showNumber ? `${starsHtml} <small class="text-muted">(${rating || 0}/5)</small>` : starsHtml;
  }

  truncateText(text, length = 50) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  }

  debounce(func, wait) {
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

  // ========== DATA MANAGEMENT ==========
  async loadDashboardStats() {
    try {
      const [hotels, rooms, bookings, users] = await Promise.all([
        this.makeRequest(API_CONFIG.ENDPOINTS.HOTELS),
        this.makeRequest(API_CONFIG.ENDPOINTS.ROOMS),
        this.makeRequest(API_CONFIG.ENDPOINTS.BOOKINGS),
        this.makeRequest(API_CONFIG.ENDPOINTS.USERS),
      ]);

      return {
        hotels: hotels?.length || 0,
        rooms: rooms?.length || 0,
        bookings: bookings?.length || 0,
        users: users?.length || 0,
      };
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      return { hotels: 0, rooms: 0, bookings: 0, users: 0 };
    }
  }

  // ========== IMAGE HANDLING ==========
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF, WebP)");
    }

    if (file.size > maxSize) {
      throw new Error("File quá lớn! Tối đa 5MB");
    }

    return true;
  }

  createImagePreview(file, onRemove) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const container = document.createElement("div");
        container.className = "uploaded-image position-relative";
        container.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" class="img-thumbnail">
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 remove-image" 
                            style="transform: translate(50%, -50%);">
                        <i class="fas fa-times"></i>
                    </button>
                `;

        const removeBtn = container.querySelector(".remove-image");
        removeBtn.addEventListener("click", () => {
          container.remove();
          if (onRemove) onRemove();
        });

        resolve(container);
      };
      reader.readAsDataURL(file);
    });
  }

  // ========== FORM VALIDATION ==========
  validateRequired(fields) {
    const errors = [];

    fields.forEach((field) => {
      const element = document.getElementById(field.id);
      const value = element?.value?.trim();

      if (!value) {
        errors.push(field.message || `${field.label || field.id} là bắt buộc`);
        element?.focus();
      }
    });

    return errors;
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  }
}

// Initialize Admin when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.hotelAdmin = new HotelAdmin();
});

// Global utility functions for backward compatibility
function toggleSidebar() {
  window.hotelAdmin?.toggleSidebar();
}

function logout() {
  window.hotelAdmin?.logout();
}

function checkAuth() {
  return window.hotelAdmin?.checkAuthentication();
}

function showAlert(message, type = "danger") {
  window.hotelAdmin?.showAlert(message, type);
}

function formatDate(dateString) {
  return window.hotelAdmin?.formatDate(dateString);
}

function formatCurrency(amount) {
  return window.hotelAdmin?.formatCurrency(amount);
}

function generateStars(rating) {
  return window.hotelAdmin?.generateStars(rating);
}
