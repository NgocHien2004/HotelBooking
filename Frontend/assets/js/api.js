const API_URL = "http://localhost:5233/api";

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

function createHotelCard(hotel) {
  const amenities = hotel.amenities ? hotel.amenities.split(",").slice(0, 3) : [];
  const imageUrl =
    hotel.images && hotel.images.length > 0 ? `http://localhost:3000${hotel.images[0]}` : "https://via.placeholder.com/300x200?text=No+Image";

  return `
        <div class="col-md-4 mb-4">
            <div class="card hotel-card">
                <img src="${imageUrl}" class="card-img-top" alt="${hotel.name}">
                <div class="card-body">
                    <h5 class="card-title">${hotel.name}</h5>
                    <p class="text-muted mb-2"><i class="bi bi-geo-alt"></i> ${hotel.city}</p>
                    <div class="mb-2">
                        ${amenities.map((a) => `<span class="badge bg-secondary amenity-badge">${a.trim()}</span>`).join("")}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="hotel-price">${formatCurrency(hotel.price)}/đêm</span>
                        <span class="hotel-rating">
                            <i class="bi bi-star-fill"></i> ${hotel.rating || "4.0"}
                        </span>
                    </div>
                    <a href="hotel-detail.html?id=${hotel.id}" class="btn btn-primary btn-sm mt-3 w-100">Xem chi tiết</a>
                </div>
            </div>
        </div>
    `;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function showAlert(message, type = "danger") {
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

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("featuredHotels")) {
    loadFeaturedHotels();
  }
});
