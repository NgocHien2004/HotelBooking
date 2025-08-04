// API Configuration
const API_BASE_URL = "http://localhost:5233";

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

// === IMAGE URL HELPERS - ĐÃ SỬA ĐỔI ===

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

// Hàm tổng quát xử lý ảnh (backward compatibility)
function getImageUrl(image, imageType = "hotel") {
  console.log("[DEBUG] General image function - input:", image, "type:", imageType);

  // Xử lý object với thuộc tính duongDanAnh
  if (image && typeof image === "object" && image.duongDanAnh) {
    image = image.duongDanAnh;
  }

  // Gọi hàm chuyên biệt dựa trên loại ảnh
  if (imageType === "room") {
    return getRoomImageUrl(image);
  } else {
    return getHotelImageUrl(image);
  }
}

// Debug logging (can be disabled in production)
const DEBUG_MODE = true;

function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
}

// Test functions để debug ảnh
function testImageUrls() {
  console.log("=== IMAGE URL TESTS ===");

  // Test cases
  const testCases = [
    { input: "hotel1.jpg", type: "hotel", expected: "hotels folder" },
    { input: "room1.jpg", type: "room", expected: "rooms folder" },
    { input: "/uploads/hotels/hotel2.jpg", type: "hotel", expected: "full path" },
    { input: "http://example.com/image.jpg", type: "hotel", expected: "external URL" },
    { input: null, type: "hotel", expected: "placeholder" },
    { input: undefined, type: "room", expected: "placeholder" },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}:`, test.input, "->", getImageUrl(test.input, test.type));
  });

  console.log("=== END TESTS ===");
}
