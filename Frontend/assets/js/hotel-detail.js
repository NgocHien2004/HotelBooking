// Hotel Detail Page JavaScript
let currentHotelId = null;
let hotelImageSwiper = null;
let currentUserRating = 0;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelId = urlParams.get("id");

  if (hotelId) {
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

  let stars = "";
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-warning"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt text-warning"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-warning"></i>';
  }
  return stars;
}

// Get image URL helper
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  if (!image) return placeholderUrl;

  if (typeof image === "string") {
    if (!image.trim()) return placeholderUrl;
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads")) return `${baseUrl}${image}`;
    return `${baseUrl}/uploads/hotels/${image}`;
  }

  if (image && image.duongDanAnh) {
    const imagePath = image.duongDanAnh;
    if (!imagePath || !imagePath.trim()) return placeholderUrl;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads")) return `${baseUrl}${imagePath}`;
    return `${baseUrl}/uploads/hotels/${imagePath}`;
  }

  return placeholderUrl;
}

// Load hotel details
async function loadHotelDetails(hotelId) {
  showLoading(true);
  currentHotelId = hotelId;

  try {
    console.log("Loading hotel details for ID:", hotelId);
    const response = await fetch(`${API_URL}/hotels/${hotelId}`);

    console.log("Hotel details response status:", response.status);
    console.log("Hotel details response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hotel details error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Hotel details raw data:", data);

    const hotel = data.success && data.data ? data.data : data;
    console.log("Hotel object:", hotel);

    // Kiểm tra xem hotel có dữ liệu không
    if (!hotel || !hotel.maKhachSan) {
      throw new Error("Dữ liệu khách sạn không hợp lệ");
    }

    await displayHotelDetails(hotel);

    // Load reviews nếu có elements
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
    const breadcrumb = document.getElementById("hotelBreadcrumb");
    if (breadcrumb) {
      breadcrumb.textContent = hotel.tenKhachSan;
    }

    // Hotel basic info
    document.getElementById("hotelName").textContent = hotel.tenKhachSan;
    document.getElementById("hotelAddress").textContent = hotel.diaChi;

    if (hotel.thanhPho) {
      const cityElement = document.getElementById("hotelCity");
      const cityContainer = document.getElementById("hotelCityContainer");
      if (cityElement) cityElement.textContent = hotel.thanhPho;
      if (cityContainer) cityContainer.style.display = "block";
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
              <p class="text-muted">${hotel.moTa}</p>
          `;
    }

    // Amenities
    if (hotel.tienNghi) {
      const amenities = hotel.tienNghi
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a);
      if (amenities.length > 0) {
        document.getElementById("hotelAmenities").innerHTML = `
                  <h6>Tiện ích</h6>
                  <div>
                      ${amenities.map((amenity) => `<span class="amenity-badge">${amenity}</span>`).join("")}
                  </div>
              `;
      }
    }

    // Initialize image slider
    initializeImageSlider(hotel.hinhAnhs || []);

    // Load room types
    await loadRoomTypes(hotel.maKhachSan);

    // Price range from room types
    displayPriceRange();
  } catch (error) {
    console.error("Error displaying hotel details:", error);
    showError("Lỗi hiển thị thông tin khách sạn: " + error.message);
  }
}

// Initialize image slider
function initializeImageSlider(images) {
  const wrapper = document.getElementById("imageSliderWrapper");
  const totalImagesSpan = document.getElementById("totalImages");

  // If no images, show placeholder
  if (!images || images.length === 0) {
    wrapper.innerHTML = `
              <div class="swiper-slide">
                  <img src="http://localhost:5233/uploads/temp/hotel-placeholder.jpg" alt="No image available">
              </div>
          `;
    totalImagesSpan.textContent = "1";
  } else {
    // Add images to slider
    wrapper.innerHTML = images
      .map(
        (image) => `
         <div class="swiper-slide">
                  <img src="${getImageUrl(image)}" alt="${image.moTa || "Hotel image"}" 
                       onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
              </div>
          `
      )
      .join("");
    totalImagesSpan.textContent = images.length;
  }

  // Initialize Swiper
  if (hotelImageSwiper) {
    hotelImageSwiper.destroy(true, true);
  }

  hotelImageSwiper = new Swiper(".hotelImageSwiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: images && images.length > 1,
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

async function loadRoomTypes(hotelId) {
  try {
    console.log("Loading room types for hotel ID:", hotelId);

    let response = await fetch(`${API_URL}/roomtypes/hotel/${hotelId}`);
    console.log("Room types response status:", response.status);

    if (!response.ok) {
      console.log("First endpoint failed, trying alternative endpoint...");
      response = await fetch(`${API_URL}/hotels/${hotelId}/roomtypes`);
      console.log("Alternative endpoint response status:", response.status);
    }

    if (response.ok) {
      const data = await response.json();
      console.log("Room types raw data:", data);

      const roomTypes = data.success && data.data ? data.data : Array.isArray(data) ? data : [];
      console.log("Room types processed:", roomTypes);

      displayRoomTypes(roomTypes);
    } else {
      const errorText = await response.text();
      console.error("Room types error:", errorText);
      displayRoomTypes([]);
    }
  } catch (error) {
    console.error("Error loading room types:", error);
    displayRoomTypes([]);
  }
}

function displayRoomTypes(roomTypes) {
  const container = document.getElementById("roomTypesContainer");

  if (!roomTypes || roomTypes.length === 0) {
    container.innerHTML = `
              <div class="col-12">
                  <div class="alert alert-info text-center">
                      <i class="fas fa-info-circle mb-2"></i>
                      <p class="mb-0">Hiện tại khách sạn này chưa có thông tin về loại phòng.</p>
                  </div>
              </div>
          `;
    return;
  }

  container.innerHTML = roomTypes.map((roomType) => createRoomTypeCard(roomType)).join("");
}

function createRoomTypeCard(roomType) {
  const availableRooms = roomType.phongs ? roomType.phongs.filter((room) => room.trangThai === "Available").length : 0;
  const totalRooms = roomType.phongs ? roomType.phongs.length : 0;

  const roomImageUrl =
    roomType.hinhAnhs && roomType.hinhAnhs.length > 0
      ? getImageUrl(roomType.hinhAnhs[0])
      : "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";

  return `
          <div class="col-md-6 col-lg-4 mb-4">
              <div class="card room-card h-100">
                  <img src="${roomImageUrl}" class="card-img-top" alt="${roomType.tenLoaiPhong}" 
                       style="height: 200px; object-fit: cover;"
                       onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
                  <div class="card-body d-flex flex-column">
                      <h5 class="card-title">${roomType.tenLoaiPhong}</h5>
                      ${roomType.moTa ? `<p class="text-muted small">${roomType.moTa}</p>` : ""}
                      
                      <div class="mt-auto">
                          <div class="d-flex justify-content-between align-items-center mb-2">
                              <span class="fw-bold text-success fs-5">
                                  ${formatCurrency(roomType.giaMotDem)}/đêm
                              </span>
                              <small class="text-muted">
                                  ${availableRooms}/${totalRooms} phòng trống
                              </small>
                          </div>
                          
                          <button class="btn btn-primary w-100" 
                                  ${availableRooms > 0 ? `onclick="bookRoom(${roomType.maLoaiPhong})"` : "disabled"}>
                              <i class="fas fa-bed"></i>
                              ${availableRooms > 0 ? "Đặt phòng" : "Hết phòng"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      `;
}

function displayPriceRange() {
  const roomCards = document.querySelectorAll(".card-title");
  if (roomCards.length === 0) return;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function bookRoom(roomTypeId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Vui lòng đăng nhập để đặt phòng!", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  window.location.href = `booking.html?hotel=${currentHotelId}&roomType=${roomTypeId}`;
}

function scrollToRooms() {
  document.getElementById("roomTypesSection").scrollIntoView({
    behavior: "smooth",
  });
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

// ========== REVIEWS FUNCTIONS ==========

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
    const reviewsLoading = document.getElementById("reviewsLoading");
    const reviewsList = document.getElementById("reviewsList");
    const noReviews = document.getElementById("noReviews");

    if (!reviewsLoading || !reviewsList || !noReviews) {
      console.log("Reviews elements not found - skipping reviews load");
      return;
    }

    reviewsLoading.style.display = "block";
    reviewsList.innerHTML = "";
    noReviews.style.display = "none";

    console.log("Loading reviews for hotel:", hotelId);
    const response = await fetch(`${API_URL}/reviews/hotel/${hotelId}`);
    console.log("Reviews response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Reviews error response:", errorText);
      throw new Error(`Failed to load reviews: ${response.status}`);
    }

    const result = await response.json();
    console.log("Reviews raw data:", result);
    const reviews = result.success ? result.data : result;

    reviewsLoading.style.display = "none";

    if (!reviews || reviews.length === 0) {
      noReviews.style.display = "block";
      return;
    }

    reviews.forEach((review) => {
      const reviewCard = createReviewCard(review);
      reviewsList.appendChild(reviewCard);
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
    const reviewsLoading = document.getElementById("reviewsLoading");
    const reviewsList = document.getElementById("reviewsList");

    if (reviewsLoading) reviewsLoading.style.display = "none";
    if (reviewsList) {
      reviewsList.innerHTML = `
       <div class="alert alert-danger">
         <i class="fas fa-exclamation-triangle"></i>
         Không thể tải đánh giá: ${error.message}
       </div>
     `;
    }
  }
}

// Create review card function
function createReviewCard(review) {
  const div = document.createElement("div");
  div.className = "card mb-3 review-card";

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
    const averageRating = document.getElementById("averageRating");
    const averageStars = document.getElementById("averageStars");
    const totalReviews = document.getElementById("totalReviews");
    const ratingBreakdown = document.getElementById("ratingBreakdown");

    if (!averageRating || !averageStars || !totalReviews || !ratingBreakdown) {
      console.log("Review summary elements not found - skipping summary load");
      return;
    }

    console.log("Loading review summary for hotel:", hotelId);
    const response = await fetch(`${API_URL}/reviews/hotel/${hotelId}/summary`);
    console.log("Review summary response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Review summary error response:", errorText);
      throw new Error(`Failed to load review summary: ${response.status}`);
    }

    const result = await response.json();
    console.log("Review summary data:", result);
    const summary = result.success ? result.data : result;

    // Update average rating
    averageRating.textContent = summary.danhGiaTrungBinh ? summary.danhGiaTrungBinh.toFixed(1) : "0.0";
    averageStars.innerHTML = generateStarRating(summary.danhGiaTrungBinh || 0);
    totalReviews.textContent = summary.tongSoDanhGia || 0;

    // Update rating breakdown
    ratingBreakdown.innerHTML = "";

    if (summary.phanBoSao) {
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
        ratingBreakdown.appendChild(breakdownItem);
      }
    }
  } catch (error) {
    console.error("Error loading review summary:", error);
    // Set default values
    const averageRating = document.getElementById("averageRating");
    const averageStars = document.getElementById("averageStars");
    const totalReviews = document.getElementById("totalReviews");

    if (averageRating) averageRating.textContent = "0.0";
    if (averageStars) averageStars.innerHTML = generateStarRating(0);
    if (totalReviews) totalReviews.textContent = "0";
  }
}

// Check if user can review function
// Check if user can review function - SỬA: Luôn cho phép user đã đăng nhập
async function checkCanReview(hotelId) {
  const token = localStorage.getItem("token");
  console.log("=== DEBUG CHECK CAN REVIEW ===");
  console.log("Token exists:", !!token);

  if (!token) {
    console.log("No token found - user not logged in");
    return;
  }

  try {
    const reviewFormContainer = document.getElementById("reviewFormContainer");
    console.log("Review form container found:", !!reviewFormContainer);

    if (!reviewFormContainer) {
      console.log("Review form container not found - skipping can review check");
      return;
    }

    console.log("Checking if user can review hotel:", hotelId);
    const response = await fetch(`${API_URL}/reviews/can-review/${hotelId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Can review response status:", response.status);

    if (!response.ok) {
      // SỬA: Nếu API fail, vẫn cho phép đánh giá cho user đã đăng nhập
      console.log("API failed, but user is logged in - showing form anyway");
      reviewFormContainer.style.display = "block";
      initializeReviewForm();
      return;
    }

    const result = await response.json();
    console.log("Can review result:", result);
    const canReview = result.success ? result.data.canReview : result.canReview || false;
    console.log("Can review permission:", canReview);

    if (canReview) {
      console.log("User can review - showing form");
      reviewFormContainer.style.display = "block";
      initializeReviewForm();
    } else {
      console.log("User already reviewed this hotel");
      // Có thể hiển thị message user đã đánh giá rồi
      const existingMessage = document.getElementById("alreadyReviewedMessage");
      if (!existingMessage && reviewFormContainer) {
        reviewFormContainer.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            Bạn đã đánh giá khách sạn này rồi.
          </div>
        `;
        reviewFormContainer.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error checking review permission:", error);
    // SỬA: Nếu có lỗi, vẫn cho phép user đã đăng nhập đánh giá
    const reviewFormContainer = document.getElementById("reviewFormContainer");
    if (reviewFormContainer) {
      console.log("Error occurred, but user is logged in - showing form anyway");
      reviewFormContainer.style.display = "block";
      initializeReviewForm();
    }
  }
}

// Initialize review form function
function initializeReviewForm() {
  const stars = document.querySelectorAll(".rating-input i");
  if (stars.length === 0) return;

  stars.forEach((star, index) => {
    star.addEventListener("mouseover", () => {
      highlightStars(index + 1);
    });

    star.addEventListener("click", () => {
      currentUserRating = index + 1;
      const ratingInput = document.getElementById("ratingInput");
      if (ratingInput) {
        ratingInput.value = currentUserRating;
      }
      highlightStars(currentUserRating);
    });
  });

  const ratingInput = document.querySelector(".rating-input");
  if (ratingInput) {
    ratingInput.addEventListener("mouseleave", () => {
      highlightStars(currentUserRating);
    });
  }

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", submitReview);
  }
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

  const ratingInput = document.getElementById("ratingInput");
  const reviewComment = document.getElementById("reviewComment");

  if (!ratingInput || !reviewComment) {
    console.error("Review form elements not found");
    return;
  }

  const rating = ratingInput.value;
  const comment = reviewComment.value.trim();

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

    console.log("Submitting review data:", reviewData);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });

    console.log("Submit review response status:", response.status);

    const result = await response.json();
    console.log("Submit review result:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể gửi đánh giá");
    }

    showAlert("Đánh giá của bạn đã được gửi thành công!", "success");

    // Reset form and hide it
    const reviewForm = document.getElementById("reviewForm");
    const reviewFormContainer = document.getElementById("reviewFormContainer");

    if (reviewForm) reviewForm.reset();
    if (reviewFormContainer) reviewFormContainer.style.display = "none";

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
