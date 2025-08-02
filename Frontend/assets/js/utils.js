// API Configuration
const API_CONFIG = {
  BASE_URL: "https://localhost:7001/api",
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
  },
};

// Utils class containing helper functions
class Utils {
  // API Helper methods
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config = {
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        ...API_CONFIG.HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  static async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.makeRequest(url, {
      method: "GET",
    });
  }

  static async post(endpoint, data) {
    return this.makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data) {
    return this.makeRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: "DELETE",
    });
  }

  // Local Storage helpers
  static setToken(token) {
    localStorage.setItem("auth_token", token);
  }

  static getToken() {
    return localStorage.getItem("auth_token");
  }

  static removeToken() {
    localStorage.removeItem("auth_token");
  }

  static setUser(user) {
    localStorage.setItem("user_data", JSON.stringify(user));
  }

  static getUser() {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  }

  static removeUser() {
    localStorage.removeItem("user_data");
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static isAdmin() {
    const user = this.getUser();
    return user && user.vaiTro === "Admin";
  }

  // Form validation helpers
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }

  static validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return !phone || phoneRegex.test(phone.replace(/\D/g, ""));
  }

  static validateRequired(value) {
    return value && value.toString().trim().length > 0;
  }

  // Date helpers
  static formatDate(date) {
    return new Date(date).toLocaleDateString("vi-VN");
  }

  static formatDateTime(date) {
    return new Date(date).toLocaleString("vi-VN");
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  static formatNumber(number) {
    return new Intl.NumberFormat("vi-VN").format(number);
  }

  static getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  static getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  static calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // DOM helpers
  static $(selector) {
    return document.querySelector(selector);
  }

  static $$(selector) {
    return document.querySelectorAll(selector);
  }

  static createElement(tag, className = "", innerHTML = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }

  static hide(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) element.classList.add("hidden");
  }

  static show(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) element.classList.remove("hidden");
  }

  static toggle(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) element.classList.toggle("hidden");
  }

  // Alert/Notification helpers
  static showAlert(message, type = "info", duration = 5000) {
    // Remove existing alerts
    const existingAlerts = this.$$(".alert");
    existingAlerts.forEach((alert) => alert.remove());

    const alert = this.createElement(
      "div",
      `alert alert-${type}`,
      `
            <i class="fas fa-${this.getAlertIcon(type)}"></i>
            <span>${message}</span>
        `
    );

    // Insert at the beginning of body
    document.body.insertBefore(alert, document.body.firstChild);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, duration);
    }

    return alert;
  }

  static getAlertIcon(type) {
    const icons = {
      success: "check-circle",
      error: "times-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  static showSuccess(message, duration = 5000) {
    return this.showAlert(message, "success", duration);
  }

  static showError(message, duration = 5000) {
    return this.showAlert(message, "error", duration);
  }

  static showWarning(message, duration = 5000) {
    return this.showAlert(message, "warning", duration);
  }

  static showInfo(message, duration = 5000) {
    return this.showAlert(message, "info", duration);
  }

  // Loading helpers
  static showLoading(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) {
      element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Đang tải...</p>
                </div>
            `;
    }
  }

  static hideLoading(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) {
      const loading = element.querySelector(".loading");
      if (loading) loading.remove();
    }
  }

  // Modal helpers
  static showModal(modalId) {
    const modal = this.$(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  static hideModal(modalId) {
    const modal = this.$(modalId);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Form helpers
  static clearForm(formElement) {
    if (typeof formElement === "string") {
      formElement = this.$(formElement);
    }
    if (formElement) {
      formElement.reset();
      // Clear validation errors
      const errorElements = formElement.querySelectorAll(".form-error");
      errorElements.forEach((error) => error.remove());
      const inputElements = formElement.querySelectorAll(".form-input.error");
      inputElements.forEach((input) => input.classList.remove("error"));
    }
  }

  static getFormData(formElement) {
    if (typeof formElement === "string") {
      formElement = this.$(formElement);
    }
    if (!formElement) return {};

    const formData = new FormData(formElement);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }

  static setFormData(formElement, data) {
    if (typeof formElement === "string") {
      formElement = this.$(formElement);
    }
    if (!formElement || !data) return;

    Object.keys(data).forEach((key) => {
      const input = formElement.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = data[key] || "";
      }
    });
  }

  static showFieldError(fieldName, message) {
    const field = this.$(`[name="${fieldName}"]`);
    if (!field) return;

    // Remove existing error
    this.clearFieldError(fieldName);

    // Add error class
    field.classList.add("error");

    // Add error message
    const errorElement = this.createElement("div", "form-error", message);
    field.parentNode.appendChild(errorElement);
  }

  static clearFieldError(fieldName) {
    const field = this.$(`[name="${fieldName}"]`);
    if (!field) return;

    field.classList.remove("error");
    const errorElement = field.parentNode.querySelector(".form-error");
    if (errorElement) {
      errorElement.remove();
    }
  }

  // URL helpers
  static getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (let [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }

  static setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, "", url);
  }

  static removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, "", url);
  }

  static redirect(url) {
    window.location.href = url;
  }

  static reload() {
    window.location.reload();
  }

  // Debounce helper
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Pagination helpers
  static createPagination(currentPage, totalPages, onPageChange) {
    const pagination = this.createElement("div", "pagination");

    // Previous button
    if (currentPage > 1) {
      const prevBtn = this.createElement("button", "pagination-btn", "&laquo; Trước");
      prevBtn.onclick = () => onPageChange(currentPage - 1);
      pagination.appendChild(prevBtn);
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = this.createElement("button", `pagination-btn ${i === currentPage ? "active" : ""}`, i.toString());
      if (i !== currentPage) {
        pageBtn.onclick = () => onPageChange(i);
      }
      pagination.appendChild(pageBtn);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextBtn = this.createElement("button", "pagination-btn", "Sau &raquo;");
      nextBtn.onclick = () => onPageChange(currentPage + 1);
      pagination.appendChild(nextBtn);
    }

    return pagination;
  }

  // Image helpers
  static getPlaceholderImage(width = 400, height = 300) {
    return `assets/images/hotel-placeholder.jpg`;
  }

  static handleImageError(imgElement) {
    imgElement.src = this.getPlaceholderImage();
    imgElement.onerror = null; // Prevent infinite loop
  }

  // Rating helpers
  static createStarRating(rating, maxRating = 5) {
    const container = this.createElement("div", "star-rating");

    for (let i = 1; i <= maxRating; i++) {
      const star = this.createElement("i", `fas fa-star ${i <= rating ? "filled" : "empty"}`);
      container.appendChild(star);
    }

    return container;
  }

  // Search helpers
  static highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  // Error handling
  static handleApiError(error) {
    console.error("API Error:", error);

    if (error.message) {
      this.showError(error.message);
    } else {
      this.showError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  }

  // Logout helper
  static logout() {
    this.removeToken();
    this.removeUser();
    this.redirect("index.html");
  }

  // Check authentication and redirect if needed
  static requireAuth() {
    if (!this.isLoggedIn()) {
      this.showWarning("Vui lòng đăng nhập để tiếp tục");
      this.redirect("login.html");
      return false;
    }
    return true;
  }

  static requireAdmin() {
    if (!this.isLoggedIn()) {
      this.showWarning("Vui lòng đăng nhập để tiếp tục");
      this.redirect("login.html");
      return false;
    }

    if (!this.isAdmin()) {
      this.showError("Bạn không có quyền truy cập trang này");
      this.redirect("index.html");
      return false;
    }

    return true;
  }
}

// Export Utils for use in other files
window.Utils = Utils;
