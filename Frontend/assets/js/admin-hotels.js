// Admin Hotels Management
let allHotels = [];
let currentView = "grid"; // grid or table
let currentHotelId = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  loadHotels();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // View toggle
  document.getElementById("gridViewBtn").addEventListener("click", () => switchView("grid"));
  document.getElementById("tableViewBtn").addEventListener("click", () => switchView("table"));

  // Search
  document.getElementById("searchInput").addEventListener("input", filterHotels);
}

// Switch between grid and table view
function switchView(view) {
  currentView = view;
  document.getElementById("gridViewBtn").classList.toggle("active", view === "grid");
  document.getElementById("tableViewBtn").classList.toggle("active", view === "table");
  document.getElementById("hotelsGridView").style.display = view === "grid" ? "flex" : "none";
  document.getElementById("hotelsTableView").style.display = view === "table" ? "block" : "none";
  displayHotels();
}

// Load hotels
async function loadHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();

    allHotels = data.success && data.data ? data.data : data;
    displayHotels();
  } catch (error) {
    console.error("Error loading hotels:", error);
    showAlert("Không thể tải danh sách khách sạn", "danger");
  }
}

// Display hotels based on current view
function displayHotels() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filteredHotels = allHotels.filter((hotel) => {
    const hotelName = hotel.tenKhachSan || hotel.name || "";
    const hotelCity = hotel.thanhPho || hotel.city || "";
    const hotelAddress = hotel.diaChi || hotel.address || "";

    return (
      hotelName.toLowerCase().includes(searchTerm) || hotelCity.toLowerCase().includes(searchTerm) || hotelAddress.toLowerCase().includes(searchTerm)
    );
  });

  if (currentView === "grid") {
    displayGridView(filteredHotels);
  } else {
    displayTableView(filteredHotels);
  }
}

