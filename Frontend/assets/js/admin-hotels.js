// Admin Hotels Management
let allHotels = [];
let currentView = "grid"; // chỉ còn grid view
let currentHotelId = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing admin hotels page...");
  loadHotels();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Chỉ còn grid view - loại bỏ table view
  document.getElementById("gridViewBtn").addEventListener("click", () => switchView("grid"));

  // Ẩn nút table view
  const tableViewBtn = document.getElementById("tableViewBtn");
  if (tableViewBtn) {
    tableViewBtn.style.display = "none";
  }

  // Search
  document.getElementById("searchInput").addEventListener("input", filterHotels);

  // Setup form handlers
  setupFormHandlers();
}

// Setup form handlers
function setupFormHandlers() {
  // Edit hotel form
  const editHotelForm = document.getElementById("editHotelForm");
  if (editHotelForm) {
    editHotelForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateHotel();
    });
  }

  // Add room type form
  const addRoomTypeForm = document.getElementById("addRoomTypeForm");
  if (addRoomTypeForm) {
    addRoomTypeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addRoomType();
    });
  }

  // Edit room type form
  const editRoomTypeForm = document.getElementById("editRoomTypeForm");
  if (editRoomTypeForm) {
    editRoomTypeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateRoomType();
    });
  }
}

// Switch view (chỉ còn grid)
function switchView(view) {
  currentView = "grid";
  document.getElementById("gridViewBtn").classList.add("active");
  document.getElementById("hotelsGridView").style.display = "flex";

  // Ẩn table view
  const tableView = document.getElementById("hotelsTableView");
  if (tableView) {
    tableView.style.display = "none";
  }

  displayHotels();
}

// Load hotels with improved error handling and debug
async function loadHotels() {
  console.log("Loading hotels...");
  console.log("API_URL:", API_URL);

  try {
    // Check if API_URL is defined
    if (!API_URL) {
      console.error("API_URL is not defined!");
      showAlert("Lỗi cấu hình: API_URL không được định nghĩa", "danger");
      return;
    }

    const url = `${API_URL}/hotels`;
    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Raw response data:", data);

    // Handle different response formats
    if (data.success && data.data) {
      allHotels = data.data;
      console.log("Hotels from data.data:", allHotels);
    } else if (Array.isArray(data)) {
      allHotels = data;
      console.log("Hotels from direct array:", allHotels);
    } else {
      console.error("Unexpected data format:", data);
      allHotels = [];
    }

    console.log("Final allHotels array:", allHotels);
    console.log("Hotels count:", allHotels.length);

    displayHotels();
  } catch (error) {
    console.error("Error loading hotels:", error);
    showAlert(`Không thể tải danh sách khách sạn: ${error.message}`, "danger");

    // Show empty state
    const container = document.getElementById("hotelsGridView");
    container.innerHTML = `
      <div class="col-12 text-center">
        <div class="alert alert-warning">
          <h4>Không thể tải dữ liệu</h4>
          <p>Lỗi: ${error.message}</p>
          <button class="btn btn-primary" onclick="loadHotels()">Thử lại</button>
        </div>
      </div>
    `;
  }
}

// Display hotels - chỉ grid view
function displayHotels() {
  console.log("Displaying hotels in grid view");
  console.log("Hotels to display:", allHotels.length);

  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filteredHotels = allHotels.filter((hotel) => {
    const hotelName = hotel.tenKhachSan || hotel.name || "";
    const hotelCity = hotel.thanhPho || hotel.city || "";
    const hotelAddress = hotel.diaChi || hotel.address || "";

    return (
      hotelName.toLowerCase().includes(searchTerm) || hotelCity.toLowerCase().includes(searchTerm) || hotelAddress.toLowerCase().includes(searchTerm)
    );
  });

  console.log("Filtered hotels:", filteredHotels.length);
  displayGridView(filteredHotels);
}

