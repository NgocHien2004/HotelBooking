let allHotels = [];
let currentView = "grid";
let currentHotelId = null;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing admin hotels page...");
  loadHotels();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("gridViewBtn").addEventListener("click", () => switchView("grid"));
  const tableViewBtn = document.getElementById("tableViewBtn");
  if (tableViewBtn) {
    tableViewBtn.style.display = "none";
  }

  document.getElementById("searchInput").addEventListener("input", filterHotels);

  setupFormHandlers();
}

function setupFormHandlers() {
  const editHotelForm = document.getElementById("editHotelForm");
  if (editHotelForm) {
    editHotelForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateHotel();
    });
  }

  const addRoomTypeForm = document.getElementById("addRoomTypeForm");
  if (addRoomTypeForm) {
    addRoomTypeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addRoomType();
    });
  }

  const editRoomTypeForm = document.getElementById("editRoomTypeForm");
  if (editRoomTypeForm) {
    editRoomTypeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateRoomType();
    });
  }
}

function switchView(view) {
  currentView = "grid";
  document.getElementById("gridViewBtn").classList.add("active");
  document.getElementById("hotelsGridView").style.display = "flex";

  const tableView = document.getElementById("hotelsTableView");
  if (tableView) {
    tableView.style.display = "none";
  }

  displayHotels();
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

async function loadHotels() {
  console.log("Loading hotels...");
  console.log("API_URL:", API_URL);

  try {
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

function createHotelCard(hotel) {
  const minPrice = getMinPriceFromHotel(hotel);
  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";

  if (hotel.images && hotel.images.length > 0) {
    const firstImage = hotel.images[0];
    imageUrl = getImageUrl(firstImage);
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card hotel-card h-100">
        <div class="position-relative">
          <img src="${imageUrl}" 
               class="card-img-top" 
               alt="${hotel.name}" 
               style="height: 250px; object-fit: cover;"
               onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg';">
          
          <!-- Rating Badge -->
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white;">
              ${hotel.rating.toFixed(1)} ⭐
            </span>
          </div>

          <!-- Status Badge -->
          <div class="position-absolute top-0 start-0 m-2">
            <span class="badge bg-success">
              <i class="fas fa-check-circle"></i> Hoạt động
            </span>
          </div>
        </div>

        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${hotel.name}</h5>
          
          <p class="card-text text-muted mb-2">
            <i class="fas fa-map-marker-alt"></i> ${hotel.city}
          </p>
          
          <p class="card-text text-muted small mb-2" title="${hotel.address}">
            <i class="fas fa-building"></i> ${truncateText(hotel.address, 40)}
          </p>

          <p class="card-text flex-grow-1">${truncateText(hotel.description || "", 80)}</p>

          <div class="mt-auto">
            <div class="mb-3">
              <span class="fw-bold" style="color: #28a745; font-size: 1.1rem;">
                ${minPrice > 0 ? `Chỉ từ ${formatCurrency(minPrice)}/đêm` : "Liên hệ để biết giá"}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-primary btn-sm" onclick="viewHotelDetails(${hotel.id})">
                <i class="fas fa-eye"></i> Xem Chi Tiết & Phòng
              </button>
              <div class="row g-1">
                <div class="col-6">
                  <button type="button" class="btn btn-outline-warning btn-sm w-100" onclick="editHotel(${hotel.id})">
                    <i class="fas fa-edit"></i> Sửa
                  </button>
                </div>
                <div class="col-6">
                  <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="deleteHotel(${hotel.id})">
                    <i class="fas fa-trash"></i> Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getMinPriceFromHotel(hotel) {
  if (hotel.roomTypes && hotel.roomTypes.length > 0) {
    const prices = hotel.roomTypes.map((room) => room.giaMotDem || room.price).filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  return hotel.price || 0;
}

function filterHotels() {
  displayHotels();
}

function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  console.log("Processing image:", image);

  if (!image) {
    console.log("No image provided, using placeholder");
    return placeholderUrl;
  }

  if (typeof image === "string") {
    if (!image.trim()) {
      return placeholderUrl;
    }

    if (image.startsWith("http")) {
      console.log("Full URL detected:", image);
      return image;
    }

    if (image.startsWith("/uploads")) {
      const url = `${baseUrl}${image}`;
      console.log("Uploads path detected, generated:", url);
      return url;
    }

    const url = `${baseUrl}/uploads/hotels/${image}`;
    console.log("Filename only, generated:", url);
    return url;
  }

  if (image && image.duongDanAnh) {
    const imagePath = image.duongDanAnh;
    console.log("Object with duongDanAnh:", imagePath);

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

  console.log("Fallback to placeholder");
  return placeholderUrl;
}

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

function showHotelDetailsModal(hotel, roomTypes) {
  const modal = new bootstrap.Modal(document.getElementById("hotelDetailsModal"));

  document.getElementById("hotelDetailsTitle").textContent = hotel.name;

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

    document.getElementById("editHotelId").value = hotelData.id;
    document.getElementById("editName").value = hotelData.name;
    document.getElementById("editCity").value = hotelData.city;
    document.getElementById("editAddress").value = hotelData.address;
    document.getElementById("editRating").value = hotelData.rating;
    document.getElementById("editDescription").value = hotelData.description;
    document.getElementById("editAmenities").value = hotelData.amenities;

    const modal = new bootstrap.Modal(document.getElementById("editHotelModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading hotel:", error);
    showAlert("Không thể tải thông tin khách sạn", "danger");
  }
}

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
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating hotel:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

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
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra khi xóa khách sạn!", "danger");
    }
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert("Có lỗi xảy ra khi xóa khách sạn!", "danger");
  }
}

function showAddRoomTypeModal(hotelId) {
  document.getElementById("roomTypeHotelId").value = hotelId;
  document.getElementById("addRoomTypeForm").reset();

  const modal = new bootstrap.Modal(document.getElementById("addRoomTypeModal"));
  modal.show();
}

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
      viewHotelDetails(hotelId);
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error adding room type:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

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

    document.getElementById("editRoomTypeId").value = roomType.maLoaiPhong;
    document.getElementById("editRoomTypeName").value = roomType.tenLoaiPhong;
    document.getElementById("editRoomTypePrice").value = roomType.giaMotDem;
    document.getElementById("editRoomTypeCapacity").value = roomType.sucChua;
    document.getElementById("editRoomTypeDescription").value = roomType.moTa || "";

    const modal = new bootstrap.Modal(document.getElementById("editRoomTypeModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading room type:", error);
    showAlert("Không thể tải thông tin loại phòng", "danger");
  }
}

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
      viewHotelDetails(currentHotelId);
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating room type:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

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
      loadHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error adding hotel:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  checkAdminAccess();
  loadHotels();

  const addHotelForm = document.getElementById("addHotelForm");
  if (addHotelForm) {
    addHotelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addHotel();
    });
  }

  const editHotelForm = document.getElementById("editHotelForm");
  if (editHotelForm) {
    editHotelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateHotel();
    });
  }

  const addRoomTypeForm = document.getElementById("addRoomTypeForm");
  if (addRoomTypeForm) {
    addRoomTypeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addRoomType();
    });
  }

  const editRoomTypeForm = document.getElementById("editRoomTypeForm");
  if (editRoomTypeForm) {
    editRoomTypeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateRoomType();
    });
  }
});
