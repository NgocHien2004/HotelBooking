// D:\Temp\HotelBooking\Frontend\assets\js\api.js

const API_BASE_URL = "http://localhost:5233/api";

// API helper functions
const api = {
  // Generic request function
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Hotel APIs
  hotels: {
    getAll: () => api.request("/hotels"),
    getById: (id) => api.request(`/hotels/${id}`),
    create: (data) =>
      api.request("/hotels", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      api.request(`/hotels/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      api.request(`/hotels/${id}`, {
        method: "DELETE",
      }),
    uploadImage: async (id, file) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/hotels/${id}/upload`, {
        method: "POST",
        body: formData,
      });

      return response.json();
    },
  },

  // Room APIs
  rooms: {
    getByHotel: (hotelId) => api.request(`/hotels/${hotelId}/rooms`),
    create: (hotelId, data) =>
      api.request(`/hotels/${hotelId}/rooms`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      api.request(`/rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      api.request(`/rooms/${id}`, {
        method: "DELETE",
      }),
  },

  // Booking APIs
  bookings: {
    getAll: () => api.request("/bookings"),
    getById: (id) => api.request(`/bookings/${id}`),
    create: (data) =>
      api.request("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id, status) =>
      api.request(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // User APIs
  users: {
    getAll: () => api.request("/users"),
    getById: (id) => api.request(`/users/${id}`),
    create: (data) =>
      api.request("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      api.request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      api.request(`/users/${id}`, {
        method: "DELETE",
      }),
  },
};
