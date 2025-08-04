// API Base URL
const API_URL = "http://localhost:5233/api";

// Check if user is admin (từ auth.js)
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role || user.role !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
    return false;
  }
  return true;
}

// Load dashboard data
async function loadDashboard() {
  try {
    // Load hotel count
    const hotelsResponse = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });
    const hotelsData = await hotelsResponse.json();
    const hotels = hotelsData.success && hotelsData.data ? hotelsData.data : hotelsData;

    // Update dashboard stats
    document.getElementById("totalHotels").textContent = hotels.length || 0;
    document.getElementById("totalRooms").textContent = "0"; // TODO: Implement rooms count
    document.getElementById("totalBookings").textContent = "0"; // TODO: Implement bookings count

    // Load recent hotels for table
    const tbody = document.querySelector("#recentHotelsTable tbody");
    if (tbody && hotels.length > 0) {
      tbody.innerHTML = "";
      hotels.slice(0, 5).forEach((hotel) => {
        const hotelData = mapHotelData(hotel);
        tbody.innerHTML += `
        <tr>
          <td>${hotelData.name}</td>
          <td>${hotelData.city}</td>
          <td>${hotelData.price > 0 ? `Từ ${formatCurrency(hotelData.price)}` : "Chưa có giá"}</td>
          <td>${new Date(hotelData.createdAt).toLocaleDateString("vi-VN")}</td>
          <td>
            <a href="hotels.html" class="btn btn-sm btn-primary">Xem</a>
          </td>
        </tr>
      `;
      });
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showAlert("Không thể tải dữ liệu dashboard", "danger");
  }
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
  };
}

// Add new hotel với upload ảnh
if (document.getElementById("addHotelForm")) {
  document.getElementById("addHotelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Create object with Vietnamese property names
    const hotelData = {
      tenKhachSan: document.getElementById("name").value,
      thanhPho: document.getElementById("city").value,
      diaChi: document.getElementById("address").value,
      danhGiaTrungBinh: parseFloat(document.getElementById("rating").value || 4.0),
      moTa: document.getElementById("description").value,
      tienNghi: document.getElementById("amenities").value,
    };

    try {
      // Bước 1: Tạo khách sạn trước
      const hotelResponse = await fetch(`${API_URL}/hotels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(hotelData),
      });

      if (!hotelResponse.ok) {
        const errorData = await hotelResponse.json();
        throw new Error(errorData.message || "Không thể tạo khách sạn");
      }

      const hotelResult = await hotelResponse.json();
      const hotelId = hotelResult.data?.maKhachSan || hotelResult.data?.id;

      // Bước 2: Upload ảnh nếu có
      const images = document.getElementById("images").files;
      if (images.length > 0) {
        const formData = new FormData();

        // Thêm tất cả files vào FormData
        for (let i = 0; i < images.length; i++) {
          formData.append("files", images[i]);
        }

        const uploadResponse = await fetch(`${API_URL}/files/upload/hotels`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            // Không set Content-Type cho FormData, browser sẽ tự set
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log("Upload successful:", uploadResult);

          // TODO: Lưu thông tin ảnh vào database qua HotelService nếu cần
          showAlert(`Thêm khách sạn và upload ${uploadResult.files.length} ảnh thành công!`, "success");
        } else {
          console.warn("Upload failed but hotel created");
          showAlert("Thêm khách sạn thành công nhưng có lỗi khi upload ảnh", "warning");
        }
      } else {
        showAlert("Thêm khách sạn thành công!", "success");
      }

      // Redirect sau 2 giây
      setTimeout(() => {
        window.location.href = "hotels.html";
      }, 2000);
    } catch (error) {
      console.error("Error adding hotel:", error);
      showAlert(error.message || "Có lỗi xảy ra. Vui lòng thử lại!", "danger");
    }
  });
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

    // Map property names
    const hotelData = {
      id: hotel.maKhachSan || hotel.id,
      name: hotel.tenKhachSan || hotel.name,
      city: hotel.thanhPho || hotel.city,
      address: hotel.diaChi || hotel.address,
      rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
      description: hotel.moTa || hotel.description || "",
      amenities: hotel.tienNghi || hotel.amenities || "",
      images: hotel.hinhAnh || hotel.images || [],
    };

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
        let imageUrl = "";
        if (typeof image === "object" && image.duongDanAnh) {
          imageUrl = image.duongDanAnh;
        } else if (typeof image === "string") {
          imageUrl = image;
        }

        if (!imageUrl.startsWith("http")) {
          imageUrl = `http://localhost:5233${imageUrl}`;
        }

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
if (document.getElementById("editHotelForm")) {
  document.getElementById("editHotelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const hotelId = document.getElementById("editHotelId").value;
    const hotelData = {
      tenKhachSan: document.getElementById("editName").value,
      thanhPho: document.getElementById("editCity").value,
      diaChi: document.getElementById("editAddress").value,
      danhGiaTrungBinh: parseFloat(document.getElementById("editRating").value || 4.0),
      moTa: document.getElementById("editDescription").value,
      tienNghi: document.getElementById("editAmenities").value,
    };

    try {
      // Cập nhật thông tin khách sạn
      const response = await fetch(`${API_URL}/hotels/${hotelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(hotelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật khách sạn");
      }

      // Upload ảnh mới nếu có
      const newImages = document.getElementById("editImages").files;
      if (newImages.length > 0) {
        const formData = new FormData();

        for (let i = 0; i < newImages.length; i++) {
          formData.append("files", newImages[i]);
        }

        const uploadResponse = await fetch(`${API_URL}/files/upload/hotels`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log("New images uploaded:", uploadResult);
        }
      }

      showAlert("Cập nhật khách sạn thành công!", "success");

      // Close modal and reload data
      const modal = bootstrap.Modal.getInstance(document.getElementById("editHotelModal"));
      modal.hide();

      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating hotel:", error);
      showAlert(error.message || "Có lỗi xảy ra khi cập nhật!", "danger");
    }
  });
}

// Remove image
async function removeImage(hotelId, imageUrl) {
  if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
    return;
  }

  try {
    // Extract filename from URL
    const fileName = imageUrl.split("/").pop();

    const response = await fetch(`${API_URL}/files/hotels/${fileName}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      showAlert("Xóa ảnh thành công!", "success");
      // Reload current images
      editHotel(hotelId);
    } else {
      throw new Error("Không thể xóa ảnh");
    }
  } catch (error) {
    console.error("Error removing image:", error);
    showAlert("Có lỗi xảy ra khi xóa ảnh!", "danger");
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
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      const data = await response.json();
      throw new Error(data.message || "Không thể xóa khách sạn");
    }
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert(error.message || "Có lỗi xảy ra khi xóa khách sạn!", "danger");
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAccess();

  // Load dashboard if on dashboard page
  if (document.getElementById("totalHotels")) {
    loadDashboard();
  }
});
