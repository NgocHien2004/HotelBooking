// API Configuration
const API_BASE_URL = "http://localhost:5233";
const API_URL = "http://localhost:5233/api"; // Đảm bảo dòng này có mặt

// API Endpoints
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
  },
  HOTELS: {
    GET_ALL: "/api/hotels",
    GET_BY_ID: "/api/hotels/{id}",
    SEARCH: "/api/hotels/search",
  },
  ROOMS: {
    GET_ALL: "/api/rooms",
    GET_BY_HOTEL: "/api/rooms/hotel/{hotelId}",
    GET_ROOM_TYPES: "/api/rooms/types",
    ROOM_TYPES_BY_HOTEL: "/api/roomtypes/hotel/{hotelId}",
  },
  BOOKINGS: {
    GET_ALL: "/api/bookings",
    CREATE: "/api/bookings",
    GET_BY_USER: "/api/bookings/user/{userId}",
  },
};

// Utility function to build full API URL
function getApiUrl(endpoint, params = {}) {
  let url = API_BASE_URL + endpoint;

  // Replace path parameters
  Object.keys(params).forEach((key) => {
    url = url.replace(`{${key}}`, params[key]);
  });

  return url;
}

// Default headers for API requests
function getHeaders(includeAuth = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Hàm chính để xử lý URL ảnh khách sạn
function getHotelImageUrl(imagePath) {
  console.log("[DEBUG] Hotel image input:", imagePath);

  if (!imagePath) {
    console.log("[DEBUG] No image path, using placeholder");
    return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
  }

  // Nếu đã là URL đầy đủ
  if (imagePath.startsWith("http")) {
    console.log("[DEBUG] Full URL detected:", imagePath);
    return imagePath;
  }

  // Nếu đã có /uploads trong path
  if (imagePath.startsWith("/uploads")) {
    console.log("[DEBUG] Uploads path detected:", imagePath);
    return `${API_BASE_URL}${imagePath}`;
  }

  // Nếu chỉ có tên file
  const url = `${API_BASE_URL}/uploads/hotels/${imagePath}`;
  console.log("[DEBUG] Generated hotel URL:", url);
  return url;
}

// Hàm xử lý URL ảnh phòng
function getRoomImageUrl(imagePath) {
  console.log("[DEBUG] Room image input:", imagePath);

  if (!imagePath) {
    console.log("[DEBUG] No room image, using placeholder");
    return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
  }

  // Nếu đã là URL đầy đủ
  if (imagePath.startsWith("http")) {
    console.log("[DEBUG] Full URL detected:", imagePath);
    return imagePath;
  }

  // Nếu đã có /uploads trong path
  if (imagePath.startsWith("/uploads")) {
    console.log("[DEBUG] Uploads path detected:", imagePath);
    return `${API_BASE_URL}${imagePath}`;
  }

  // Nếu chỉ có tên file
  const url = `${API_BASE_URL}/uploads/rooms/${imagePath}`;
  console.log("[DEBUG] Generated room URL:", url);
  return url;
}

// Hàm lấy placeholder
function getPlaceholderImageUrl() {
  return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
}

// Debug function
function debugLog(...args) {
  if (window.location.search.includes("debug=true")) {
    console.log("[DEBUG]", ...args);
  }
}
