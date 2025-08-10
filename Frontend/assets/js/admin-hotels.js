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

  const truncatedName = hotel.name.length > 30 ? hotel.name.substring(0, 30) + "..." : hotel.name;
  const truncatedAddress = hotel.address.length > 50 ? hotel.address.substring(0, 50) + "..." : hotel.address;

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
              <i class="fas fa-star me-1"></i>${hotel.rating.toFixed(1)}
            </span>
          </div>

          <!-- Image Count Badge -->
          ${
            hotel.images && hotel.images.length > 0
              ? `
          <div class="position-absolute top-0 start-0 m-2">
            <span class="badge bg-info">
              <i class="fas fa-images me-1"></i>${hotel.images.length} ảnh
            </span>
          </div>
          `
              : `
          <div class="position-absolute top-0 start-0 m-2">
            <span class="badge bg-warning">
              <i class="fas fa-exclamation-triangle me-1"></i>Chưa có ảnh
            </span>
          </div>
          `
          }
        </div>

        <div class="card-body d-flex flex-column">
          <h5 class="card-title" title="${hotel.name}">${truncatedName}</h5>
          
          <div class="mb-2">
            <small class="text-muted">
              <i class="fas fa-map-marker-alt me-1"></i>${hotel.city}
            </small>
          </div>
          
          <div class="mb-2">
            <small class="text-muted" title="${hotel.address}">
              <i class="fas fa-building me-1"></i>${truncatedAddress}
            </small>
          </div>

          <div class="mb-3">
            <div class="row">
              <div class="col-6">
                <small class="text-muted d-block">Giá từ:</small>
                <span class="fw-bold" style="color: #28a745;">
                  ${minPrice > 0 ? formatCurrency(minPrice) : "Chưa có"}
                </span>
              </div>
              <div class="col-6">
                <small class="text-muted d-block">Đánh giá:</small>
                <span class="text-warning fw-bold">
                  <i class="fas fa-star"></i> ${hotel.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-auto">
            <div class="row g-2">
              <div class="col-12">
                <button type="button" class="btn btn-outline-info btn-sm w-100" onclick="viewHotelDetails(${hotel.id})">
                  <i class="fas fa-eye me-1"></i>Xem Chi Tiết & Phòng
                </button>
              </div>
              <div class="col-6">
                <button type="button" class="btn btn-outline-warning btn-sm w-100" onclick="editHotel(${hotel.id})">
                  <i class="fas fa-edit me-1"></i>Sửa
                </button>
              </div>
              <div class="col-6">
                <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="deleteHotel(${hotel.id})">
                  <i class="fas fa-trash me-1"></i>Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadHotelImages(hotelId) {
  try {
    let response = await fetch(`${API_URL}/hotels/${hotelId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const hotelData = await response.json();
    const hotel = hotelData.success && hotelData.data ? hotelData.data : hotelData;
    const images = hotel.hinhAnhs || [];

    console.log("Hotel images from API:", images);

    const container = document.getElementById("currentHotelImages");
    container.innerHTML = "";

    if (images && images.length > 0) {
      images.forEach((image, index) => {
        const imageId = image.maAnh || image.maHinhAnh || index;
        const imagePath = image.duongDanAnh || "";
        const imageDescription = image.moTa || "";

        console.log("Processing image:", { imageId, imagePath, imageDescription });

        if (imagePath) {
          // SỬA ĐỔI: Thử nhiều cách tạo URL
          let imageUrls = [];

          // Cách 1: URL đầy đủ như backend trả về
          imageUrls.push(`http://localhost:5233${imagePath}`);

          // Cách 2: Nếu path không có /uploads
          if (!imagePath.startsWith("/uploads")) {
            imageUrls.push(`http://localhost:5233/uploads/hotels/${imagePath}`);
          }

          // Cách 3: Với _content prefix (cho static files)
          imageUrls.push(`http://localhost:5233/_content/HotelBooking.API${imagePath}`);

          // Cách 4: Trực tiếp từ wwwroot
          const filename = imagePath.split("/").pop();
          imageUrls.push(`http://localhost:5233/uploads/hotels/${filename}`);

          console.log("Trying URLs:", imageUrls);

          container.innerHTML += `
            <div class="col-md-6 col-lg-4">
              <div class="image-item position-relative">
                <img src="${imageUrls[0]}" class="img-fluid rounded" 
                     style="height: 150px; object-fit: cover; width: 100%; cursor: pointer;"
                     onclick="previewImage('${imageUrls[0]}', '${imageId}')"
                     onerror="this.onerror=null; this.src='${imageUrls[1] || imageUrls[0]}'; console.log('Trying fallback URL:', this.src);"
                     onload="console.log('Image loaded successfully:', this.src);">
                <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1" 
                        onclick="deleteHotelImage('${imageId}', '${imageUrls[0]}')">
                  <i class="fas fa-times"></i>
                </button>
                ${
                  imageDescription
                    ? `<div class="position-absolute bottom-0 start-0 m-1"><span class="badge bg-dark bg-opacity-75 small">${imageDescription}</span></div>`
                    : ""
                }
                <!-- Debug info -->
                <div class="position-absolute bottom-0 end-0 m-1">
                  <span class="badge bg-info small">ID: ${imageId}</span>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>Khách sạn này chưa có ảnh nào.
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading hotel images:", error);
    document.getElementById("currentHotelImages").innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>Không thể tải ảnh khách sạn: ${error.message}
        </div>
      </div>
    `;
  }
}

function manageHotelImages(hotelId) {
  // Redirect đến trang quản lý ảnh với hotel ID
  window.location.href = `manage-hotel-images.html?hotelId=${hotelId}`;
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

  if (!image) {
    return placeholderUrl;
  }

  let imagePath = "";

  if (typeof image === "string") {
    imagePath = image.trim();
  } else if (typeof image === "object") {
    imagePath = image.duongDanAnh || image.url || image.path || "";
  }

  if (!imagePath) {
    return placeholderUrl;
  }

  // SỬA ĐỔI: Xử lý đường dẫn từ backend
  // Nếu đã là URL đầy đủ
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Nếu bắt đầu bằng /uploads, bỏ dấu / đầu
  if (imagePath.startsWith("/uploads/")) {
    return `${baseUrl}/${imagePath.substring(1)}`;
  }

  // Nếu bắt đầu bằng uploads
  if (imagePath.startsWith("uploads/")) {
    return `${baseUrl}/${imagePath}`;
  }

  // Nếu không có uploads trong path, thêm uploads/hotels/
  return `${baseUrl}/uploads/hotels/${imagePath}`;
}

function debugHotelData(hotelId) {
  fetch(`${API_URL}/hotels/${hotelId}`, {
    headers: getAuthHeaders(),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("=== DEBUG HOTEL DATA ===");
      console.log("Raw response:", data);
      console.log("Hotel images:", data.hinhAnhs || data.images);
      console.log("========================");
    })
    .catch((error) => console.error("Debug error:", error));
}

async function viewHotelDetails(hotelId) {
  console.log("Viewing details for hotel ID:", hotelId);

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

    // Load room types
    const roomTypesResponse = await fetch(`${API_URL}/roomtypes/hotel/${hotelId}`, {
      headers: getAuthHeaders(),
    });

    let roomTypes = [];
    if (roomTypesResponse.ok) {
      const roomTypesData = await roomTypesResponse.json();
      roomTypes = roomTypesData.success && roomTypesData.data ? roomTypesData.data : roomTypesData;
    }

    const modal = new bootstrap.Modal(document.getElementById("hotelDetailsModal"));

    let imagesHtml = "";
    if (hotelData.images && hotelData.images.length > 0) {
      imagesHtml = `
      <div class="mb-4">
        <h6>Hình ảnh (${hotelData.images.length})</h6>
        <div class="row g-2">
          ${hotelData.images
            .slice(0, 6)
            .map((image) => {
              const imageUrl = getImageUrl(image);
              return `
            <div class="col-md-4">
              <img src="${imageUrl}" class="img-fluid rounded" 
                   style="height: 120px; object-fit: cover; width: 100%; cursor: pointer;"
                   onclick="window.open('${imageUrl}', '_blank')"
                   onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
            </div>
          `;
            })
            .join("")}
        </div>
        ${hotelData.images.length > 6 ? `<small class="text-muted">Và ${hotelData.images.length - 6} ảnh khác...</small>` : ""}
      </div>
    `;
    } else {
      imagesHtml = `
      <div class="mb-4">
        <h6>Hình ảnh</h6>
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>Khách sạn này chưa có hình ảnh
        </div>
      </div>
    `;
    }

    let roomTypesHtml = "";
    if (roomTypes && roomTypes.length > 0) {
      roomTypesHtml = `
      <div class="mb-4">
        <h6>Loại phòng (${roomTypes.length})</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Tên loại phòng</th>
                <th>Giá/đêm</th>
                <th>Sức chứa</th>
                <th>Số phòng</th>
              </tr>
            </thead>
            <tbody>
              ${roomTypes
                .map(
                  (roomType) => `
                <tr>
                  <td>${roomType.tenLoaiPhong || roomType.name}</td>
                  <td class="text-success fw-bold">${formatCurrency(roomType.giaMotDem || roomType.price)}</td>
                  <td>${roomType.sucChua || roomType.capacity || "N/A"} người</td>
                  <td>${roomType.soPhong || roomType.roomCount || "N/A"} phòng</td>
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
        <h6>Loại phòng</h6>
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>Khách sạn này chưa có loại phòng nào
        </div>
      </div>
    `;
    }

    const content = `
    <div class="row">
      <div class="col-md-6">
        <p><strong>Tên khách sạn:</strong> ${hotelData.name}</p>
        <p><strong>Thành phố:</strong> ${hotelData.city}</p>
        <p><strong>Địa chỉ:</strong> ${hotelData.address}</p>
        <p><strong>Đánh giá:</strong> ${hotelData.rating.toFixed(1)} ⭐</p>
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
        <i class="fas fa-edit me-1"></i>Sửa thông tin khách sạn
      </button>
    </div>
  `;

    document.getElementById("hotelDetailsContent").innerHTML = content;
    modal.show();
  } catch (error) {
    console.error("Error loading hotel details:", error);
    showAlert("Không thể tải chi tiết khách sạn", "danger");
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

function displayUploadPreview(files) {
  const previewContainer = document.getElementById("uploadPreview");

  if (!previewContainer) {
    console.error("Upload preview container not found");
    return;
  }

  previewContainer.innerHTML = "";

  if (files.length === 0) {
    return;
  }

  previewContainer.innerHTML = `<h6 class="mt-3">Ảnh đã chọn (${files.length}):</h6>`;

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewDiv = document.createElement("div");
      previewDiv.className = "d-flex align-items-center mb-2 p-2 border rounded";
      previewDiv.innerHTML = `
        <img src="${e.target.result}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded me-2">
        <div class="flex-grow-1">
          <small class="text-muted">${file.name}</small><br>
          <small class="text-muted">${(file.size / 1024 / 1024).toFixed(2)} MB</small>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeUploadFile(${index})">
          <i class="fas fa-times"></i>
        </button>
      `;
      previewContainer.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  });
}

function removeUploadFile(index) {
  const imageInput = document.getElementById("imageInput");
  const uploadBtn = document.getElementById("uploadBtn");

  if (imageInput && imageInput.files) {
    // Tạo DataTransfer mới để xóa file
    const dt = new DataTransfer();
    const files = Array.from(imageInput.files);

    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });

    imageInput.files = dt.files;

    // Trigger change event để cập nhật preview
    const changeEvent = new Event("change", { bubbles: true });
    imageInput.dispatchEvent(changeEvent);
  }
}

function setupImageUpload(hotelId) {
  const uploadZone = document.getElementById("uploadZone");
  const imageInput = document.getElementById("imageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  let selectedFiles = [];

  if (!uploadZone || !imageInput || !uploadBtn) {
    console.error("Upload elements not found");
    return;
  }

  uploadZone.onclick = () => imageInput.click();

  imageInput.onchange = (e) => {
    selectedFiles = Array.from(e.target.files);
    displayUploadPreview(selectedFiles);
    uploadBtn.disabled = selectedFiles.length === 0;
  };

  uploadBtn.onclick = async () => {
    if (selectedFiles.length === 0) return;

    const originalText = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Đang upload...';

    try {
      // SỬA ĐỔI: Upload tất cả ảnh cùng lúc thay vì từng cái một
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // Không set Content-Type cho FormData
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error:", errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload result:", result);

      showAlert(`Upload thành công ${result.count || selectedFiles.length} ảnh!`, "success");

      // Reset form
      selectedFiles = [];
      imageInput.value = "";
      document.getElementById("uploadPreview").innerHTML = "";
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = originalText;

      // Reload images và hotels list
      await loadHotelImages(hotelId);
      await loadHotels();
    } catch (error) {
      console.error("Error uploading images:", error);
      showAlert(`Có lỗi khi upload ảnh: ${error.message}`, "danger");
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalText;
    }
  };
}

function previewImage(imageUrl, imageId) {
  const previewImg = document.getElementById("previewImage");
  const deleteBtn = document.getElementById("deleteImageBtn");

  if (previewImg && deleteBtn) {
    previewImg.src = imageUrl;
    deleteBtn.onclick = () => deleteHotelImage(imageId);

    const modal = new bootstrap.Modal(document.getElementById("imagePreviewModal"));
    modal.show();
  }
}

async function deleteHotelImage(imageId, imageUrl) {
  if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;

  try {
    const hotelId = document.getElementById("editHotelId").value;

    // Thử xóa bằng ID trước
    let response = await fetch(`${API_URL}/hotels/${hotelId}/images/${imageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    // Nếu không thành công, thử xóa bằng URL/path
    if (!response.ok && imageUrl) {
      const imagePath = imageUrl.replace("http://localhost:5233", "");
      response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ imagePath: imagePath }),
      });
    }

    // Nếu vẫn không thành công, thử endpoint khác
    if (!response.ok) {
      response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ imageId: imageId, imageUrl: imageUrl }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    showAlert("Xóa ảnh thành công!", "success");

    // Đóng modal preview nếu đang mở
    const previewModal = bootstrap.Modal.getInstance(document.getElementById("imagePreviewModal"));
    if (previewModal) {
      previewModal.hide();
    }

    // Reload lại danh sách ảnh và hotels
    setTimeout(async () => {
      await loadHotelImages(hotelId);
      await loadHotels();
    }, 500);
  } catch (error) {
    console.error("Error deleting image:", error);
    showAlert(`Có lỗi khi xóa ảnh: ${error.message}`, "danger");
  }
}

async function editHotel(hotelId) {
  console.log("Editing hotel ID:", hotelId);

  try {
    // Debug data trước
    debugHotelData(hotelId);

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

    // Load images khi mở modal
    await loadHotelImages(hotelData.id);
    setupImageUpload(hotelData.id);

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
