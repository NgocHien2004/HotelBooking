// Hotel Detail Page JavaScript
let currentHotelId = null;
let hotelImageSwiper = null;
let currentUserRating = 0; // THÊM MỚI

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelId = urlParams.get("id");

  if (hotelId) {
    currentHotelId = hotelId; // THÊM MỚI
    loadHotelDetails(hotelId);
  } else {
    showError("Không tìm thấy thông tin khách sạn!");
  }
});

// Show/hide loading
function showLoading(show = true) {
  const loading = document.getElementById("loadingSpinner");
  const content = document.getElementById("hotelDetailsSection");
  const error = document.getElementById("errorSection");

  if (show) {
    loading.style.display = "block";
    content.style.display = "none";
    error.style.display = "none";
  } else {
    loading.style.display = "none";
  }
}

// Show error
function showError(message) {
  showLoading(false);
  document.getElementById("errorSection").style.display = "block";
  setTimeout(() => {
    window.location.href = "hotels.html";
  }, 3000);
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
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

// Load hotel details
async function loadHotelDetails(hotelId) {
  try {
    showLoading(true);

    const response = await fetch(getApiUrl(API_ENDPOINTS.HOTELS.GET_BY_ID, { id: hotelId }));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const hotel = result.success && result.data ? result.data : result;
    console.log("Hotel object:", hotel);

    // Kiểm tra xem hotel có dữ liệu không
    if (!hotel || !hotel.maKhachSan) {
      throw new Error("Dữ liệu khách sạn không hợp lệ");
    }

    await displayHotelDetails(hotel);

    // THÊM MỚI - Load reviews
    await loadReviews(hotelId);
    await loadReviewSummary(hotelId);
    await checkCanReview(hotelId);

    showLoading(false);
    document.getElementById("hotelDetailsSection").style.display = "block";
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showError("Không thể tải thông tin khách sạn: " + error.message);
  }
}

// Display hotel details
async function displayHotelDetails(hotel) {
  try {
    console.log("Displaying hotel details:", hotel);

    // Update page title and breadcrumb
    document.title = `${hotel.tenKhachSan} - Hotel Booking`;
    document.getElementById("hotelBreadcrumb").textContent = hotel.tenKhachSan;

    // Hotel basic info
    document.getElementById("hotelName").textContent = hotel.tenKhachSan;
    document.getElementById("hotelAddress").textContent = hotel.diaChi;

    if (hotel.thanhPho) {
      document.getElementById("hotelCity").textContent = hotel.thanhPho;
      document.getElementById("hotelCityContainer").style.display = "block";
    }

    // Rating
    const rating = hotel.danhGiaTrungBinh || 0;
    document.getElementById("hotelRating").innerHTML = `
          ${generateStarRating(rating)}
          <span class="text-muted ms-2">(${rating.toFixed(1)} sao)</span>
      `;

    // Description
    if (hotel.moTa) {
      document.getElementById("hotelDescription").innerHTML = `
              <h5>Mô tả</h5>
              <p>${hotel.moTa}</p>
          `;
    }

    // Amenities
    if (hotel.tienNghi) {
      const amenities = hotel.tienNghi.split(",").map((amenity) => amenity.trim());
      document.getElementById("hotelAmenities").innerHTML = `
              <h5>Tiện ích</h5>
              <div class="amenities-list">
                  ${amenities.map((amenity) => `<span class="badge bg-secondary me-2 mb-2">${amenity}</span>`).join("")}
              </div>
          `;
    }

    // Load images
    await loadHotelImages(hotel);

    // Load room types
    await loadRoomTypes(hotel.maKhachSan);
  } catch (error) {
    console.error("Error displaying hotel details:", error);
    throw error;
  }
}

// Load hotel images
async function loadHotelImages(hotel) {
  const imageSliderWrapper = document.getElementById("imageSliderWrapper");
  imageSliderWrapper.innerHTML = "";

  let images = [];

  if (hotel.hinhAnhs && hotel.hinhAnhs.length > 0) {
    images = hotel.hinhAnhs.map((img) => {
      if (typeof img === "string") {
        return { duongDanAnh: img, moTa: hotel.tenKhachSan };
      }
      return img;
    });
  } else {
    images = [{ duongDanAnh: "", moTa: hotel.tenKhachSan }];
  }

  images.forEach((image) => {
    const imageUrl = getHotelImageUrl(image.duongDanAnh);
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `
          <img src="${imageUrl}" 
               alt="${image.moTa || hotel.tenKhachSan}" 
               class="hotel-detail-image"
               onerror="this.src='${getPlaceholderImageUrl()}'">
      `;
    imageSliderWrapper.appendChild(slide);
  });

  // Update image counter
  document.getElementById("totalImages").textContent = images.length;

  // Initialize Swiper
  if (hotelImageSwiper) {
    hotelImageSwiper.destroy(true, true);
  }

  hotelImageSwiper = new Swiper(".hotelImageSwiper", {
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    on: {
      slideChange: function () {
        document.getElementById("currentImageIndex").textContent = this.realIndex + 1;
      },
    },
  });
}

// Load room types
async function loadRoomTypes(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.ROOMS.ROOM_TYPES_BY_HOTEL, { hotelId }));

    if (!response.ok) {
      throw new Error("Failed to load room types");
    }

    const result = await response.json();
    const roomTypes = result.success ? result.data : result;

    const container = document.getElementById("roomTypesContainer");
    container.innerHTML = "";

    if (!roomTypes || roomTypes.length === 0) {
      container.innerHTML = `
              <div class="col-12 text-center">
                  <div class="alert alert-info">
                      <i class="fas fa-info-circle"></i>
                      Hiện tại chưa có thông tin phòng cho khách sạn này.
                  </div>
              </div>
          `;
      return;
    }

    // Calculate min and max prices
    const prices = roomTypes.map((rt) => rt.giaMotDem);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Update price range display
    const priceRangeElement = document.getElementById("hotelPriceRange");
    if (minPrice === maxPrice) {
      priceRangeElement.innerHTML = `
              <h4 class="text-primary fw-bold">${minPrice.toLocaleString()} VNĐ</h4>
              <p class="text-muted mb-0">/ đêm</p>
          `;
    } else {
      priceRangeElement.innerHTML = `
              <h4 class="text-primary fw-bold">${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} VNĐ</h4>
              <p class="text-muted mb-0">/ đêm</p>
          `;
    }

    roomTypes.forEach((roomType) => {
      const roomCard = createRoomTypeCard(roomType);
      container.appendChild(roomCard);
    });
  } catch (error) {
    console.error("Error loading room types:", error);
    document.getElementById("roomTypesContainer").innerHTML = `
          <div class="col-12">
              <div class="alert alert-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                  Không thể tải thông tin phòng: ${error.message}
              </div>
          </div>
      `;
  }
}

