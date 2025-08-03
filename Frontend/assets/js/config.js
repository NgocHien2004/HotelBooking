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

// Debug logging (can be disabled in production)
const DEBUG_MODE = true;

function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
}
