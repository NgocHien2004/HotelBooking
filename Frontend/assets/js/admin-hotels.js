// Global variables
const API_URL = "http://localhost:5233/api";
let hotels = [];
let currentHotelId = null;
let modal = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin hotels page loaded");

  // Initialize Bootstrap modal
  const modalElement = document.getElementById("hotelDetailsModal");
  if (modalElement) {
    modal = new bootstrap.Modal(modalElement);
  }

  // Load hotels data
  loadHotels();

  // Bind search event
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", filterHotels);
  }
});

// Load hotels from API
async function loadHotels() {
  console.log("Loading hotels...");
  const loadingDiv = document.getElementById("loadingSpinner");

  try {
    if (loadingDiv) loadingDiv.style.display = "block";

    const response = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });

    console.log("Hotels API response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Hotels API response data:", data);

    // Handle different response formats
    if (data.success && data.data) {
      hotels = Array.isArray(data.data) ? data.data : [data.data];
    } else if (Array.isArray(data)) {
      hotels = data;
    } else {
      console.warn("Unexpected data format:", data);
      hotels = [];
    }

    console.log("Processed hotels:", hotels);
    displayHotels();
  } catch (error) {
    console.error("Error loading hotels:", error);
    showAlert(`Lỗi khi tải danh sách khách sạn: ${error.message}`);
    hotels = [];
    displayHotels();
  } finally {
    if (loadingDiv) loadingDiv.style.display = "none";
  }
}

// Display hotels in grid
function displayHotels() {
  const container = document.getElementById("hotelsContainer");
  const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";

  if (!container) {
    console.error("Hotels container not found");
    return;
  }

  // Filter hotels based on search
  let filteredHotels = hotels;
  if (searchValue) {
    filteredHotels = hotels.filter((hotel) => {
      const hotelData = mapHotelData(hotel);
      return (
        hotelData.name.toLowerCase().includes(searchValue) ||
        hotelData.city.toLowerCase().includes(searchValue) ||
        hotelData.address.toLowerCase().includes(searchValue)
      );
    });
  }

  container.innerHTML = "";

  if (filteredHotels.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center">
        <div class="alert alert-info">
          <h4>Không có khách sạn nào</h4>
          <p>Không tìm thấy khách sạn nào phù hợp với tiêu chí tìm kiếm.</p>
          <a href="add-hotel.html" class="btn btn-primary">Thêm khách sạn mới</a>
        </div>
      </div>
    `;
    return;
  }

  filteredHotels.forEach((hotel) => {
    console.log("Processing hotel:", hotel);
    const hotelData = mapHotelData(hotel);
    console.log("Mapped hotel data:", hotelData);
    container.innerHTML += createHotelCard(hotelData);
  });
}

// Map hotel data to consistent format
function mapHotelData(hotel) {
  return {
    id: hotel.maKhachSan || hotel.id,
    name: hotel.tenKhachSan || hotel.name || "Không có tên",
    address: hotel.diaChi || hotel.address || "Không có địa chỉ",
    city: hotel.thanhPho || hotel.city || "Không có thành phố",
    description: hotel.moTa || hotel.description || "",
    rating: hotel.danhGiaTrungBinh || hotel.rating || 0,
    price: hotel.giaPhongThapNhat || hotel.price || 0,
    createdAt: hotel.ngayTao || hotel.createdAt || new Date(),
    amenities: hotel.tienNghi || hotel.amenities || "",
    images: hotel.hinhAnhs || hotel.images || [],
    roomTypes: hotel.loaiPhongs || hotel.roomTypes || [],
  };
}

// Create hotel card for grid view với đầy đủ chức năng CRUD
function createHotelCard(hotel) {
  console.log("[ADMIN] Creating hotel card for:", hotel);

  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";

  if (hotel.images && hotel.images.length > 0) {
    const firstImage = hotel.images[0];
    console.log("[ADMIN] Processing hotel image:", firstImage);

    // Sử dụng hàm getImageUrl từ utils.js hoặc config.js
    if (typeof getImageUrl === "function") {
      imageUrl = getImageUrl(firstImage, "hotel");
    } else if (typeof getHotelImageUrl === "function") {
      imageUrl = getHotelImageUrl(firstImage);
    } else {
      // Fallback processing
      if (typeof firstImage === "string") {
        if (firstImage.startsWith("http")) {
          imageUrl = firstImage;
        } else if (firstImage.startsWith("/uploads")) {
          imageUrl = `http://localhost:5233${firstImage}`;
        } else {
          imageUrl = `http://localhost:5233/uploads/hotels/${firstImage}`;
        }
      } else if (firstImage && firstImage.duongDanAnh) {
        const imgPath = firstImage.duongDanAnh;
        if (imgPath.startsWith("http")) {
          imageUrl = imgPath;
        } else if (imgPath.startsWith("/uploads")) {
          imageUrl = `http://localhost:5233${imgPath}`;
        } else {
          imageUrl = `http://localhost:5233/uploads/hotels/${imgPath}`;
        }
      }
    }

    console.log("[ADMIN] Generated hotel image URL:", imageUrl);
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 hotel-admin-card">
        <img src="${imageUrl}" class="card-img-top" alt="${hotel.name}" 
             onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'; console.log('[ADMIN] Hotel image failed:', this.src);"
             onload="console.log('[ADMIN] Hotel image loaded:', this.src);"
             style="height: 200px; object-fit: cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${hotel.name}</h5>
          <p class="text-muted mb-1"><i class="bi bi-geo-alt"></i> ${hotel.city}</p>
          <p class="text-muted mb-2 small">${hotel.address}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="text-primary fw-bold">
              ${hotel.price > 0 ? formatCurrency(hotel.price) : "Chưa có giá"}
            </span>
            <span class="text-warning">
              <i class="bi bi-star-fill"></i> ${hotel.rating.toFixed(1)}
            </span>
          </div>
          <div class="mt-auto">
            <div class="row g-2">
              <div class="col-12">
                <button type="button" class="btn btn-outline-info btn-sm w-100" onclick="viewHotelDetails(${hotel.id})">
                  <i class="bi bi-eye"></i> Xem Loại Phòng
                </button>
              </div>
              <div class="col-6">
                <button type="button" class="btn btn-outline-warning btn-sm w-100" onclick="editHotel(${hotel.id})">
                  <i class="bi bi-pencil"></i> Sửa
                </button>
              </div>
              <div class="col-6">
                <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="deleteHotel(${hotel.id})">
                  <i class="bi bi-trash"></i> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Filter hotels based on search input
