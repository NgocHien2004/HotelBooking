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
  UPLOAD: {
    HOTELS: "/api/upload/hotels/{hotelId}",
    ROOMS: "/api/upload/rooms/{roomId}",
    GET_HOTEL_IMAGES: "/api/upload/hotels/{hotelId}/images",
    GET_MAIN_IMAGE: "/api/upload/hotels/{hotelId}/main-image",
    DELETE_IMAGE: "/api/upload/images/{imageId}",
    SYNC_IMAGES: "/api/upload/hotels/{hotelId}/sync",
    TEST: "/api/upload/test/{hotelId}",
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

// Get auth headers (backward compatibility)
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// === IMAGE URL HELPERS - ĐÃ CẬP NHẬT ===

// Image configuration
const IMAGE_CONFIG = {
  PLACEHOLDER: "/uploads/temp/hotel-placeholder.jpg",
  HOTELS_PATH: "/uploads/hotels/",
  ROOMS_PATH: "/uploads/rooms/",
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};

// Hàm chính để xử lý URL ảnh khách sạn
function getHotelImageUrl(imagePath, hotelId = null) {
  console.log("[DEBUG] Hotel image input:", imagePath, "hotelId:", hotelId);

  if (!imagePath) {
    console.log("[DEBUG] No image path, using placeholder");
    return `${API_BASE_URL}${IMAGE_CONFIG.PLACEHOLDER}`;
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

  // Nếu chỉ có tên file, ưu tiên thư mục hotels
  const url = `${API_BASE_URL}${IMAGE_CONFIG.HOTELS_PATH}${imagePath}`;
  console.log("[DEBUG] Generated hotel URL:", url);
  return url;
}

// Hàm xử lý URL ảnh phòng
function getRoomImageUrl(imagePath, roomId = null) {
  console.log("[DEBUG] Room image input:", imagePath, "roomId:", roomId);

  if (!imagePath) {
    console.log("[DEBUG] No room image, using placeholder");
    return `${API_BASE_URL}${IMAGE_CONFIG.PLACEHOLDER}`;
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

  // Nếu chỉ có tên file, thử thư mục rooms
  const url = `${API_BASE_URL}${IMAGE_CONFIG.ROOMS_PATH}${imagePath}`;
  console.log("[DEBUG] Generated room URL:", url);
  return url;
}

// Hàm lấy placeholder
function getPlaceholderImageUrl() {
  return `${API_BASE_URL}${IMAGE_CONFIG.PLACEHOLDER}`;
}

// Hàm tổng quát để xử lý ảnh (backward compatibility)
function getImageUrl(image, imageType = "hotel", entityId = null) {
  console.log("[DEBUG] General image function - input:", image, "type:", imageType, "entityId:", entityId);

  // Xử lý object với thuộc tính duongDanAnh
  if (image && typeof image === "object" && image.duongDanAnh) {
    image = image.duongDanAnh;
  }

  // Gọi hàm chuyên biệt dựa trên loại ảnh
  if (imageType === "room") {
    return getRoomImageUrl(image, entityId);
  } else {
    return getHotelImageUrl(image, entityId);
  }
}

// === API HELPER FUNCTIONS ===

// Upload ảnh khách sạn
async function uploadHotelImages(hotelId, images) {
  try {
    const formData = new FormData();

    // Thêm tất cả ảnh vào FormData
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.HOTELS, { hotelId }), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        // Không set Content-Type cho FormData, để browser tự set
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log("[SUCCESS] Images uploaded:", result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message || "Có lỗi khi upload ảnh");
    }
  } catch (error) {
    console.error("[ERROR] Error uploading images:", error);
    throw error;
  }
}

// Lấy danh sách ảnh của khách sạn
async function getHotelImages(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.GET_HOTEL_IMAGES, { hotelId }));

    if (response.ok) {
      const result = await response.json();
      return result.data || [];
    } else {
      console.warn(`[WARNING] Could not get images for hotel ${hotelId}`);
      return [];
    }
  } catch (error) {
    console.error("[ERROR] Error getting hotel images:", error);
    return [];
  }
}

// Lấy ảnh chính của khách sạn
async function getHotelMainImage(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.GET_MAIN_IMAGE, { hotelId }));

    if (response.ok) {
      const result = await response.json();
      return result.imagePath || IMAGE_CONFIG.PLACEHOLDER;
    } else {
      console.warn(`[WARNING] Could not get main image for hotel ${hotelId}`);
      return IMAGE_CONFIG.PLACEHOLDER;
    }
  } catch (error) {
    console.error("[ERROR] Error getting hotel main image:", error);
    return IMAGE_CONFIG.PLACEHOLDER;
  }
}

// Đồng bộ ảnh từ thư mục vào database
async function syncHotelImages(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.SYNC_IMAGES, { hotelId }), {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("[SUCCESS] Images synced:", result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message || "Có lỗi khi đồng bộ ảnh");
    }
  } catch (error) {
    console.error("[ERROR] Error syncing images:", error);
    throw error;
  }
}

// Xóa ảnh
async function deleteHotelImage(imageId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.DELETE_IMAGE, { imageId }), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("[SUCCESS] Image deleted:", result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message || "Có lỗi khi xóa ảnh");
    }
  } catch (error) {
    console.error("[ERROR] Error deleting image:", error);
    throw error;
  }
}

// Test endpoint để debug
async function testHotelImages(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD.TEST, { hotelId }));

    if (response.ok) {
      const result = await response.json();
      console.log("[TEST] Hotel images test result:", result);
      return result;
    }
  } catch (error) {
    console.error("[ERROR] Error testing hotel images:", error);
  }
}

// Kiểm tra ảnh có tồn tại không
async function imageExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Debug logging (có thể tắt trong production)
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

// Backward compatibility
const API_URL = API_BASE_URL + "/api";