// Create room type card
function createRoomTypeCard(roomType) {
  const div = document.createElement("div");
  div.className = "col-md-6 col-lg-4 mb-4";

  div.innerHTML = `
      <div class="card room-card h-100">
          <div class="card-body">
              <h5 class="card-title text-primary">${roomType.tenLoaiPhong}</h5>
              <p class="card-text">
                  <i class="fas fa-users text-muted"></i>
                  <strong>Sức chứa:</strong> ${roomType.sucChua} người
              </p>
              ${roomType.moTa ? `<p class="card-text">${roomType.moTa}</p>` : ""}
              <div class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                      <h5 class="text-primary fw-bold mb-0">${roomType.giaMotDem.toLocaleString()} VNĐ</h5>
                      <small class="text-muted">/ đêm</small>
                  </div>
                  <button class="btn btn-primary" onclick="bookRoom(${roomType.maLoaiPhong})">
                      <i class="fas fa-calendar-check"></i>
                      Đặt phòng
                  </button>
              </div>
          </div>
      </div>
  `;

  return div;
}

// Book room function
function bookRoom(roomTypeId) {
  const isLoggedIn = localStorage.getItem("token");
  if (!isLoggedIn) {
    showAlert("Vui lòng đăng nhập để đặt phòng!", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  window.location.href = `booking.html?roomTypeId=${roomTypeId}&hotelId=${currentHotelId}`;
}

// Scroll to rooms section
function scrollToRooms() {
  document.getElementById("roomTypesSection").scrollIntoView({ behavior: "smooth" });
}

// ========== THÊM MỚI - FUNCTIONS CHO REVIEWS ==========

// Format date function
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Load reviews function
async function loadReviews(hotelId) {
  try {
    document.getElementById("reviewsLoading").style.display = "block";
    document.getElementById("reviewsList").innerHTML = "";
    document.getElementById("noReviews").style.display = "none";

    const response = await fetch(getApiUrl(API_ENDPOINTS.REVIEWS.GET_BY_HOTEL, { hotelId }));

    if (!response.ok) {
      throw new Error("Failed to load reviews");
    }

    const result = await response.json();
    const reviews = result.success ? result.data : result;

    document.getElementById("reviewsLoading").style.display = "none";

    if (!reviews || reviews.length === 0) {
      document.getElementById("noReviews").style.display = "block";
      return;
    }

    const reviewsList = document.getElementById("reviewsList");
    reviewsList.innerHTML = "";

    reviews.forEach((review) => {
      const reviewCard = createReviewCard(review);
      reviewsList.appendChild(reviewCard);
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
    document.getElementById("reviewsLoading").style.display = "none";
    document.getElementById("reviewsList").innerHTML = `
     <div class="alert alert-danger">
       <i class="fas fa-exclamation-triangle"></i>
       Không thể tải đánh giá: ${error.message}
     </div>
   `;
  }
}

// Create review card function
function createReviewCard(review) {
  const div = document.createElement("div");
  div.className = "card mb-3";

  const rating = review.diemDanhGia || 0;
  const date = formatDate(review.ngayTao);

  div.innerHTML = `
   <div class="card-body">
     <div class="d-flex justify-content-between align-items-start mb-2">
       <div>
         <h6 class="card-title mb-1">${review.hoTenNguoiDung}</h6>
         <div class="mb-2">
           ${generateStarRating(rating)}
           <span class="text-muted ms-2">${rating}/5</span>
         </div>
       </div>
       <small class="text-muted">${date}</small>
     </div>
     ${review.binhLuan ? `<p class="card-text">${review.binhLuan}</p>` : ""}
   </div>
 `;

  return div;
}

// Load review summary function
async function loadReviewSummary(hotelId) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.REVIEWS.GET_SUMMARY, { hotelId }));

    if (!response.ok) {
      throw new Error("Failed to load review summary");
    }

    const result = await response.json();
    const summary = result.success ? result.data : result;

    // Update average rating
    document.getElementById("averageRating").textContent = summary.danhGiaTrungBinh.toFixed(1);
    document.getElementById("averageStars").innerHTML = generateStarRating(summary.danhGiaTrungBinh);
    document.getElementById("totalReviews").textContent = summary.tongSoDanhGia;

    // Update rating breakdown
    const breakdownContainer = document.getElementById("ratingBreakdown");
    breakdownContainer.innerHTML = "";

    for (let i = 5; i >= 1; i--) {
      const count = summary.phanBoSao[i] || 0;
      const percentage = summary.tongSoDanhGia > 0 ? (count / summary.tongSoDanhGia) * 100 : 0;

      const breakdownItem = document.createElement("div");
      breakdownItem.className = "d-flex align-items-center mb-2";
      breakdownItem.innerHTML = `
       <span class="me-2">${i} sao</span>
       <div class="progress flex-grow-1 me-2" style="height: 8px;">
         <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
       </div>
       <small class="text-muted">${count}</small>
     `;
      breakdownContainer.appendChild(breakdownItem);
    }
  } catch (error) {
    console.error("Error loading review summary:", error);
  }
}

