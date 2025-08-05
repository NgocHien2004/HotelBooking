// Image utility functions for hotel booking system
// File: Frontend/assets/js/image-utils.js

// Configuration
const IMAGE_CONFIG = {
  API_BASE: "http://localhost:5233",
  PLACEHOLDER: "/uploads/temp/hotel-placeholder.jpg",
  HOTELS_PATH: "/uploads/hotels/",
  ROOMS_PATH: "/uploads/rooms/",
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};

/**
 * Lấy URL ảnh khách sạn với logic ưu tiên
 * 1. Kiểm tra ảnh trong thư mục hotels/
 * 2. Nếu không có thì dùng placeholder
 */
async function getHotelImageUrl(imagePath, hotelId = null) {
  console.log("[DEBUG] Getting hotel image URL:", { imagePath, hotelId });

  try {
    // Nếu không có imagePath, thử lấy từ API
    if (!imagePath && hotelId) {
      const response = await fetch(`${IMAGE_CONFIG.API_BASE}/api/upload/hotels/${hotelId}/main-image`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imagePath) {
          return `${IMAGE_CONFIG.API_BASE}${data.imagePath}`;
        }
      }
    }

    // Nếu có imagePath
    if (imagePath) {
      // Nếu đã là URL đầy đủ
      if (imagePath.startsWith("http")) {
        return imagePath;
      }

      // Nếu đã có /uploads trong path
      if (imagePath.startsWith("/uploads")) {
        const fullUrl = `${IMAGE_CONFIG.API_BASE}${imagePath}`;

        // Kiểm tra ảnh có tồn tại không (optional)
        if (await imageExists(fullUrl)) {
          return fullUrl;
        }
      }

      // Nếu chỉ có tên file, thử tìm trong thư mục hotels
      const hotelUrl = `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.HOTELS_PATH}${imagePath}`;
      if (await imageExists(hotelUrl)) {
        return hotelUrl;
      }
    }

    // Fallback về placeholder
    return `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.PLACEHOLDER}`;
  } catch (error) {
    console.error("[ERROR] Error getting hotel image URL:", error);
    return `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.PLACEHOLDER}`;
  }
}

/**
 * Lấy URL ảnh phòng
 */
async function getRoomImageUrl(imagePath, roomId = null) {
  console.log("[DEBUG] Getting room image URL:", { imagePath, roomId });

  try {
    if (imagePath) {
      if (imagePath.startsWith("http")) {
        return imagePath;
      }

      if (imagePath.startsWith("/uploads")) {
        const fullUrl = `${IMAGE_CONFIG.API_BASE}${imagePath}`;
        if (await imageExists(fullUrl)) {
          return fullUrl;
        }
      }

      // Thử tìm trong thư mục rooms
      const roomUrl = `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.ROOMS_PATH}${imagePath}`;
      if (await imageExists(roomUrl)) {
        return roomUrl;
      }
    }

    // Fallback về placeholder
    return `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.PLACEHOLDER}`;
  } catch (error) {
    console.error("[ERROR] Error getting room image URL:", error);
    return `${IMAGE_CONFIG.API_BASE}${IMAGE_CONFIG.PLACEHOLDER}`;
  }
}

/**
 * Kiểm tra ảnh có tồn tại không
 */
async function imageExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Hàm chung để xử lý ảnh (backward compatibility)
 */
async function getImageUrl(image, imageType = "hotel", entityId = null) {
  console.log("[DEBUG] General image function:", { image, imageType, entityId });

  // Xử lý object với thuộc tính duongDanAnh
  if (image && typeof image === "object" && image.duongDanAnh) {
    image = image.duongDanAnh;
  }

  // Gọi hàm chuyên biệt dựa trên loại ảnh
  if (imageType === "room") {
    return await getRoomImageUrl(image, entityId);
  } else {
    return await getHotelImageUrl(image, entityId);
  }
}

/**
 * Upload ảnh khách sạn
 */
async function uploadHotelImages(hotelId, images) {
  try {
    const formData = new FormData();

    // Thêm tất cả ảnh vào FormData
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    const response = await fetch(`${IMAGE_CONFIG.API_BASE}/api/upload/hotels/${hotelId}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        // Không set Content-Type cho FormData
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

/**
 * Đồng bộ ảnh từ thư mục vào database
 */
async function syncHotelImages(hotelId) {
  try {
    const response = await fetch(`${IMAGE_CONFIG.API_BASE}/api/upload/hotels/${hotelId}/sync`, {
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

/**
 * Lấy danh sách ảnh của khách sạn
 */
async function getHotelImages(hotelId) {
  try {
    const response = await fetch(`${IMAGE_CONFIG.API_BASE}/api/upload/hotels/${hotelId}/images`);

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

/**
 * Test endpoint để debug
 */
async function testHotelImages(hotelId) {
  try {
    const response = await fetch(`${IMAGE_CONFIG.API_BASE}/api/upload/test/${hotelId}`);

    if (response.ok) {
      const result = await response.json();
      console.log("[TEST] Hotel images test result:", result);
      return result;
    }
  } catch (error) {
    console.error("[ERROR] Error testing hotel images:", error);
  }
}

// Export functions for module usage (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getHotelImageUrl,
    getRoomImageUrl,
    getImageUrl,
    uploadHotelImages,
    syncHotelImages,
    getHotelImages,
    testHotelImages,
    imageExists,
  };
}
