let currentHotelId = null;
let currentRoomTypeId = null;
let currentRoomId = null;
let currentRoomType = null;
let currentHotel = null;

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  // SỬA: Đọc đúng tham số từ URL
  currentHotelId = urlParams.get("hotelId");
  currentRoomTypeId = urlParams.get("roomTypeId");
  currentRoomId = urlParams.get("room");

  console.log("Booking page parameters:", { currentHotelId, currentRoomTypeId, currentRoomId });

  if (!currentHotelId || !currentRoomTypeId) {
    showAlert("Thông tin không hợp lệ", "danger");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  setMinimumDates();

  loadBookingData();

  document.getElementById("checkInDate").addEventListener("change", calculateTotal);
  document.getElementById("checkOutDate").addEventListener("change", calculateTotal);
  document.getElementById("bookingForm").addEventListener("submit", submitBooking);
});

function setMinimumDates() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  document.getElementById("checkInDate").min = today;
  document.getElementById("checkOutDate").min = tomorrowStr;

  document.getElementById("checkInDate").value = today;
  document.getElementById("checkOutDate").value = tomorrowStr;
}

async function loadBookingData() {
  try {
    console.log("Loading booking data...");

    console.log("Loading hotel:", currentHotelId);
    const hotelResponse = await apiCall(`/api/hotels/${currentHotelId}`, "GET");
    console.log("Hotel response:", hotelResponse);

    if (hotelResponse.success) {
      currentHotel = hotelResponse.data;
      displayHotelInfo();
    } else {
      throw new Error("Failed to load hotel data");
    }

    console.log("Loading room type:", currentRoomTypeId);
    const roomTypeResponse = await apiCall(`/api/roomtypes/${currentRoomTypeId}`, "GET");
    console.log("Room type response:", roomTypeResponse);

    if (roomTypeResponse.success) {
      currentRoomType = roomTypeResponse.data;
      displayRoomTypeInfo();
      // THÊM: Load hình ảnh phòng
      await loadRoomTypeImages();
      calculateTotal();
    } else {
      throw new Error("Failed to load room type data");
    }
  } catch (error) {
    console.error("Error loading booking data:", error);
    showAlert("Không thể tải thông tin đặt phòng", "danger");
    setTimeout(() => (window.location.href = "index.html"), 2000);
  }
}

function displayHotelInfo() {
  if (!currentHotel) return;

  document.getElementById("hotelName").textContent = currentHotel.tenKhachSan;
  document.getElementById("hotelAddress").textContent = currentHotel.diaChi;

  if (currentHotel.hinhAnhs && currentHotel.hinhAnhs.length > 0) {
    const hotelImage = document.getElementById("hotelImage");
    if (hotelImage) {
      hotelImage.src = currentHotel.hinhAnhs[0].duongDanAnh;
      hotelImage.alt = currentHotel.tenKhachSan;
    }
  }
}

function displayRoomTypeInfo() {
  if (!currentRoomType) return;

  document.getElementById("roomTypeName").textContent = currentRoomType.tenLoaiPhong;
  document.getElementById("roomPrice").textContent = formatCurrency(currentRoomType.giaMotDem);
  // SỬA: Cập nhật cả giá phòng trong sidebar
  document.getElementById("roomPrice2").textContent = formatCurrency(currentRoomType.giaMotDem);
  document.getElementById("roomCapacity").textContent = `${currentRoomType.sucChua} người`;

  if (currentRoomType.moTa) {
    document.getElementById("roomDescription").textContent = currentRoomType.moTa;
  }
}

// THÊM: Function để load hình ảnh phòng
async function loadRoomTypeImages() {
  try {
    console.log("Loading room type images for:", currentRoomTypeId);

    // Gọi API để lấy hình ảnh của room type
    const response = await apiCall(`/api/roomtypes/${currentRoomTypeId}/images`, "GET");

    if (response.success && response.data && response.data.length > 0) {
      // Nếu có hình ảnh, hiển thị hình ảnh đầu tiên
      const firstImage = response.data[0];
      displayRoomImage(firstImage.duongDanAnh);
    } else {
      // Nếu không có hình ảnh, hiển thị hình mặc định
      displayRoomImage(null);
    }
  } catch (error) {
    console.error("Error loading room type images:", error);
    // Nếu lỗi, hiển thị hình mặc định
    displayRoomImage(null);
  }
}

