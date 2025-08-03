// Main.js - Common functions for the application
// API_URL được định nghĩa trong utils.js

// Load featured hotels on homepage
async function loadFeaturedHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels?limit=3`);
    const hotels = await response.json();

    const container = document.getElementById("featuredHotels");
    if (!container) return;

    container.innerHTML = "";

    hotels.forEach((hotel) => {
      container.innerHTML += createHotelCard(hotel);
    });
  } catch (error) {
    console.error("Error loading featured hotels:", error);
  }
}

// Create hotel card HTML - moved to utils.js
// Use createHotelCard from utils.js

// Format currency - moved to utils.js
// Use formatCurrency from utils.js

// Show alert message - moved to utils.js
// Use showAlert from utils.js

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Load featured hotels if on homepage
  if (document.getElementById("featuredHotels")) {
    loadFeaturedHotels();
  }
});
