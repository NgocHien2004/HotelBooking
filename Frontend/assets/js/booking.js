// Booking functionality
let currentHotelId = null;
let currentRoomTypeId = null;
let currentRoomId = null;
let currentRoomType = null;
let currentHotel = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  currentHotelId = urlParams.get("hotel");
  currentRoomTypeId = urlParams.get("roomType");
  currentRoomId = urlParams.get("room");

  if (!currentHotelId || !currentRoomTypeId) {
    showAlert("Thông tin không hợp lệ", "danger");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  // Set minimum dates
  setMinimumDates();

  // Load booking data
  loadBookingData();

  // Event listeners
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

  // Set default dates
  document.getElementById("checkInDate").value = today;
  document.getElementById("checkOutDate").value = tomorrowStr;
}

async function loadBookingData() {
  try {
    // Load hotel data
    const hotelResponse = await apiCall(`/api/hotels/${currentHotelId}`, "GET");
    if (hotelResponse.success) {
      currentHotel = hotelResponse.data;
    }

    // Load room type data
    const roomTypeResponse = await apiCall(`/api/roomtypes/${currentRoomTypeId}`, "GET");
    if (roomTypeResponse.success) {
      currentRoomType = roomTypeResponse.data;
    }

    // If specific room is selected, get room data
    if (currentRoomId) {
      const roomResponse = await apiCall(`/api/rooms/${currentRoomId}`, "GET");
      if (roomResponse.success) {
        currentRoom = roomResponse.data;
      }
    }

    updateBookingSummary();
    calculateTotal();
  } catch (error) {
    console.error("Error loading booking data:", error);
    showAlert("Lỗi tải thông tin đặt phòng", "danger");
  }
}

function updateBookingSummary() {
  if (!currentHotel || !currentRoomType) return;

  const summaryHtml = `
        <div class="mb-3">
            <h6><i class="bi bi-building"></i> ${currentHotel.tenKhachSan}</h6>
            <p class="text-muted mb-1">${currentHotel.diaChi}</p>
            <small class="text-muted">${currentHotel.thanhPho}</small>
        </div>
        
        <div class="mb-3">
            <h6><i class="bi bi-door-open"></i> ${currentRoomType.tenLoaiPhong}</h6>
            <p class="mb-1">Sức chứa: ${currentRoomType.sucChua} người</p>
            <p class="mb-1">Giá: ${formatCurrency(currentRoomType.giaMotDem)}/đêm</p>
            ${currentRoomType.moTa ? `<small class="text-muted">${currentRoomType.moTa}</small>` : ""}
        </div>
    `;

  document.getElementById("bookingSummary").innerHTML = summaryHtml;
}

function calculateTotal() {
  const checkInDate = document.getElementById("checkInDate").value;
  const checkOutDate = document.getElementById("checkOutDate").value;

  if (!checkInDate || !checkOutDate || !currentRoomType) {
    return;
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkOut <= checkIn) {
    document.getElementById("priceBreakdown").innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> 
                Ngày trả phòng phải sau ngày nhận phòng
            </div>
        `;
    return;
  }

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const roomPrice = currentRoomType.giaMotDem;
  const subtotal = nights * roomPrice;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const breakdownHtml = `
        <div class="d-flex justify-content-between mb-2">
            <span>${formatCurrency(roomPrice)} × ${nights} đêm</span>
            <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span>Thuế và phí (10%)</span>
            <span>${formatCurrency(tax)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
            <strong>Tổng cộng</strong>
            <strong class="text-primary">${formatCurrency(total)}</strong>
        </div>
        
        <div class="mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle"></i> 
                Thanh toán tại khách sạn khi nhận phòng
            </small>
        </div>
    `;

  document.getElementById("priceBreakdown").innerHTML = breakdownHtml;
}

async function submitBooking(event) {
  event.preventDefault();

  const checkInDate = document.getElementById("checkInDate").value;
  const checkOutDate = document.getElementById("checkOutDate").value;
  const agreeTerms = document.getElementById("agreeTerms").checked;

  if (!agreeTerms) {
    showAlert("Vui lòng đồng ý với điều khoản và điều kiện", "warning");
    return;
  }

  // Validate dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    showAlert("Ngày nhận phòng không thể là quá khứ", "warning");
    return;
  }

  if (checkOut <= checkIn) {
    showAlert("Ngày trả phòng phải sau ngày nhận phòng", "warning");
    return;
  }

  try {
    // Find available room if not specified
    let roomId = currentRoomId;
    if (!roomId) {
      const availableRooms = await apiCall(
        `/api/rooms/available?roomTypeId=${currentRoomTypeId}&checkIn=${checkInDate}&checkOut=${checkOutDate}`,
        "GET"
      );

      if (!availableRooms.success || availableRooms.data.length === 0) {
        showAlert("Không có phòng trống trong thời gian này", "warning");
        return;
      }

      roomId = availableRooms.data[0].maPhong;
    }

    const bookingData = {
      maPhong: roomId,
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    };

    const response = await apiCall("/api/bookings", "POST", bookingData);

    if (response.success) {
      document.getElementById("bookingCode").textContent = `#${response.data.maDatPhong}`;

      const successModal = new bootstrap.Modal(document.getElementById("successModal"));
      successModal.show();
    } else {
      showAlert(response.message || "Lỗi tạo đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    showAlert("Lỗi tạo đặt phòng. Vui lòng thử lại.", "danger");
  }
}

function showAlert(message, type = "danger") {
  const alertDiv = document.getElementById("alertMessage");
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
