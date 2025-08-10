// Manage Hotel Images JavaScript
let currentHotelId = null;
let selectedFiles = [];
let hotelImages = [];

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Check admin authentication - SỬA ĐỔI: Sử dụng isAdmin() thay vì checkAdminAuth()
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  if (!token || !user.vaiTro || user.vaiTro !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../login.html";
    return;
  }

  // Get hotel ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentHotelId = urlParams.get("hotelId");

  if (!currentHotelId) {
    showAlert("Không tìm thấy ID khách sạn!", "warning");
    setTimeout(() => {
      window.location.href = "hotels.html";
    }, 2000);
    return;
  }

  loadHotelInfo();
  loadHotelImages();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Upload zone
  const uploadZone = document.getElementById("uploadZone");
  const imageInput = document.getElementById("imageInput");

  uploadZone.addEventListener("click", () => {
    imageInput.click();
  });

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("dragover");
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  });

  imageInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  });

  // Upload button
  document.getElementById("uploadBtn").addEventListener("click", uploadImages);
}

// Load hotel info
async function loadHotelInfo() {
  try {
    const response = await fetch(`${API_URL}/hotels/${currentHotelId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const hotel = data.success && data.data ? data.data : data;

    document.getElementById("hotelName").textContent = hotel.tenKhachSan || hotel.name;
    document.title = `Quản lý ảnh - ${hotel.tenKhachSan || hotel.name}`;
  } catch (error) {
    console.error("Error loading hotel info:", error);
    showAlert("Không thể tải thông tin khách sạn!", "warning");
  }
}

// Load hotel images
async function loadHotelImages() {
  try {
    const response = await fetch(`${API_URL}/hotels/${currentHotelId}/images`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    hotelImages = data.success && data.data ? data.data : data;

    displayImages();
  } catch (error) {
    console.error("Error loading hotel images:", error);
    showAlert("Không thể tải danh sách ảnh!", "warning");
  }
}

// Display images
function displayImages() {
  const grid = document.getElementById("imagesGrid");
  const emptyState = document.getElementById("emptyState");
  const imageCount = document.getElementById("imageCount");

  imageCount.textContent = hotelImages.length;

  if (hotelImages.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  emptyState.style.display = "none";

  grid.innerHTML = hotelImages.map((image) => createImageCard(image)).join("");
}

// Create image card
function createImageCard(image) {
  const imageUrl = getImageUrl(image);
  const isMainImage = image.isMainImage || false;

  return `
        <div class="image-card">
            <img src="${imageUrl}" alt="${image.moTa || "Hotel image"}" 
                 onerror="this.src='http://localhost:5233/uploads/temp/hotel-placeholder.jpg'">
            <div class="card-body">
                ${isMainImage ? '<div class="badge bg-warning mb-2">Ảnh chính</div>' : ""}
                <p class="card-text small text-muted mb-2">
                    ${image.moTa || "Không có mô tả"}
                </p>
                <div class="btn-group w-100" role="group">
                    <button class="btn btn-outline-primary btn-sm" onclick="editImage(${image.maHinhAnh})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-success btn-sm" onclick="viewImageFullsize('${imageUrl}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteImage(${image.maHinhAnh})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Handle file selection
function handleFileSelection(files) {
  selectedFiles = [];
  const validFiles = [];

  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      if (file.size <= 5 * 1024 * 1024) {
        // 5MB limit
        validFiles.push(file);
      } else {
        showAlert(`File ${file.name} quá lớn. Tối đa 5MB.`, "warning");
      }
    } else {
      showAlert(`File ${file.name} không phải là ảnh.`, "warning");
    }
  });

  selectedFiles = validFiles;
  displayPreview();

  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = selectedFiles.length === 0;
}

// Display preview
function displayPreview() {
  const previewGrid = document.getElementById("previewGrid");

  if (selectedFiles.length === 0) {
    previewGrid.style.display = "none";
    return;
  }

  previewGrid.style.display = "grid";
  previewGrid.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";
      previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="preview-remove" onclick="removePreview(${index})">×</button>
            `;
      previewGrid.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  });
}

// Remove preview
function removePreview(index) {
  selectedFiles.splice(index, 1);
  displayPreview();

  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = selectedFiles.length === 0;
}

// Upload images
async function uploadImages() {
  if (selectedFiles.length === 0) return;

  const uploadBtn = document.getElementById("uploadBtn");
  const originalText = uploadBtn.innerHTML;

  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang upload...';

  try {
    const description = document.getElementById("imageDescription").value.trim();

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("hotelId", currentHotelId);
      if (description) {
        formData.append("description", description);
      }

      const response = await fetch(`${API_URL}/hotels/${currentHotelId}/images`, {
        method: "POST",
        headers: getAuthHeaders(false), // Don't include Content-Type for FormData
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed for ${file.name}`);
      }
    }

    showAlert("Upload ảnh thành công!", "success");

    // Reset form
    selectedFiles = [];
    document.getElementById("imageDescription").value = "";
    displayPreview();

    // Close modal and reload images
    const modal = bootstrap.Modal.getInstance(document.getElementById("uploadModal"));
    modal.hide();

    await loadHotelImages();
  } catch (error) {
    console.error("Error uploading images:", error);
    showAlert("Có lỗi khi upload ảnh!", "danger");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalText;
  }
}

// Edit image
function editImage(imageId) {
  const image = hotelImages.find((img) => img.maHinhAnh === imageId);
  if (!image) return;

  document.getElementById("editImageId").value = imageId;
  document.getElementById("editImagePreview").src = getImageUrl(image);
  document.getElementById("editImageDescription").value = image.moTa || "";
  document.getElementById("setAsMainImage").checked = image.isMainImage || false;

  const modal = new bootstrap.Modal(document.getElementById("editImageModal"));
  modal.show();
}

// Update image
async function updateImage() {
  const imageId = document.getElementById("editImageId").value;
  const description = document.getElementById("editImageDescription").value.trim();
  const isMainImage = document.getElementById("setAsMainImage").checked;

  try {
    const response = await fetch(`${API_URL}/hotels/${currentHotelId}/images/${imageId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        moTa: description,
        isMainImage: isMainImage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showAlert("Cập nhật ảnh thành công!", "success");

    const modal = bootstrap.Modal.getInstance(document.getElementById("editImageModal"));
    modal.hide();

    await loadHotelImages();
  } catch (error) {
    console.error("Error updating image:", error);
    showAlert("Có lỗi khi cập nhật ảnh!", "danger");
  }
}

// Delete image
function deleteImage(imageId) {
  document.getElementById("deleteImageId").value = imageId;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

// Confirm delete image
async function confirmDeleteImage() {
  const imageId = document.getElementById("deleteImageId").value;

  try {
    const response = await fetch(`${API_URL}/hotels/${currentHotelId}/images/${imageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showAlert("Xóa ảnh thành công!", "success");

    const modal = bootstrap.Modal.getInstance(document.getElementById("deleteModal"));
    modal.hide();

    await loadHotelImages();
  } catch (error) {
    console.error("Error deleting image:", error);
    showAlert("Có lỗi khi xóa ảnh!", "danger");
  }
}

// View image fullsize
function viewImageFullsize(imageUrl) {
  window.open(imageUrl, "_blank");
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

// Get auth headers
function getAuthHeaders(includeContentType = true) {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// Check admin authentication
function checkAdminAuth() {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  return token && userRole === "Admin";
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

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  window.location.href = "../login.html";
}