// Display hotels in grid view
function displayGridView(hotels) {
  const container = document.getElementById("hotelsGridView");

  if (!container) {
    console.error("Grid view container not found!");
    return;
  }

  container.innerHTML = "";

  if (hotels.length === 0) {
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

  hotels.forEach((hotel) => {
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

// Create hotel card for grid view với đầy đủ chức năng CRUD - SỬA ĐỔI QUAN TRỌNG
function createHotelCard(hotel) {
  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";

  // Xử lý ảnh thật từ database - QUAN TRỌNG
  if (hotel.images && hotel.images.length > 0) {
    const firstImage = hotel.images[0];
    imageUrl = getImageUrl(firstImage);
  }

  // Truncate name và address cho giao diện gọn
  const truncatedName = hotel.name.length > 30 ? hotel.name.substring(0, 30) + "..." : hotel.name;
  const truncatedAddress = hotel.address.length > 50 ? hotel.address.substring(0, 50) + "..." : hotel.address;

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card hotel-admin-card fade-in">
        <!-- Image Container - NO CROP -->
        <div class="position-relative">
          <img src="${imageUrl}" 
               class="card-img-top" 
               alt="${hotel.name}" 
               onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg';">
          
          <!-- Status Badge -->
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-success">
              <i class="bi bi-check-circle"></i> Hoạt động
            </span>
          </div>

          <!-- Image Count Badge -->
          ${
            hotel.images && hotel.images.length > 0
              ? `
          <div class="position-absolute bottom-0 start-0 m-2">
            <span class="badge bg-dark bg-opacity-75">
              <i class="bi bi-images"></i> ${hotel.images.length}
            </span>
          </div>
          `
              : ""
          }
        </div>

        <div class="card-body">
          <h5 class="card-title" title="${hotel.name}">${truncatedName}</h5>
          
          <div class="mb-2">
            <small class="text-muted">
              <i class="bi bi-geo-alt-fill"></i> ${hotel.city}
            </small>
          </div>
          
          <div class="mb-2">
            <small class="text-muted" title="${hotel.address}">
              <i class="bi bi-building"></i> ${truncatedAddress}
            </small>
          </div>

          <div class="mb-3">
            <div class="row">
              <div class="col-6">
                <small class="text-muted d-block">Giá từ:</small>
                <span class="text-success fw-bold">
                  ${hotel.price > 0 ? formatCurrency(hotel.price) : "Chưa có"}
                </span>
              </div>
              <div class="col-6">
                <small class="text-muted d-block">Đánh giá:</small>
                <span class="text-warning fw-bold">
                  <i class="bi bi-star-fill"></i> ${hotel.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="row g-2">
            <div class="col-12">
              <button type="button" class="btn btn-outline-info btn-sm w-100" onclick="viewHotelDetails(${hotel.id})">
                <i class="bi bi-eye"></i> Xem Chi Tiết & Phòng
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-outline-warning btn-sm w-100" onclick="editHotel(${hotel.id})">
                <i class="bi bi-pencil-square"></i> Sửa
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="deleteHotel(${hotel.id})">
                <i class="bi bi-trash3"></i> Xóa
              </button>
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

// Get image URL helper - SỬA ĐỔI: Cải thiện xử lý ảnh
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  console.log("Processing image:", image); // Debug

  if (!image) {
    console.log("No image provided, using placeholder"); // Debug
    return placeholderUrl;
  }

  if (typeof image === "string") {
    if (!image.trim()) {
      return placeholderUrl;
    }

    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      console.log("Full URL detected:", image); // Debug
      return image;
    }

    // Nếu bắt đầu bằng /uploads thì thêm API_URL
    if (image.startsWith("/uploads")) {
      const url = `${baseUrl}${image}`;
      console.log("Uploads path detected, generated:", url); // Debug
      return url;
    }

    // Nếu chỉ có tên file
    const url = `${baseUrl}/uploads/hotels/${image}`;
    console.log("Filename only, generated:", url); // Debug
    return url;
  }

  if (image && image.duongDanAnh) {
    const imagePath = image.duongDanAnh;
    console.log("Object with duongDanAnh:", imagePath); // Debug

    if (!imagePath || !imagePath.trim()) {
      return placeholderUrl;
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads")) {
      return `${baseUrl}${imagePath}`;
    }

    return `${baseUrl}/uploads/hotels/${imagePath}`;
  }

  // Fallback to placeholder
  console.log("Fallback to placeholder"); // Debug
  return placeholderUrl;
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
      roomTypes = roomTypesData.success && roomTypesData.data ? roomTypesData.data : roomTypesData;
    }

    showHotelDetailsModal(hotelData, roomTypes);
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showAlert("Không thể tải thông tin khách sạn", "danger");
  }
}

// Show hotel details modal with room types
function showHotelDetailsModal(hotel, roomTypes) {
  const modal = new bootstrap.Modal(document.getElementById("hotelDetailsModal"));

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
            .map(
              (roomType) => `
            <div class="col-md-6 mb-3">
              <div class="card border">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${roomType.tenLoaiPhong}</h6>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning btn-sm" onclick="editRoomType(${roomType.maLoaiPhong})">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger btn-sm" onclick="deleteRoomType(${roomType.maLoaiPhong})">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p class="text-primary fw-bold mb-1">${formatCurrency(roomType.giaMotDem)}/đêm</p>
                  <p class="text-muted mb-1"><i class="bi bi-people"></i> Sức chứa: ${roomType.sucChua} người</p>
                  ${roomType.moTa ? `<p class="text-muted small mb-0">${roomType.moTa}</p>` : ""}
                </div>
              </div>
            </div>
          `
            )
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

  // Create images section - SỬA ĐỔI: Hiển thị ảnh thật
  let imagesHtml = "";
  if (hotel.images && hotel.images.length > 0) {
    imagesHtml = `
      <div class="mb-4">
        <h6>Hình Ảnh (${hotel.images.length})</h6>
        <div class="row">
          ${hotel.images
            .map((image) => {
              const imageUrl = getImageUrl(image);
              return `
            <div class="col-md-3 mb-2">
              <img src="${imageUrl}" class="img-fluid rounded" alt="Hotel Image"
                   style="width: 100%; height: 100px; object-fit: cover; cursor: pointer;"
                   onclick="window.open('${imageUrl}', '_blank')"
                   onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg';">
            </div>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
  } else {
    imagesHtml = `
      <div class="mb-4">
        <h6>Hình Ảnh</h6>
        <div class="alert alert-info">
          <p class="mb-0">Chưa có hình ảnh nào.</p>
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

    // Fill form with hotel data
    document.getElementById("editHotelId").value = hotelData.id;
    document.getElementById("editName").value = hotelData.name;
    document.getElementById("editCity").value = hotelData.city;
    document.getElementById("editAddress").value = hotelData.address;
    document.getElementById("editRating").value = hotelData.rating;
    document.getElementById("editDescription").value = hotelData.description;
    document.getElementById("editAmenities").value = hotelData.amenities;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editHotelModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading hotel:", error);
    showAlert("Không thể tải thông tin khách sạn", "danger");
  }
}

// Update hotel
async function updateHotel() {
  const id = document.getElementById("editHotelId").value;

  const hotelData = {
    tenKhachSan: document.getElementById("editName").value,
    thanhPho: document.getElementById("editCity").value,
    diaChi: document.getElementById("editAddress").value,
    danhGiaTrungBinh: parseFloat(document.getElementById("editRating").value),
    moTa: document.getElementById("editDescription").value,
    tienNghi: document.getElementById("editAmenities").value,
  };

  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(hotelData),
    });

    if (response.ok) {
      showAlert("Cập nhật khách sạn thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("editHotelModal")).hide();
      loadHotels(); // Reload hotels
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating hotel:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Delete hotel
async function deleteHotel(hotelId) {
  if (!confirm("Bạn có chắc chắn muốn xóa khách sạn này? Tất cả loại phòng và đặt phòng liên quan cũng sẽ bị xóa.")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      showAlert("Xóa khách sạn thành công!", "success");
      loadHotels(); // Reload hotels list
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra khi xóa khách sạn!", "danger");
    }
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert("Có lỗi xảy ra khi xóa khách sạn!", "danger");
  }
}

// Show add room type modal
function showAddRoomTypeModal(hotelId) {
  document.getElementById("roomTypeHotelId").value = hotelId;
  document.getElementById("addRoomTypeForm").reset();

  const modal = new bootstrap.Modal(document.getElementById("addRoomTypeModal"));
  modal.show();
}

// Add room type
async function addRoomType() {
  const hotelId = document.getElementById("roomTypeHotelId").value;
  const roomTypeData = {
    maKhachSan: parseInt(hotelId),
    tenLoaiPhong: document.getElementById("roomTypeName").value,
    giaMotDem: parseFloat(document.getElementById("roomTypePrice").value),
    sucChua: parseInt(document.getElementById("roomTypeCapacity").value),
    moTa: document.getElementById("roomTypeDescription").value,
  };

  try {
    const response = await fetch(`${API_URL}/roomtypes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(roomTypeData),
    });

    if (response.ok) {
      showAlert("Thêm loại phòng thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("addRoomTypeModal")).hide();
      viewHotelDetails(hotelId); // Reload hotel details
      loadHotels(); // Reload hotels to update prices
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error adding room type:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Edit room type
async function editRoomType(roomTypeId) {
  try {
    const response = await fetch(`${API_URL}/roomtypes/${roomTypeId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const roomType = data.success && data.data ? data.data : data;

    // Fill form
    document.getElementById("editRoomTypeId").value = roomType.maLoaiPhong;
    document.getElementById("editRoomTypeName").value = roomType.tenLoaiPhong;
    document.getElementById("editRoomTypePrice").value = roomType.giaMotDem;
    document.getElementById("editRoomTypeCapacity").value = roomType.sucChua;
    document.getElementById("editRoomTypeDescription").value = roomType.moTa || "";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editRoomTypeModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading room type:", error);
    showAlert("Không thể tải thông tin loại phòng", "danger");
  }
}

// Update room type
async function updateRoomType() {
  const roomTypeId = document.getElementById("editRoomTypeId").value;
  const roomTypeData = {
    tenLoaiPhong: document.getElementById("editRoomTypeName").value,
    giaMotDem: parseFloat(document.getElementById("editRoomTypePrice").value),
    sucChua: parseInt(document.getElementById("editRoomTypeCapacity").value),
    moTa: document.getElementById("editRoomTypeDescription").value,
  };

  try {
    const response = await fetch(`${API_URL}/roomtypes/${roomTypeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(roomTypeData),
    });

    if (response.ok) {
      showAlert("Cập nhật loại phòng thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("editRoomTypeModal")).hide();
      viewHotelDetails(currentHotelId); // Reload hotel details
      loadHotels(); // Reload hotels to update prices
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating room type:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Delete room type
async function deleteRoomType(roomTypeId) {
  console.log("Attempting to delete room type ID:", roomTypeId);

  if (!confirm("Bạn có chắc chắn muốn xóa loại phòng này? Tất cả phòng thuộc loại này cũng sẽ bị xóa.")) {
    return;
  }

  try {
    const url = `${API_URL}/roomtypes/${roomTypeId}`;
    console.log("DELETE URL:", url);
    console.log("Headers:", getAuthHeaders());

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    console.log("Delete response status:", response.status);
    console.log("Delete response ok:", response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log("Delete success data:", data);
      showAlert("Xóa loại phòng thành công!", "success");

      // Reload hotel details and hotels list
      if (currentHotelId) {
        viewHotelDetails(currentHotelId);
      }
      loadHotels();
    } else {
      const errorText = await response.text();
      console.error("Delete error response:", errorText);

      let errorMessage = "Có lỗi xảy ra!";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error("Could not parse error response:", e);
      }

      showAlert(errorMessage, "danger");
    }
  } catch (error) {
    console.error("Error deleting room type:", error);
    showAlert(`Có lỗi xảy ra: ${error.message}`, "danger");
  }
}

function showAddHotelModal() {
  document.getElementById("addHotelForm").reset();
  const modal = new bootstrap.Modal(document.getElementById("addHotelModal"));
  modal.show();
}

// Add hotel function - THÊM HÀM NÀY
async function addHotel() {
  const hotelData = {
    tenKhachSan: document.getElementById("hotelName").value,
    thanhPho: document.getElementById("hotelCity").value,
    diaChi: document.getElementById("hotelAddress").value,
    danhGiaTrungBinh: parseFloat(document.getElementById("hotelRating").value) || 0,
    moTa: document.getElementById("hotelDescription").value,
    tienNghi: document.getElementById("hotelAmenities").value,
  };

  try {
    const response = await fetch(`${API_URL}/hotels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(hotelData),
    });

    if (response.ok) {
      showAlert("Thêm khách sạn thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("addHotelModal")).hide();
      loadHotels(); // Reload hotels list
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error adding hotel:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Form event listeners - THÊM PHẦN NÀY
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAccess();
  loadHotels();

  // Add hotel form
  const addHotelForm = document.getElementById("addHotelForm");
  if (addHotelForm) {
    addHotelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addHotel();
    });
  }

  // Edit hotel form
  const editHotelForm = document.getElementById("editHotelForm");
  if (editHotelForm) {
    editHotelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateHotel();
    });
  }

  // Add room type form
  const addRoomTypeForm = document.getElementById("addRoomTypeForm");
  if (addRoomTypeForm) {
    addRoomTypeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addRoomType();
    });
  }

  // Edit room type form
  const editRoomTypeForm = document.getElementById("editRoomTypeForm");
  if (editRoomTypeForm) {
    editRoomTypeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateRoomType();
    });
  }
});
