// Load dashboard data
async function loadDashboardData() {
  try {
    // Get total hotels
    const hotelsResponse = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });
    const hotels = await hotelsResponse.json();
    document.getElementById("totalHotels").textContent = hotels.length;

    // Calculate available rooms (mock data for now)
    const availableRooms = hotels.reduce((sum, hotel) => sum + (hotel.availableRooms || 10), 0);
    document.getElementById("availableRooms").textContent = availableRooms;

    // Get today's bookings (mock data)
    document.getElementById("todayBookings").textContent = Math.floor(Math.random() * 20) + 5;

    // Get total users (mock data)
    document.getElementById("totalUsers").textContent = Math.floor(Math.random() * 100) + 50;

    // Load recent hotels
    const recentHotels = hotels.slice(-5).reverse();
    const tbody = document.getElementById("recentHotels");
    tbody.innerHTML = "";

    recentHotels.forEach((hotel) => {
      tbody.innerHTML += `
                <tr>
                    <td>${hotel.id}</td>
                    <td>${hotel.name}</td>
                    <td>${hotel.address}</td>
                    <td>${formatCurrency(hotel.price)}</td>
                    <td>${new Date(hotel.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                        <a href="hotels.html" class="btn btn-sm btn-primary">Xem</a>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Load hotels for admin management
async function loadAdminHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });
    const hotels = await response.json();

    const tbody = document.getElementById("hotelsTableBody");
    tbody.innerHTML = "";

    hotels.forEach((hotel) => {
      const imageUrl =
        hotel.images && hotel.images.length > 0 ? `http://localhost:3000${hotel.images[0]}` : "https://via.placeholder.com/60x60?text=No+Image";

      tbody.innerHTML += `
                <tr>
                    <td>${hotel.id}</td>
                    <td><img src="${imageUrl}" class="table-img" alt="${hotel.name}"></td>
                    <td>${hotel.name}</td>
                    <td>${hotel.address}</td>
                    <td>${hotel.city}</td>
                    <td>${formatCurrency(hotel.price)}</td>
                    <td>${hotel.rating || "4.0"}</td>
                    <td>
                        <span class="badge bg-success">Hoạt động</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-action" onclick="editHotel(${hotel.id})">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger btn-action" onclick="deleteHotel(${hotel.id})">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
    });

    // Search functionality
    document.getElementById("searchInput").addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = tbody.getElementsByTagName("tr");

      Array.from(rows).forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  } catch (error) {
    console.error("Error loading hotels:", error);
  }
}

// Add new hotel
if (document.getElementById("addHotelForm")) {
  document.getElementById("addHotelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("city", document.getElementById("city").value);
    formData.append("address", document.getElementById("address").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("rating", document.getElementById("rating").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("amenities", document.getElementById("amenities").value);

    // Add images
    const images = document.getElementById("images").files;
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const response = await fetch(`${API_URL}/hotels`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        showAlert("Thêm khách sạn thành công!", "success");
        setTimeout(() => {
          window.location.href = "hotels.html";
        }, 2000);
      } else {
        const data = await response.json();
        showAlert(data.message || "Có lỗi xảy ra!", "danger");
      }
    } catch (error) {
      showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
    }
  });
}

// Edit hotel
async function editHotel(id) {
  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      headers: getAuthHeaders(),
    });
    const hotel = await response.json();

    // Fill form with hotel data
    document.getElementById("editHotelId").value = hotel.id;
    document.getElementById("editName").value = hotel.name;
    document.getElementById("editCity").value = hotel.city;
    document.getElementById("editAddress").value = hotel.address;
    document.getElementById("editPrice").value = hotel.price;
    document.getElementById("editRating").value = hotel.rating || "4.0";
    document.getElementById("editDescription").value = hotel.description || "";
    document.getElementById("editAmenities").value = hotel.amenities || "";

    // Show current images
    const currentImagesDiv = document.getElementById("currentImages");
    currentImagesDiv.innerHTML = "";

    if (hotel.images && hotel.images.length > 0) {
      hotel.images.forEach((image, index) => {
        currentImagesDiv.innerHTML += `
                    <div class="image-container">
                        <img src="http://localhost:3000${image}" alt="Image ${index + 1}">
                        <button type="button" class="remove-image" onclick="removeImage(${hotel.id}, '${image}')">×</button>
                    </div>
                `;
      });
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("editHotelModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading hotel:", error);
    showAlert("Có lỗi xảy ra!", "danger");
  }
}

// Update hotel
async function updateHotel() {
  const id = document.getElementById("editHotelId").value;
  const formData = new FormData();

  formData.append("name", document.getElementById("editName").value);
  formData.append("city", document.getElementById("editCity").value);
  formData.append("address", document.getElementById("editAddress").value);
  formData.append("price", document.getElementById("editPrice").value);
  formData.append("rating", document.getElementById("editRating").value);
  formData.append("description", document.getElementById("editDescription").value);
  formData.append("amenities", document.getElementById("editAmenities").value);

  // Add new images if selected
  const newImages = document.getElementById("editImages").files;
  for (let i = 0; i < newImages.length; i++) {
    formData.append("images", newImages[i]);
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (response.ok) {
      showAlert("Cập nhật khách sạn thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("editHotelModal")).hide();
      loadAdminHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
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
      loadAdminHotels();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

// Remove image from hotel
async function removeImage(hotelId, imagePath) {
  if (!confirm("Bạn có chắc chắn muốn xóa hình ảnh này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ imagePath }),
    });

    if (response.ok) {
      showAlert("Xóa hình ảnh thành công!", "success");
      editHotel(hotelId); // Reload the edit modal
    } else {
      showAlert("Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}