// THÊM: Function để hiển thị hình ảnh phòng
function displayRoomImage(imagePath) {
  const roomImageContainer = document.getElementById("roomImageContainer");
  const roomImage = document.getElementById("roomImage");

  if (imagePath) {
    // Nếu có đường dẫn ảnh, sử dụng nó
    const imageUrl = imagePath.startsWith("http") ? imagePath : `http://localhost:5233/${imagePath}`;
    roomImage.src = imageUrl;
  } else {
    // Nếu không có ảnh, sử dụng ảnh placeholder
    roomImage.src = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";
  }

  // Thêm xử lý lỗi ảnh
  roomImage.onerror = function () {
    this.src = "http://localhost:5233/uploads/temp/hotel-placeholder.jpg";
  };

  roomImage.alt = currentRoomType ? currentRoomType.tenLoaiPhong : "Room Image";
  roomImageContainer.style.display = "block";
}

function calculateTotal() {
  const checkInDate = document.getElementById("checkInDate").value;
  const checkOutDate = document.getElementById("checkOutDate").value;

  if (!checkInDate || !checkOutDate || !currentRoomType) {
    document.getElementById("totalPrice").textContent = "0 VNĐ";
    document.getElementById("numberOfNights").textContent = "0";
    return;
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkOut <= checkIn) {
    document.getElementById("totalPrice").textContent = "0 VNĐ";
    document.getElementById("numberOfNights").textContent = "0";
    return;
  }

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const total = nights * currentRoomType.giaMotDem;

  document.getElementById("numberOfNights").textContent = nights;
  document.getElementById("totalPrice").textContent = formatCurrency(total);
}

async function submitBooking(event) {
  event.preventDefault();

  const checkInDate = document.getElementById("checkInDate").value;
  const checkOutDate = document.getElementById("checkOutDate").value;

  console.log("Submitting booking with dates:", { checkInDate, checkOutDate });

  if (!checkInDate || !checkOutDate) {
    showAlert("Vui lòng chọn ngày nhận phòng và trả phòng", "warning");
    return;
  }

  if (new Date(checkOutDate) <= new Date(checkInDate)) {
    showAlert("Ngày trả phòng phải sau ngày nhận phòng", "warning");
    return;
  }

  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang xử lý...";

  try {
    let roomId = currentRoomId;
    if (!roomId) {
      console.log("Finding available room...");
      roomId = await findAvailableRoom();
      if (!roomId) {
        showAlert("Không có phòng trống trong thời gian này", "warning");
        return;
      }
    }

    const bookingData = {
      maPhong: parseInt(roomId),
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    };

    console.log("Sending booking data:", bookingData);

    const response = await apiCall("/api/bookings", "POST", bookingData);
    console.log("Booking response:", response);

    if (response.success) {
      document.getElementById("bookingCode").textContent = `#${response.data.maDatPhong}`;

      localStorage.setItem("newBookingCreated", "true");
      localStorage.setItem("lastBookingId", response.data.maDatPhong);

      const successModal = new bootstrap.Modal(document.getElementById("successModal"));
      successModal.show();

      setTimeout(() => {
        window.location.href = "my-bookings.html";
      }, 3000);
    } else {
      showAlert(response.message || "Có lỗi xảy ra khi đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error submitting booking:", error);
    showAlert("Có lỗi xảy ra khi đặt phòng", "danger");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function findAvailableRoom() {
  try {
    const checkInDate = document.getElementById("checkInDate").value;
    const checkOutDate = document.getElementById("checkOutDate").value;

    const response = await apiCall(`/api/rooms/available?roomTypeId=${currentRoomTypeId}&checkIn=${checkInDate}&checkOut=${checkOutDate}`, "GET");

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0].maPhong;
    }

    return null;
  } catch (error) {
    console.error("Error finding available room:", error);
    return null;
  }
}
