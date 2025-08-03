// Main.js - Common functions for the application
// API_URL được định nghĩa trong utils.js

// Load featured hotels on homepage
async function loadFeaturedHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`);
    const data = await response.json();

    // Kiểm tra response format từ backend
    let hotels = [];
    if (data.success && data.data) {
      hotels = data.data.slice(0, 3); // Lấy 3 khách sạn đầu tiên
    } else if (Array.isArray(data)) {
      hotels = data.slice(0, 3); // Fallback nếu response trực tiếp là array
    }

    const container = document.getElementById("featuredHotels");
    if (!container) return;

    container.innerHTML = "";

    if (hotels.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center">
          <p>Không có khách sạn nào để hiển thị.</p>
        </div>
      `;
      return;
    }

    hotels.forEach((hotel) => {
      container.innerHTML += createHotelCard(hotel);
    });
  } catch (error) {
    console.error("Error loading featured hotels:", error);
    const container = document.getElementById("featuredHotels");
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-danger">Có lỗi xảy ra khi tải danh sách khách sạn.</p>
        </div>
      `;
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuth();

  // Load featured hotels if on homepage
  if (document.getElementById("featuredHotels")) {
    loadFeaturedHotels();
  }
});
