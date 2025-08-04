// Hotel Detail Page JavaScript
let currentHotelId = null;

// Show/hide loading
function showLoading(show = true) {
  const loading = document.getElementById("loadingSpinner");
  if (loading) {
    loading.style.display = show ? "block" : "none";
  }
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

// Load hotel details on page load
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelId = urlParams.get("id");

  if (hotelId) {
    loadHotelDetails(hotelId);
  } else {
    showAlert("Không tìm thấy thông tin khách sạn!", "warning");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }
});

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

    displayHotelDetails(hotel);
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showAlert("Không thể tải thông tin khách sạn. Vui lòng thử lại sau.");
  } finally {
    showLoading(false);
  }
}

function displayHotelDetails(hotel) {
  // Update page title and breadcrumb
  document.title = `${hotel.tenKhachSan} - Hotel Booking`;
  document.getElementById("hotelBreadcrumb").textContent = hotel.tenKhachSan;

  // Main image - UPDATED to use correct path
  const mainImageUrl =
    hotel.hinhAnhs && hotel.hinhAnhs.length > 0 ? getImageUrl(hotel.hinhAnhs[0], "hotel") : `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;

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

  // UPDATED: Use getImageUrl helper for correct paths
  const imagesHtml = additionalImages
    .map(
      (image, index) => `
        <div class="col-md-4 col-sm-6 mb-3">
            <img src="${getImageUrl(image, "hotel")}" 
                 alt="${image.moTa || "Hotel image"}" 
                 class="img-fluid rounded shadow-sm"
                 style="height: 200px; object-fit: cover; width: 100%; cursor: pointer;"
                 onclick="openImageModal('${getImageUrl(image, "hotel")}', '${image.moTa || "Hotel image"}')"
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

  // UPDATED: Get room image with correct path
  const roomImageUrl =
    roomType.hinhAnhs && roomType.hinhAnhs.length > 0
      ? getImageUrl(roomType.hinhAnhs[0], "room")
      : `${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg`;

  return `
        <div class="col-lg-6 col-md-12 mb-4">
            <div class="card room-type-card h-100">
                <img src="${roomImageUrl}" 
                     class="card-img-top" 
                     alt="${roomType.tenLoaiPhong}"
                     style="height: 200px; object-fit: cover;"
                     onerror="this.src='${API_BASE_URL}/uploads/temp/hotel-placeholder.jpg'">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${roomType.tenLoaiPhong}</h5>
                        <span class="badge ${availableRooms > 0 ? "bg-success" : "bg-danger"}">
                            ${availableRooms > 0 ? `${availableRooms} phòng còn trống` : "Hết phòng"}
                        </span>
                    </div>
                    
                    <p class="card-text text-muted">${roomType.moTa || "Không có mô tả"}</p>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Diện tích</small>
                            <div class="fw-bold">${roomType.dienTich || "N/A"} m²</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Sức chứa</small>
                            <div class="fw-bold">${roomType.sucChua || "N/A"} người</div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="price">
                            <span class="text-success fw-bold fs-5">
                                ${formatCurrency(roomType.giaMotDem)}/đêm
                            </span>
                        </div>
                        <div>
                            <button class="btn btn-primary btn-sm" 
                                    ${availableRooms > 0 ? `onclick="bookRoom(${roomType.maLoaiPhong})"` : "disabled"}>
                                ${availableRooms > 0 ? "Đặt phòng" : "Hết phòng"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Open image modal
function openImageModal(imageSrc, imageAlt) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const caption = document.getElementById("imageCaption");

  modal.style.display = "block";
  modalImg.src = imageSrc;
  caption.textContent = imageAlt;
}

// Close image modal
function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}

// Book room function
function bookRoom(roomTypeId) {
  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Vui lòng đăng nhập để đặt phòng!", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  // Redirect to booking page with parameters
  window.location.href = `booking.html?hotel=${currentHotelId}&roomType=${roomTypeId}`;
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeImageModal();
  }
};
