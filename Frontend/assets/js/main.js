async function loadFeaturedHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`);
    const data = await response.json();

    let hotels = [];
    if (data.success && data.data) {
      hotels = data.data.slice(0, 3);
    } else if (Array.isArray(data)) {
      hotels = data.slice(0, 3);
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

document.addEventListener("DOMContentLoaded", function () {
  checkAuth();

  if (document.getElementById("featuredHotels")) {
    loadFeaturedHotels();
  }
});
