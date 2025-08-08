async function loadDashboardData() {
  try {
    const hotelsResponse = await fetch(`${API_URL}/hotels`, {
      headers: getAuthHeaders(),
    });
    const hotelsData = await hotelsResponse.json();

    const hotels = hotelsData.success && hotelsData.data ? hotelsData.data : hotelsData;

    document.getElementById("totalHotels").textContent = hotels.length;

    const availableRooms = hotels.reduce((sum, hotel) => sum + 10, 0);
    document.getElementById("availableRooms").textContent = availableRooms;

    document.getElementById("todayBookings").textContent = Math.floor(Math.random() * 20) + 5;

    document.getElementById("totalUsers").textContent = Math.floor(Math.random() * 100) + 50;

    const recentHotels = hotels.slice(-5).reverse();
    const tbody = document.getElementById("recentHotels");
    tbody.innerHTML = "";

    recentHotels.forEach((hotel) => {
      const hotelData = {
        id: hotel.maKhachSan || hotel.id,
        name: hotel.tenKhachSan || hotel.name,
        address: hotel.diaChi || hotel.address,
        price: hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0,
        createdAt: hotel.ngayTao || hotel.createdAt,
      };

      tbody.innerHTML += `
        <tr>
          <td>${hotelData.id}</td>
          <td>${hotelData.name}</td>
          <td>${hotelData.address}</td>
          <td>${hotelData.price > 0 ? `Từ ${formatCurrency(hotelData.price)}` : "Chưa có giá"}</td>
          <td>${new Date(hotelData.createdAt).toLocaleDateString("vi-VN")}</td>
          <td>
            <a href="hotels.html" class="btn btn-sm btn-primary">Xem</a>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showAlert("Không thể tải dữ liệu dashboard", "danger");
  }
}

if (document.getElementById("addHotelForm")) {
  document.getElementById("addHotelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const hotelData = {
      tenKhachSan: document.getElementById("name").value,
      thanhPho: document.getElementById("city").value,
      diaChi: document.getElementById("address").value,
      danhGiaTrungBinh: parseFloat(document.getElementById("rating").value || 4.0),
      moTa: document.getElementById("description").value,
      tienNghi: document.getElementById("amenities").value,
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
        const result = await response.json();
        const hotelId = result.data.maKhachSan || result.data.id;

        showAlert("Thêm khách sạn thành công!", "success");
        const images = document.getElementById("images").files;
        if (images.length > 0) {
          await uploadHotelImages(hotelId, images);
        }

        setTimeout(() => {
          window.location.href = "hotels.html";
        }, 2000);
      } else {
        const data = await response.json();
        showAlert(data.message || "Có lỗi xảy ra!", "danger");
      }
    } catch (error) {
      console.error("Error adding hotel:", error);
      showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
    }
  });
}

async function uploadHotelImages(hotelId, images) {
  try {
    const formData = new FormData();

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    const response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Upload result:", result);
      showAlert(`Đã upload ${result.count} ảnh thành công!`, "success");

      if (typeof loadHotels === "function") {
        await loadHotels();
      }
    } else {
      const errorText = await response.text();
      console.error("Upload error:", errorText);
      showAlert("Có lỗi khi upload ảnh!", "warning");
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    showAlert("Có lỗi khi upload ảnh!", "warning");
  }
}

async function editHotel(id) {
  try {
    const response = await fetch(`${API_URL}/hotels/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();

    const hotel = data.success && data.data ? data.data : data;

    const hotelData = {
      id: hotel.maKhachSan || hotel.id,
      name: hotel.tenKhachSan || hotel.name,
      city: hotel.thanhPho || hotel.city,
      address: hotel.diaChi || hotel.address,
      rating: hotel.danhGiaTrungBinh || hotel.rating || 4.0,
      description: hotel.moTa || hotel.description || "",
      amenities: hotel.tienNghi || hotel.amenities || "",
      images: hotel.hinhAnhs || hotel.images || [],
    };

    document.getElementById("editHotelId").value = hotelData.id;
    document.getElementById("editName").value = hotelData.name;
    document.getElementById("editCity").value = hotelData.city;
    document.getElementById("editAddress").value = hotelData.address;
    document.getElementById("editRating").value = hotelData.rating;
    document.getElementById("editDescription").value = hotelData.description;
    document.getElementById("editAmenities").value = hotelData.amenities;

    const currentImagesDiv = document.getElementById("currentImages");
    if (currentImagesDiv) {
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
    }

    const modal = new bootstrap.Modal(document.getElementById("editHotelModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading hotel:", error);
    showAlert("Có lỗi xảy ra khi tải thông tin khách sạn!", "danger");
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

      if (typeof loadAdminHotels === "function") {
        loadAdminHotels();
      }
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating hotel:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

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

      if (typeof loadAdminHotels === "function") {
        loadAdminHotels();
      }
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error deleting hotel:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

async function removeImage(hotelId, imagePath) {
  if (!confirm("Bạn có chắc chắn muốn xóa hình ảnh này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ imagePath }),
    });

    if (response.ok) {
      showAlert("Xóa hình ảnh thành công!", "success");
      editHotel(hotelId);
    } else {
      showAlert("Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error removing image:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}
