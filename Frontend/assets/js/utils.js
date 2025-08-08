// Enhanced API configuration
const API_BASE_URL = "http://localhost:5233";
const API_URL = "http://localhost:5233/api";

// Authentication helpers
function isAuthenticated() {
  return localStorage.getItem("token") !== null;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("vi-VN");
}

function showAlert(message, type = "info") {
  const alertDiv = document.getElementById("alertMessage");
  if (alertDiv) {
    alertDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    setTimeout(() => {
      alertDiv.innerHTML = "";
    }, 5000);
  }
}

// Date validation helpers
function validateDateRange(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    return { valid: false, message: "Ngày nhận phòng không thể là ngày trong quá khứ" };
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

// Get booking status badge class với trạng thái thanh toán mới
function getBookingStatusBadge(status) {
  const statusClasses = {
    Pending: "badge bg-warning text-dark",
    Confirmed: "badge bg-success",
    Cancelled: "badge bg-danger",
    Completed: "badge bg-info",
    "Awaiting Payment": "badge bg-secondary", // Chờ thanh toán
  };
  return statusClasses[status] || "badge bg-secondary";
}

// Get status text in Vietnamese
function getStatusText(status) {
  const statusTexts = {
    Pending: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Cancelled: "Đã hủy",
    Completed: "Hoàn thành",
    "Awaiting Payment": "Chờ thanh toán",
  };
  return statusTexts[status] || status;
}

// Get status class for styling
function getStatusClass(status) {
  const statusClasses = {
    Pending: "bg-warning text-dark",
    Confirmed: "bg-success",
    Cancelled: "bg-danger",
    Completed: "bg-info",
    "Awaiting Payment": "bg-secondary",
  };
  return statusClasses[status] || "bg-secondary";
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

// Calculate nights between dates
function calculateNights(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
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

// Format payment status for display
function getPaymentStatus(totalPaid, totalAmount) {
  if (totalPaid === 0) {
    return { text: "Chưa thanh toán", class: "text-danger" };
  } else if (totalPaid < totalAmount) {
    return { text: "Thanh toán một phần", class: "text-warning" };
  } else {
    return { text: "Đã thanh toán đủ", class: "text-success" };
  }
}