function filterHotels() {
  displayHotels();
}

// View hotel details with room types
async function viewHotelDetails(hotelId) {
  console.log("Viewing hotel details for ID:", hotelId);
  currentHotelId = hotelId;

  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const hotel = data.success && data.data ? data.data : data;
    const hotelData = mapHotelData(hotel);

    // Load room types for this hotel
    const roomTypesResponse = await fetch(`${API_URL}/roomtypes/hotel/${hotelId}`, {
      headers: getAuthHeaders(),
    });

    let roomTypes = [];
    if (roomTypesResponse.ok) {
      const roomTypesData = await roomTypesResponse.json();
      roomTypes = roomTypesData.success && roomTypesData.data ? roomTypesData.data : Array.isArray(roomTypesData) ? roomTypesData : [];
    }

    showHotelDetailsModal(hotelData, roomTypes);
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showAlert(`Lỗi khi tải chi tiết khách sạn: ${error.message}`);
  }
}

// Show hotel details modal
function showHotelDetailsModal(hotel, roomTypes = []) {
  console.log("Showing hotel details:", hotel, "Room types:", roomTypes);

  if (!modal) {
    console.error("Modal not initialized");
    return;
  }

  // Set modal title
  document.getElementById("hotelDetailsTitle").textContent = hotel.name;

  // Create room types section
  let roomTypesHtml = "";
  if (roomTypes && roomTypes.length > 0) {
    roomTypesHtml = `
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6>Loại Phòng (${roomTypes.length})</h6>
          <button class="btn btn-primary btn-sm" onclick="showAddRoomTypeModal(${hotel.id})">
            <i class="bi bi-plus"></i> Thêm Loại Phòng
          </button>
        </div>
        <div class="row">
          ${roomTypes
            .map((roomType) => {
              // Process room type images
              let roomImageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";
              if (roomType.hinhAnhs && roomType.hinhAnhs.length > 0) {
                const firstRoomImage = roomType.hinhAnhs[0];
                console.log("[ADMIN] Processing room image:", firstRoomImage);

                if (typeof getRoomImageUrl === "function") {
                  roomImageUrl = getRoomImageUrl(firstRoomImage);
                } else if (typeof getImageUrl === "function") {
                  roomImageUrl = getImageUrl(firstRoomImage, "room");
                } else {
                  // Fallback processing for room images
                  if (typeof firstRoomImage === "string") {
                    if (firstRoomImage.startsWith("http")) {
                      roomImageUrl = firstRoomImage;
                    } else if (firstRoomImage.startsWith("/uploads")) {
                      roomImageUrl = `http://localhost:5233${firstRoomImage}`;
                    } else {
                      roomImageUrl = `http://localhost:5233/uploads/rooms/${firstRoomImage}`;
                    }
                  } else if (firstRoomImage && firstRoomImage.duongDanAnh) {
                    const imgPath = firstRoomImage.duongDanAnh;
                    if (imgPath.startsWith("http")) {
                      roomImageUrl = imgPath;
                    } else if (imgPath.startsWith("/uploads")) {
                      roomImageUrl = `http://localhost:5233${imgPath}`;
                    } else {
                      roomImageUrl = `http://localhost:5233/uploads/rooms/${imgPath}`;
                    }
                  }
                }

                console.log("[ADMIN] Generated room image URL:", roomImageUrl);
              }

              return `
            <div class="col-md-6 mb-3">
              <div class="card">
                <img src="${roomImageUrl}" 
                     class="card-img-top" 
                     alt="${roomType.tenLoaiPhong || roomType.name}"
                     style="height: 150px; object-fit: cover;"
                     onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'; console.log('[ADMIN] Room image failed:', this.src);"
                     onload="console.log('[ADMIN] Room image loaded:', this.src);">
                <div class="card-body">
                  <h6 class="card-title">${roomType.tenLoaiPhong || roomType.name}</h6>
                  <p class="text-primary fw-bold">${formatCurrency(roomType.giaMotDem || roomType.price || 0)}/đêm</p>
                  <p class="small text-muted">Sức chứa: ${roomType.sucChua || roomType.capacity || 0} người</p>
                  ${roomType.moTa ? `<p class="text-muted small mb-0">${roomType.moTa}</p>` : ""}
                </div>
              </div>
            </div>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
  } else {
    roomTypesHtml = `
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6>Loại Phòng</h6>
          <button class="btn btn-primary btn-sm" onclick="showAddRoomTypeModal(${hotel.id})">
            <i class="bi bi-plus"></i> Thêm Loại Phòng
          </button>
        </div>
        <div class="alert alert-info">
          <p class="mb-0">Chưa có loại phòng nào. Hãy thêm loại phòng đầu tiên!</p>
        </div>
      </div>
    `;
  }

  // Create images section
  let imagesHtml = "";
  if (hotel.images && hotel.images.length > 0) {
    imagesHtml = `
      <div class="mb-4">
        <h6>Hình Ảnh</h6>
        <div class="row">
          ${hotel.images
            .map((image) => {
              let imageUrl;
              if (typeof getImageUrl === "function") {
                imageUrl = getImageUrl(image, "hotel");
              } else if (typeof getHotelImageUrl === "function") {
                imageUrl = getHotelImageUrl(image);
              } else {
                // Fallback
                if (typeof image === "string") {
                  if (image.startsWith("http")) {
                    imageUrl = image;
                  } else if (image.startsWith("/uploads")) {
                    imageUrl = `http://localhost:5233${image}`;
                  } else {
                    imageUrl = `http://localhost:5233/uploads/hotels/${image}`;
                  }
                } else if (image && image.duongDanAnh) {
                  const imgPath = image.duongDanAnh;
                  if (imgPath.startsWith("http")) {
                    imageUrl = imgPath;
                  } else if (imgPath.startsWith("/uploads")) {
                    imageUrl = `http://localhost:5233${imgPath}`;
                  } else {
                    imageUrl = `http://localhost:5233/uploads/hotels/${imgPath}`;
                  }
                } else {
                  imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";
                }
              }

              return `
            <div class="col-md-3 mb-2">
              <img src="${imageUrl}" class="img-fluid rounded" alt="Hotel Image"
                   style="width: 100%; height: 100px; object-fit: cover;"
                   onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg';">
            </div>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  const content = `
    <div class="row mb-3">
      <div class="col-md-6">
        <p><strong>Địa chỉ:</strong> ${hotel.address}</p>
        <p><strong>Thành phố:</strong> ${hotel.city}</p>
        <p><strong>Đánh giá:</strong> <span class="text-warning"><i class="bi bi-star-fill"></i> ${hotel.rating.toFixed(1)}</span></p>
      </div>
      <div class="col-md-6">
        <p><strong>Giá từ:</strong> ${hotel.price > 0 ? formatCurrency(hotel.price) : "Chưa có"}</p>
        <p><strong>Tiện ích:</strong> ${hotel.amenities || "Chưa cập nhật"}</p>
        <p><strong>Ngày tạo:</strong> ${new Date(hotel.createdAt).toLocaleDateString("vi-VN")}</p>
      </div>
    </div>
    
    ${
      hotel.description
        ? `
      <div class="mb-4">
        <h6>Mô tả</h6>
        <p>${hotel.description}</p>
      </div>
    `
        : ""
    }
    
    ${imagesHtml}
    ${roomTypesHtml}
    
    <div class="text-end">
      <button class="btn btn-primary" onclick="editHotel(${hotel.id})">
        <i class="bi bi-pencil"></i> Sửa thông tin khách sạn
      </button>
    </div>
  `;

  document.getElementById("hotelDetailsContent").innerHTML = content;
  modal.show();
}

// Edit hotel
async function editHotel(hotelId) {
  console.log("Editing hotel ID:", hotelId);
  // Redirect to edit page hoặc show edit modal
  window.location.href = `edit-hotel.html?id=${hotelId}`;
}

// Delete hotel
async function deleteHotel(hotelId) {
  if (!confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showAlert("Xóa khách sạn thành công!", "success");
    loadHotels(); // Reload the list
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert(`Lỗi khi xóa khách sạn: ${error.message}`);
  }
}

// Add room type modal placeholder
function showAddRoomTypeModal(hotelId) {
  // Redirect to add room type page hoặc show modal
  window.location.href = `add-room-type.html?hotelId=${hotelId}`;
}
