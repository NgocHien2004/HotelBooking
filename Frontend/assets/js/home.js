// Home page functionality
document.addEventListener("DOMContentLoaded", function () {
  loadFeaturedHotels();
});

async function loadFeaturedHotels() {
  showLoading(true);
  debugLog("Loading featured hotels from API...");

  try {
    const url = `${API_BASE_URL}/api/hotels`;
    debugLog("API URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    debugLog("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      debugLog("Error response text:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    debugLog("API Response:", result);

    if (result.success && result.data) {
      // Hiển thị 6 khách sạn đầu tiên (có thể sắp xếp theo rating)
      const featuredHotels = result.data.sort((a, b) => b.danhGiaTrungBinh - a.danhGiaTrungBinh).slice(0, 6);

      debugLog("Featured hotels loaded successfully:", featuredHotels.length);
      displayFeaturedHotels(featuredHotels);
    } else {
      throw new Error(result.message || "Không thể tải danh sách khách sạn");
    }
  } catch (error) {
    console.error("Error loading featured hotels:", error);
    debugLog("Detailed error:", error);
    showError(`Không thể tải khách sạn nổi bật: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function displayFeaturedHotels(hotels) {
  const container = document.getElementById("featuredHotels");

  if (!hotels || hotels.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Hiện tại chưa có khách sạn nào trong hệ thống.
                </div>
            </div>
        `;
    return;
  }

  const hotelsHtml = hotels.map((hotel) => createFeaturedHotelCard(hotel)).join("");
  container.innerHTML = hotelsHtml;
}

function createFeaturedHotelCard(hotel) {
  // Lấy ảnh đầu tiên hoặc ảnh placeholder
  const imageUrl =
    hotel.hinhAnhs && hotel.hinhAnhs.length > 0
      ? `${API_BASE_URL}${hotel.hinhAnhs[0].duongDanAnh}`
      : `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;

  // Tính số loại phòng
  const roomTypesCount = hotel.loaiPhongs ? hotel.loaiPhongs.length : 0;

  // Hiển thị rating
  const rating = hotel.danhGiaTrungBinh || 0;
  const ratingStars = generateStarRating(rating);

  // Giá thấp nhất từ các loại phòng
  let minPrice = null;
  if (hotel.loaiPhongs && hotel.loaiPhongs.length > 0) {
    minPrice = Math.min(...hotel.loaiPhongs.map((room) => room.giaMotDem));
  }

  return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 hotel-card fade-in">
                <div class="position-relative">
                    <img src="${imageUrl}" 
                         class="card-img-top hotel-image" 
                         alt="${hotel.tenKhachSan}"
                         onerror="this.src='${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge bg-primary">${roomTypesCount} loại phòng</span>
                    </div>
                    ${
                      rating >= 4.0
                        ? `
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-success">Nổi bật</span>
                        </div>
                    `
                        : ""
                    }
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${hotel.tenKhachSan}</h5>
                    <div class="mb-2">
                        <i class="fas fa-map-marker-alt text-muted"></i>
                        <span class="text-muted">${truncateText(hotel.diaChi, 50)}</span>
                    </div>
                    ${
                      hotel.thanhPho
                        ? `
                        <div class="mb-2">
                            <i class="fas fa-city text-muted"></i>
                            <span class="text-muted">${hotel.thanhPho}</span>
                        </div>
                    `
                        : ""
                    }
                    <div class="mb-2">
                        ${ratingStars}
                        <span class="text-muted ms-1">(${rating.toFixed(1)})</span>
                    </div>
                    ${
                      minPrice
                        ? `
                        <div class="mb-2">
                            <span class="text-success fw-bold">
                                <i class="fas fa-tag"></i>
                                Từ ${formatCurrency(minPrice)}/đêm
                            </span>
                        </div>
                    `
                        : ""
                    }
                    ${
                      hotel.moTa
                        ? `
                        <p class="card-text flex-grow-1 text-muted">${truncateText(hotel.moTa, 80)}</p>
                    `
                        : ""
                    }
                    <div class="mt-auto">
                        <button class="btn btn-primary w-100" onclick="viewHotelDetails(${hotel.maKhachSan})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHtml = "";

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star text-warning"></i>';
  }

  // Half star
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star text-warning"></i>';
  }

  return starsHtml;
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function viewHotelDetails(hotelId) {
  // Chuyển đến trang chi tiết khách sạn
  window.location.href = `hotel-details.html?id=${hotelId}`;
}

function showLoading(show) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const featuredHotels = document.getElementById("featuredHotels");

  if (show) {
    loadingIndicator.classList.remove("d-none");
    featuredHotels.innerHTML = "";
  } else {
    loadingIndicator.classList.add("d-none");
  }
}

function showError(message) {
  const container = document.getElementById("featuredHotels");
  container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        </div>
    `;
}
