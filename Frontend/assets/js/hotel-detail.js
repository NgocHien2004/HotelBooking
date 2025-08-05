// Hotel Detail Page JavaScript
let currentHotelId = null;
let hotelImageSwiper = null;

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
    const response = await fetch(`${API_URL}/hotels/${hotelId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const hotel = data.success && data.data ? data.data : data;

    await displayHotelDetails(hotel);
    showLoading(false);
    document.getElementById("hotelDetailsSection").style.display = "block";
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showError("Không thể tải thông tin khách sạn!");
  }
}

// Display hotel details
async function displayHotelDetails(hotel) {
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

// Load room types
async function loadRoomTypes(hotelId) {
  try {
    const response = await fetch(`${API_URL}/roomtypes/hotel/${hotelId}`);
    if (response.ok) {
      const data = await response.json();
      const roomTypes = data.success && data.data ? data.data : data;
      displayRoomTypes(roomTypes);
    }
  } catch (error) {
    console.error("Error loading room types:", error);
  }
}

// Display room types
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

// Create room type card
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

// Display price range
function displayPriceRange() {
  const roomCards = document.querySelectorAll(".card-title");
  if (roomCards.length === 0) return;

  // This will be updated after room types are loaded
  // For now, we'll update it in the loadRoomTypes function
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Book room function
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

// Scroll to rooms section
function scrollToRooms() {
  document.getElementById("roomTypesSection").scrollIntoView({
    behavior: "smooth",
  });
}

// Show alert message
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