// Display hotels in grid view
function displayGridView(hotels) {
  const container = document.getElementById("hotelsGridView");
  container.innerHTML = "";

  if (hotels.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center">
                <p>Không tìm thấy khách sạn nào</p>
            </div>
        `;
    return;
  }

  hotels.forEach((hotel) => {
    const hotelData = mapHotelData(hotel);
    container.innerHTML += createHotelCard(hotelData);
  });
}

// Create hotel card for grid view
function createHotelCard(hotel) {
  let imageUrl = "/uploads/temp/hotel-placeholder.jpg";
  if (hotel.images && hotel.images.length > 0) {
    imageUrl = getImageUrl(hotel.images[0]);
  }

  return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 hotel-admin-card">
                <img src="${imageUrl}" class="card-img-top" alt="${hotel.name}" 
                     onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${hotel.name}</h5>
                    <p class="text-muted mb-1"><i class="bi bi-geo-alt"></i> ${hotel.city}</p>
                    <p class="text-muted mb-2">${hotel.address}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-primary fw-bold">
                            ${hotel.price > 0 ? `Từ ${formatCurrency(hotel.price)}` : "Chưa có giá"}
                        </span>
                        <span class="text-warning">
                            <i class="bi bi-star-fill"></i> ${hotel.rating}
                        </span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-info flex-fill" onclick="viewHotelDetails(${hotel.id})">
                            <i class="bi bi-eye"></i> Xem
                        </button>
                        <button class="btn btn-sm btn-primary flex-fill" onclick="editHotel(${hotel.id})">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger flex-fill" onclick="deleteHotel(${hotel.id})">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display hotels in table view
function displayTableView(hotels) {
  const tbody = document.getElementById("hotelsTableBody");
  tbody.innerHTML = "";

  if (hotels.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Không tìm thấy khách sạn nào</td>
            </tr>
        `;
    return;
  }

  hotels.forEach((hotel) => {
    const hotelData = mapHotelData(hotel);
    let imageUrl = "/uploads/temp/hotel-placeholder.jpg";
    if (hotelData.images && hotelData.images.length > 0) {
      imageUrl = getImageUrl(hotelData.images[0]);
    }

    tbody.innerHTML += `
            <tr>
                <td>${hotelData.id}</td>
                <td><img src="${imageUrl}" class="table-img" alt="${hotelData.name}"></td>
                <td>${hotelData.name}</td>
                <td>${hotelData.address}</td>
                <td>${hotelData.city}</td>
                <td>${hotelData.price > 0 ? `Từ ${formatCurrency(hotelData.price)}` : "Chưa có giá"}</td>
                <td>${hotelData.rating}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewHotelDetails(${hotelData.id})" title="Xem chi tiết">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editHotel(${hotelData.id})" title="Sửa">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHotel(${hotelData.id})" title="Xóa">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
  });
}

// View hotel details
async function viewHotelDetails(hotelId) {
  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    const hotel = data.success && data.data ? data.data : data;

    currentHotelId = hotelId;
    showHotelDetails(hotel);
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showAlert("Không thể tải thông tin khách sạn", "danger");
  }
}

// Show hotel details in modal
function showHotelDetails(hotel) {
  const hotelData = mapHotelData(hotel);
  const modal = new bootstrap.Modal(document.getElementById("hotelDetailsModal"));

  document.getElementById("hotelDetailsTitle").textContent = hotelData.name;

  let imagesHtml = "";
  if (hotelData.images && hotelData.images.length > 0) {
    imagesHtml = `
            <div class="mb-4">
                <h6>Hình ảnh</h6>
                <div class="row g-2">
                    ${hotelData.images
                      .map(
                        (img) => `
                        <div class="col-md-3">
                            <img src="${getImageUrl(img)}" class="img-fluid rounded" 
                                 onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  let roomTypesHtml = "";
  if (hotelData.roomTypes && hotelData.roomTypes.length > 0) {
    roomTypesHtml = `
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>Loại phòng</h6>
                    <button class="btn btn-sm btn-success" onclick="showAddRoomTypeModal(${hotelData.id})">
                        <i class="bi bi-plus-circle"></i> Thêm loại phòng
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Tên loại phòng</th>
                                <th>Giá/đêm</th>
                                <th>Sức chứa</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hotelData.roomTypes
                              .map(
                                (rt) => `
                                <tr>
                                    <td>${rt.tenLoaiPhong}</td>
                                    <td>${formatCurrency(rt.giaMotDem)}</td>
                                    <td>${rt.sucChua} người</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editRoomType(${rt.maLoaiPhong})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteRoomType(${rt.maLoaiPhong})">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  } else {
    roomTypesHtml = `
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>Loại phòng</h6>
                    <button class="btn btn-sm btn-success" onclick="showAddRoomTypeModal(${hotelData.id})">
                        <i class="bi bi-plus-circle"></i> Thêm loại phòng
                    </button>
                </div>
                <p class="text-muted">Chưa có loại phòng nào</p>
            </div>
        `;
  }

  const content = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Địa chỉ:</strong> ${hotelData.address}</p>
                <p><strong>Thành phố:</strong> ${hotelData.city}</p>
                <p><strong>Đánh giá:</strong> ${hotelData.rating} <i class="bi bi-star-fill text-warning"></i></p>
                <p><strong>Giá thấp nhất:</strong> ${hotelData.price > 0 ? formatCurrency(hotelData.price) : "Chưa có"}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Tiện ích:</strong> ${hotelData.amenities || "Chưa cập nhật"}</p>
                <p><strong>Ngày tạo:</strong> ${new Date(hotelData.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
        </div>
        
        ${
          hotelData.description
            ? `
            <div class="mb-4">
                <h6>Mô tả</h6>
                <p>${hotelData.description}</p>
            </div>
        `
            : ""
        }
        
        ${imagesHtml}
        ${roomTypesHtml}
        
        <div class="text-end">
            <button class="btn btn-primary" onclick="editHotel(${hotelData.id})">
                <i class="bi bi-pencil"></i> Sửa thông tin khách sạn
            </button>
        </div>
    `;

  document.getElementById("hotelDetailsContent").innerHTML = content;
  modal.show();
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
  if (!confirm("Bạn có chắc chắn muốn xóa loại phòng này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/roomtypes/${roomTypeId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      showAlert("Xóa loại phòng thành công!", "success");
      viewHotelDetails(currentHotelId); // Reload hotel details
      loadHotels(); // Reload hotels to update prices
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error deleting room type:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Edit hotel
async function editHotel(id) {
  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();

    // Handle response format
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

    // Show current images
    const currentImagesDiv = document.getElementById("currentImages");
    currentImagesDiv.innerHTML = "";

    if (hotelData.images && hotelData.images.length > 0) {
      hotelData.images.forEach((image, index) => {
        const imageUrl = getImageUrl(image);
        currentImagesDiv.innerHTML += `
                    <div class="image-container">
                        <img src="${imageUrl}" alt="Image ${index + 1}">
                        <button type="button" class="remove-image" onclick="removeImage(${hotelData.id}, '${imageUrl}')">×</button>
                    </div>
                `;
      });
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editHotelModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading hotel:", error);
    showAlert("Có lỗi xảy ra khi tải thông tin khách sạn!", "danger");
  }
}

// Update hotel
async function updateHotel() {
  const id = document.getElementById("editHotelId").value;

  // Create object with Vietnamese property names
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
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating hotel:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

// Delete hotel
async function deleteHotel(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      showAlert("Xóa khách sạn thành công!", "success");
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

// Filter hotels
function filterHotels() {
  displayHotels();
}

// Helper functions
function mapHotelData(hotel) {
  return {
    id: hotel.maKhachSan || hotel.id,
    name: hotel.tenKhachSan || hotel.name,
    city: hotel.thanhPho || hotel.city,
    address: hotel.diaChi || hotel.address,
    price: hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0,
    rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
    description: hotel.moTa || hotel.description,
    images: hotel.hinhAnh || hotel.images || [],
    amenities: hotel.tienNghi || hotel.amenities || "",
    createdAt: hotel.ngayTao || hotel.createdAt,
    roomTypes: hotel.loaiPhongs || hotel.roomTypes || [],
  };
}

function getImageUrl(image) {
  let imageUrl = "";
  if (typeof image === "object" && image.duongDanAnh) {
    imageUrl = image.duongDanAnh;
  } else if (typeof image === "string") {
    imageUrl = image;
  }

  if (!imageUrl.startsWith("http")) {
    imageUrl = `http://localhost:5233${imageUrl}`;
  }

  return imageUrl;
}