// Check if user can review function
async function checkCanReview(hotelId) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.REVIEWS.CAN_REVIEW, { hotelId }), {
      headers: getHeaders(true),
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();
    const canReview = result.success ? result.data.canReview : false;

    if (canReview) {
      document.getElementById("reviewFormContainer").style.display = "block";
      initializeReviewForm();
    }
  } catch (error) {
    console.error("Error checking review permission:", error);
  }
}

// Initialize review form function
function initializeReviewForm() {
  // Star rating interaction
  const stars = document.querySelectorAll(".rating-input i");
  stars.forEach((star, index) => {
    star.addEventListener("mouseover", () => {
      highlightStars(index + 1);
    });

    star.addEventListener("click", () => {
      currentUserRating = index + 1;
      document.getElementById("ratingInput").value = currentUserRating;
      highlightStars(currentUserRating);
    });
  });

  // Reset on mouse leave
  document.querySelector(".rating-input").addEventListener("mouseleave", () => {
    highlightStars(currentUserRating);
  });

  // Form submission
  document.getElementById("reviewForm").addEventListener("submit", submitReview);
}

// Highlight stars function
function highlightStars(rating) {
  const stars = document.querySelectorAll(".rating-input i");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.className = "fas fa-star text-warning";
    } else {
      star.className = "far fa-star text-muted";
    }
  });
}

// Submit review function
async function submitReview(event) {
  event.preventDefault();

  const rating = document.getElementById("ratingInput").value;
  const comment = document.getElementById("reviewComment").value.trim();

  if (!rating) {
    showAlert("Vui lòng chọn số sao đánh giá!", "warning");
    return;
  }

  try {
    const reviewData = {
      maKhachSan: parseInt(currentHotelId),
      diemDanhGia: parseInt(rating),
      binhLuan: comment || null,
    };

    const response = await fetch(getApiUrl(API_ENDPOINTS.REVIEWS.CREATE), {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(reviewData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể gửi đánh giá");
    }

    showAlert("Đánh giá của bạn đã được gửi thành công!", "success");

    // Reset form and hide it
    document.getElementById("reviewForm").reset();
    document.getElementById("reviewFormContainer").style.display = "none";
    currentUserRating = 0;
    highlightStars(0);

    // Reload reviews and summary
    await loadReviews(currentHotelId);
    await loadReviewSummary(currentHotelId);

    // Reload hotel details to update average rating
    location.reload();
  } catch (error) {
    console.error("Error submitting review:", error);
    showAlert("Không thể gửi đánh giá: " + error.message, "danger");
  }
}

// Show alert message function
function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertMessage");
  alertContainer.innerHTML = `
     <div class="alert alert-${type} alert-dismissible fade show" role="alert">
         ${message}
         <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
     </div>
 `;

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const alert = alertContainer.querySelector(".alert");
    if (alert) {
      alert.remove();
    }
  }, 5000);
}
