// API Configuration
const API_CONFIG = {
  BASE_URL: "http://localhost:5233/api",
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

  // Logout helper
  static logout() {
    this.removeToken();
    this.removeUser();
  }

  // Form validation helpers
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  }

  static validatePassword(password) {
    return password.length >= 6;
  }

  // DOM helpers
  static $(selector) {
    return document.querySelector(selector);
  }

  static $$(selector) {
    return document.querySelectorAll(selector);
  }

  static createElement(tag, className = "", textContent = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static hide(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) {
      element.style.display = "none";
      element.classList.add("hidden");
    }
  }

  static show(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) {
      element.style.display = "";
      element.classList.remove("hidden");
    }
  }

  static toggle(element) {
    if (typeof element === "string") {
      element = this.$(element);
    }
    if (element) {
      if (element.style.display === "none" || element.classList.contains("hidden")) {
        this.show(element);
      } else {
        this.hide(element);
      }
    }
  }

  // Notification helpers
  static showNotification(message, type = "info", duration = 5000) {
    // Remove existing notifications
    const existingNotifications = this.$$(".notification");
    existingNotifications.forEach((notification) => notification.remove());

    // Create notification element
    const notification = this.createElement("div", `notification notification-${type}`);
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add("show"), 100);

    // Auto remove
    setTimeout(() => this.removeNotification(notification), duration);

    // Close button event
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => this.removeNotification(notification));

    return notification;
  }

  static removeNotification(notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }

  static showSuccess(message, duration = 3000) {
    return this.showNotification(message, "success", duration);
  }

  static showError(message, duration = 5000) {
    return this.showNotification(message, "error", duration);
  }

  static showWarning(message, duration = 4000) {
    return this.showNotification(message, "warning", duration);
  }

  static showInfo(message, duration = 3000) {
    return this.showNotification(message, "info", duration);
  }

  // Loading helpers
  static showLoading(selector = "body") {
    const container = this.$(selector);
    if (!container) return;

    const loading = this.createElement("div", "loading-overlay");
    loading.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Đang tải...</p>
      </div>
    `;

    container.appendChild(loading);
    return loading;
  }

  static hideLoading(selector = "body") {
    const container = this.$(selector);
    if (!container) return;

    const loading = container.querySelector(".loading-overlay");
    if (loading) {
      loading.remove();
    }
  }

  // Form helpers
  static clearForm(formSelector) {
    const form = this.$(formSelector);
    if (form) {
      form.reset();
      // Clear all error messages
      const errors = form.querySelectorAll(".form-error");
      errors.forEach((error) => error.remove());
      // Remove error classes
      const fields = form.querySelectorAll(".error");
      fields.forEach((field) => field.classList.remove("error"));
    }
  }

  static setFieldError(fieldName, message) {
    const field = this.$(`[name="${fieldName}"]`);
    if (!field) return;

    // Add error class
    field.classList.add("error");

    // Remove existing error
    const existingError = field.parentNode.querySelector(".form-error");
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
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

  // Date helpers
  static getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  static getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  }

  static formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  // API Error handler
  static handleApiError(error) {
    console.error("API Error:", error);

    if (error.message.includes("401")) {
      this.showError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      this.logout();
      this.redirect("login.html");
    } else if (error.message.includes("403")) {
      this.showError("Bạn không có quyền thực hiện thao tác này.");
    } else if (error.message.includes("404")) {
      this.showError("Không tìm thấy dữ liệu yêu cầu.");
    } else if (error.message.includes("500")) {
      this.showError("Lỗi server. Vui lòng thử lại sau.");
    } else {
      this.showError(error.message || "Đã xảy ra lỗi không xác định.");
    }
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
      pageBtn.onclick = () => onPageChange(i);
      pagination.appendChild(pageBtn);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextBtn = this.createElement("button", "pagination-btn", "Tiếp &raquo;");
      nextBtn.onclick = () => onPageChange(currentPage + 1);
      pagination.appendChild(nextBtn);
    }

    return pagination;
  }
}
