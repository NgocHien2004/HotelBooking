// API Base URL - Sử dụng port 5233 theo backend của bạn
const API_URL = "http://localhost:5233/api";

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
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

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = alertDiv.querySelector(".alert");
      if (alert) {
        alert.classList.remove("show");
        setTimeout(() => {
          alertDiv.innerHTML = "";
        }, 150);
      }
    }, 5000);
  }
}

// Get image URL helper function - SỬAẠ ĐỔI: Cải thiện logic xử lý đường dẫn
function getImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  // Nếu không có ảnh, trả về placeholder
  if (!image) {
    return placeholderUrl;
  }

  if (typeof image === "string") {
    // Nếu là chuỗi rỗng, trả về placeholder
    if (!image.trim()) {
      return placeholderUrl;
    }

    // Nếu đã là URL đầy đủ thì dùng trực tiếp
    if (image.startsWith("http")) {
      return image;
    }

    // Nếu bắt đầu bằng /uploads thì thêm base URL
    if (image.startsWith("/uploads")) {
      return `${baseUrl}${image}`;
    }

    // Nếu là đường dẫn tương đối, thêm /uploads/hotels/
    if (!image.startsWith("/")) {
      return `${baseUrl}/uploads/hotels/${image}`;
    }

    return `${baseUrl}${image}`;
  }

  // Nếu là object với thuộc tính duongDanAnh
  if (image && image.duongDanAnh) {
    let imagePath = image.duongDanAnh;

    if (!imagePath || !imagePath.trim()) {
      return placeholderUrl;
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads")) {
      return `${baseUrl}${imagePath}`;
    }

    // Nếu chỉ có tên file, thêm đường dẫn đầy đủ
    if (!imagePath.startsWith("/")) {
      return `${baseUrl}/uploads/hotels/${imagePath}`;
    }

    return `${baseUrl}${imagePath}`;
  }

  // Fallback to placeholder
  return placeholderUrl;
}

// Get room image URL - THÊM MỚI: Hàm riêng cho ảnh phòng
function getRoomImageUrl(image) {
  const baseUrl = "http://localhost:5233";
  const placeholderUrl = `${baseUrl}/uploads/temp/hotel-placeholder.jpg`;

  if (!image) {
    return placeholderUrl;
  }

  if (typeof image === "string") {
    if (!image.trim()) {
      return placeholderUrl;
    }

    if (image.startsWith("http")) {
      return image;
    }

    if (image.startsWith("/uploads")) {
      return `${baseUrl}${image}`;
    }

    if (!image.startsWith("/")) {
      return `${baseUrl}/uploads/rooms/${image}`;
    }

    return `${baseUrl}${image}`;
  }

  if (image && image.duongDanAnh) {
    let imagePath = image.duongDanAnh;

    if (!imagePath || !imagePath.trim()) {
      return placeholderUrl;
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads")) {
      return `${baseUrl}${imagePath}`;
    }

    if (!imagePath.startsWith("/")) {
      return `${baseUrl}/uploads/rooms/${imagePath}`;
    }

    return `${baseUrl}${imagePath}`;
  }

  // Fallback to placeholder
  return placeholderUrl;
}

// Create hotel card HTML - GIỮ LAYOUT GIỐNG TRANG INDEX
function createHotelCard(hotel) {
  // Map properties từ backend (tiếng Việt) sang frontend (tiếng Anh)
  const hotelData = {
    id: hotel.maKhachSan || hotel.id,
    name: hotel.tenKhachSan || hotel.name,
    city: hotel.thanhPho || hotel.city,
    address: hotel.diaChi || hotel.address,
    price: hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0,
    rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
    description: hotel.moTa || hotel.description,
    images: hotel.hinhAnhs || hotel.hinhAnhKhachSans || hotel.images || [],
    amenities: hotel.tienNghi || hotel.amenities || "",
  };

  const amenities = hotelData.amenities
    ? hotelData.amenities
        .split(",")
        .slice(0, 3)
        .map((amenity) => `<span class="badge bg-light text-dark me-1">${amenity.trim()}</span>`)
        .join("")
    : '<span class="text-muted">Chưa cập nhật</span>';

  // Lấy hình ảnh đầu tiên - QUAN TRỌNG: Xử lý ảnh thật
  let imageUrl = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";

  if (hotelData.images && hotelData.images.length > 0) {
    const firstImage = hotelData.images[0];
    imageUrl = getImageUrl(firstImage);
  }

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm hotel-card fade-in">
        <div class="position-relative">
          <div class="hotel-image-container">
            <img src="${imageUrl}" 
                 class="card-img-top" 
                 alt="${hotelData.name}" 
                 onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg';">
          </div>
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-primary">${hotelData.city}</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${hotelData.name}</h5>
          <p class="card-text text-muted small">${hotelData.address}</p>
          ${
            hotelData.description
              ? `<p class="card-text">${hotelData.description.substring(0, 100)}${hotelData.description.length > 100 ? "..." : ""}</p>`
              : ""
          }
          <div class="mb-2">
            <small class="text-muted">Tiện ích:</small><br>
            ${amenities}
          </div>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="h6 mb-0 text-success">
                ${hotelData.price > 0 ? `Từ ${formatCurrency(hotelData.price)}` : "Chưa có giá"}
              </span>
              <span class="text-warning">
                <i class="bi bi-star-fill"></i> ${hotelData.rating.toFixed(1)}
              </span>
            </div>
            <div class="d-grid gap-2">
              <a href="hotel-detail.html?id=${hotelData.id}" class="btn btn-primary btn-sm">
                <i class="bi bi-eye"></i> Xem Chi Tiết
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
