const API_BASE_URL = "http://localhost:5233";
const API_URL = "http://localhost:5233/api";

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

function getApiUrl(endpoint, params = {}) {
  let url = API_BASE_URL + endpoint;

  Object.keys(params).forEach((key) => {
    url = url.replace(`{${key}}`, params[key]);
  });

  return url;
}

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

function getHotelImageUrl(imagePath) {
  console.log("[DEBUG] Hotel image input:", imagePath);

  if (!imagePath) {
    console.log("[DEBUG] No image path, using placeholder");
    return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
  }

  if (imagePath.startsWith("http")) {
    console.log("[DEBUG] Full URL detected:", imagePath);
    return imagePath;
  }

  if (imagePath.startsWith("/uploads")) {
    console.log("[DEBUG] Uploads path detected:", imagePath);
    return `${API_BASE_URL}${imagePath}`;
  }

  const url = `${API_BASE_URL}/uploads/hotels/${imagePath}`;
  console.log("[DEBUG] Generated hotel URL:", url);
  return url;
}

function getRoomImageUrl(imagePath) {
  console.log("[DEBUG] Room image input:", imagePath);

  if (!imagePath) {
    console.log("[DEBUG] No room image, using placeholder");
    return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
  }

  if (imagePath.startsWith("http")) {
    console.log("[DEBUG] Full URL detected:", imagePath);
    return imagePath;
  }

  if (imagePath.startsWith("/uploads")) {
    console.log("[DEBUG] Uploads path detected:", imagePath);
    return `${API_BASE_URL}${imagePath}`;
  }

  const url = `${API_BASE_URL}/uploads/rooms/${imagePath}`;
  console.log("[DEBUG] Generated room URL:", url);
  return url;
}

function getPlaceholderImageUrl() {
  return `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
}

function debugLog(...args) {
  if (window.location.search.includes("debug=true")) {
    console.log("[DEBUG]", ...args);
  }
}
