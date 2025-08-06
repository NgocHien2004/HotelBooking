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

  console.log("Booking page parameters:", { currentHotelId, currentRoomTypeId, currentRoomId });

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
    console.log("Loading booking data...");

    // Load hotel data
    console.log("Loading hotel:", currentHotelId);
    const hotelResponse = await apiCall(`/api/hotels/${currentHotelId}`, "GET");
    console.log("Hotel response:", hotelResponse);

    if (hotelResponse.success) {
      currentHotel = hotelResponse.data;
      displayHotelInfo();
    } else {
      throw new Error("Failed to load hotel data");
    }

    // Load room type data
    console.log("Loading room type:", currentRoomTypeId);
    const roomTypeResponse = await apiCall(`/api/roomtypes/${currentRoomTypeId}`, "GET");
    console.log("Room type response:", roomTypeResponse);

    if (roomTypeResponse.success) {
      currentRoomType = roomTypeResponse.data;
      displayRoomInfo();
    } else {
      throw new Error("Failed to load room type data");
    }

    // If specific room is selected, get room data
    if (currentRoomId) {
      console.log("Loading specific room:", currentRoomId);
      const roomResponse = await apiCall(`/api/rooms/${currentRoomId}`, "GET");
      console.log("Room response:", roomResponse);
    }

    // Calculate initial total
    calculateTotal();

    console.log("Booking data loaded successfully");
  } catch (error) {
    console.error("Error loading booking data:", error);
    showAlert("Lỗi tải thông tin đặt phòng: " + error.message, "danger");
  }
}

function displayHotelInfo() {
  if (currentHotel) {
    document.getElementById("hotelName").textContent = currentHotel.tenKhachSan;
    document.getElementById("hotelAddress").textContent = currentHotel.diaChi;
  }
}

function displayRoomInfo() {
  if (currentRoomType) {
    document.getElementById("roomTypeName").textContent = currentRoomType.tenLoaiPhong;
    document.getElementById("roomPrice").textContent = formatCurrency(currentRoomType.giaMotDem);
    document.getElementById("roomCapacity").textContent = `${currentRoomType.sucChua} người`;

    // Update the second price display in summary
    const roomPrice2 = document.getElementById("roomPrice2");
    if (roomPrice2) {
      roomPrice2.textContent = formatCurrency(currentRoomType.giaMotDem);
    }

    if (currentRoomType.moTa) {
      document.getElementById("roomDescription").textContent = currentRoomType.moTa;
    }
  }
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

  // Disable submit button to prevent double submission
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang xử lý...";

  try {
    // If no specific room selected, find available room
    let roomId = currentRoomId;
    if (!roomId) {
      console.log("Finding available room...");
      roomId = await findAvailableRoom();
      if (!roomId) {
        showAlert("Không có phòng trống trong thời gian này", "warning");
        return;
      }
    }

    // Create booking data
    const bookingData = {
      maPhong: parseInt(roomId),
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    };

    console.log("Sending booking data:", bookingData);

    // Call API to create booking
    const response = await apiCall("/api/bookings", "POST", bookingData);
    console.log("Booking response:", response);

    if (response.success) {
      // Show success modal
      document.getElementById("bookingCode").textContent = `#${response.data.maDatPhong}`;
      const successModal = new bootstrap.Modal(document.getElementById("successModal"));
      successModal.show();
    } else {
      showAlert(response.message || "Có lỗi xảy ra khi đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    showAlert("Có lỗi xảy ra khi đặt phòng: " + error.message, "danger");
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function findAvailableRoom() {
  try {
    const checkInDate = document.getElementById("checkInDate").value;
    const checkOutDate = document.getElementById("checkOutDate").value;

    console.log("Searching for available rooms with params:", {
      maLoaiPhong: currentRoomTypeId,
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    });

    // Get available rooms for this room type
    const response = await apiCall(
      `/api/rooms/available?maLoaiPhong=${currentRoomTypeId}&ngayNhanPhong=${checkInDate}&ngayTraPhong=${checkOutDate}`,
      "GET"
    );

    console.log("Available rooms response:", response);

    if (response.success && response.data.length > 0) {
      return response.data[0].maPhong;
    }

    return null;
  } catch (error) {
    console.error("Error finding available room:", error);
    return null;
  }
}

// Utility function to format currency
function formatCurrency(amount) {
  if (typeof amount !== "number") {
    amount = parseFloat(amount) || 0;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem("token") !== null;
}

// Show alert message
function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer") || document.body;
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  alertContainer.insertBefore(alertElement, alertContainer.firstChild);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (alertElement.parentNode) {
      alertElement.remove();
    }
  }, 5000);
}
