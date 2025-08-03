// Hotel details page functionality
let currentHotel = null;

document.addEventListener("DOMContentLoaded", function () {
  initializeHotelDetailsPage();
});

async function initializeHotelDetailsPage() {
  try {
    const hotelId = getHotelIdFromUrl();
    if (!hotelId) {
      showError("ID khách sạn không hợp lệ");
      return;
    }

    await loadHotelDetails(hotelId);
  } catch (error) {
    console.error("Error initializing hotel details page:", error);
    showError("Có lỗi xảy ra khi tải trang");
  }
}

function getHotelIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  return id ? parseInt(id) : null;
}

async function loadHotelDetails(hotelId) {
  showLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}`);

    if (!response.ok) {
      if (response.status === 404) {
        showError("Không tìm thấy khách sạn");
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      currentHotel = result.data;
      displayHotelDetails(currentHotel);
    } else {
      throw new Error(result.message || "Không thể tải thông tin khách sạn");
    }
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showError("Không thể tải thông tin khách sạn. Vui lòng thử lại sau.");
  } finally {
    showLoading(false);
  }
}

function displayHotelDetails(hotel) {
  // Update page title and breadcrumb
  document.title = `${hotel.tenKhachSan} - Hotel Booking`;
  document.getElementById("hotelBreadcrumb").textContent = hotel.tenKhachSan;

  // Main image
  const mainImageUrl =
    hotel.hinhAnhs && hotel.hinhAnhs.length > 0
      ? `${API_BASE_URL}${hotel.hinhAnhs[0].duongDanAnh}`
      : `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;

  const mainImage = document.getElementById("hotelMainImage");
  mainImage.src = mainImageUrl;
  mainImage.alt = hotel.tenKhachSan;
  mainImage.onerror = function () {
    this.src = `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;
  };

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
        <span class="text-muted ms-1">(${rating.toFixed(1)} sao)</span>
    `;

  // Description
  if (hotel.moTa) {
    document.getElementById("hotelDescription").innerHTML = `
            <h5>Mô tả</h5>
            <p class="text-muted">${hotel.moTa}</p>
        `;
  }

  // Price range
  if (hotel.loaiPhongs && hotel.loaiPhongs.length > 0) {
    const prices = hotel.loaiPhongs.map((room) => room.giaMotDem);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    document.getElementById("hotelPriceRange").innerHTML = `
            <h6>Giá phòng</h6>
            <div class="text-success fw-bold fs-5">
                <i class="fas fa-tag"></i>
                ${minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}/đêm
            </div>
        `;
  }

  // Display image gallery
  displayImageGallery(hotel.hinhAnhs);

  // Display room types
  displayRoomTypes(hotel.loaiPhongs);

  // Show the content
  document.getElementById("hotelDetailsSection").style.display = "block";
}

function displayImageGallery(images) {
  if (!images || images.length <= 1) {
    return; // Don't show gallery if only one or no images
  }

  const galleryContainer = document.getElementById("imageGallery");
  const gallerySection = document.getElementById("hotelGallery");

  // Skip the first image as it's already shown as main image
  const additionalImages = images.slice(1);

  if (additionalImages.length === 0) {
    return;
  }

  const imagesHtml = additionalImages
    .map(
      (image, index) => `
        <div class="col-md-4 col-sm-6 mb-3">
            <img src="${API_BASE_URL}${image.duongDanAnh}" 
                 alt="${image.moTa || "Hotel image"}" 
                 class="img-fluid rounded shadow-sm"
                 style="height: 200px; object-fit: cover; width: 100%; cursor: pointer;"
                 onclick="openImageModal('${API_BASE_URL}${image.duongDanAnh}', '${image.moTa || "Hotel image"}')"
                 onerror="this.src='${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg'">
        </div>
    `
    )
    .join("");

  galleryContainer.innerHTML = imagesHtml;
  gallerySection.style.display = "block";
}

function displayRoomTypes(roomTypes) {
  const container = document.getElementById("roomTypesContainer");

  if (!roomTypes || roomTypes.length === 0) {
    container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Hiện tại khách sạn này chưa có thông tin về loại phòng.
                </div>
            </div>
        `;
    return;
  }

  const roomTypesHtml = roomTypes.map((roomType) => createRoomTypeCard(roomType)).join("");
  container.innerHTML = roomTypesHtml;
}

function createRoomTypeCard(roomType) {
  const availableRooms = roomType.phongs ? roomType.phongs.filter((room) => room.trangThai === "Available").length : 0;
  const totalRooms = roomType.phongs ? roomType.phongs.length : 0;

  return `
        <div class="col-lg-6 col-md-12 mb-4">
            <div class="card room-type-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${roomType.tenLoaiPhong}</h5>
                        <span class="badge ${availableRooms > 0 ? "bg-success" : "bg-danger"}">
                            ${availableRooms > 0 ? `${availableRooms} phòng trống` : "Hết phòng"}
                        </span>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Sức chứa</small>
                            <div class="fw-bold">
                                <i class="fas fa-users"></i> ${roomType.sucChua} người
                            </div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Tổng số phòng</small>
                            <div class="fw-bold">
                                <i class="fas fa-door-open"></i> ${totalRooms} phòng
                            </div>
                        </div>
                    </div>
                    
                    ${
                      roomType.moTa
                        ? `
                        <p class="card-text text-muted">${roomType.moTa}</p>
                    `
                        : ""
                    }
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <div class="text-success fw-bold fs-5">
                            ${formatCurrency(roomType.giaMotDem)}/đêm
                        </div>
                        <button class="btn btn-primary ${availableRooms === 0 ? "disabled" : ""}" 
                                ${availableRooms > 0 ? `onclick="bookRoom(${roomType.maLoaiPhong})"` : ""}>
                            <i class="fas fa-calendar-check"></i>
                            ${availableRooms > 0 ? "Đặt phòng" : "Hết phòng"}
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

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function bookRoom(roomTypeId) {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn cần đăng nhập để đặt phòng");
    window.location.href = "login.html";
    return;
  }

  // Chuyển đến trang đặt phòng với thông tin loại phòng
  window.location.href = `booking.html?hotelId=${currentHotel.maKhachSan}&roomTypeId=${roomTypeId}`;
}

function openImageModal(imageUrl, altText) {
  // Create modal if it doesn't exist
  let modal = document.getElementById("imageModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.innerHTML = `
            <div class="modal fade" id="imageModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Hình ảnh khách sạn</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img id="modalImage" src="" alt="" class="img-fluid">
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  }

  // Set image and show modal
  document.getElementById("modalImage").src = imageUrl;
  document.getElementById("modalImage").alt = altText;

  const bootstrapModal = new bootstrap.Modal(document.getElementById("imageModal"));
  bootstrapModal.show();
}

function showLoading(show) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const detailsSection = document.getElementById("hotelDetailsSection");
  const errorSection = document.getElementById("errorSection");

  if (show) {
    loadingIndicator.classList.remove("d-none");
    detailsSection.style.display = "none";
    errorSection.style.display = "none";
  } else {
    loadingIndicator.classList.add("d-none");
  }
}

function showError(message) {
  const errorSection = document.getElementById("errorSection");
  const detailsSection = document.getElementById("hotelDetailsSection");
  const loadingIndicator = document.getElementById("loadingIndicator");

  loadingIndicator.classList.add("d-none");
  detailsSection.style.display = "none";
  errorSection.style.display = "block";
}
