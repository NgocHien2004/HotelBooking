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
  currentHotelId = urlParams.get("hotel");
  currentRoomTypeId = urlParams.get("roomType");
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
  document.getElementById("roomCapacity").textContent = `${currentRoomType.sucChua} người`;

  if (currentRoomType.moTa) {
    document.getElementById("roomDescription").textContent = currentRoomType.moTa;
  }

  // Update second price display
  const roomPrice2Element = document.getElementById("roomPrice2");
  if (roomPrice2Element) {
    roomPrice2Element.textContent = formatCurrency(currentRoomType.giaMotDem);
  }
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
    showAlert("Ngày trả phòng phải sau ngày nhận phòng", "warning");
    return;
  }

  const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const totalPrice = numberOfNights * currentRoomType.giaMotDem;

  document.getElementById("numberOfNights").textContent = numberOfNights;
  document.getElementById("totalPrice").textContent = formatCurrency(totalPrice);
}

async function submitBooking(event) {
  event.preventDefault();

  const checkInDate = document.getElementById("checkInDate").value;
  const checkOutDate = document.getElementById("checkOutDate").value;

  if (!checkInDate || !checkOutDate) {
    showAlert("Vui lòng chọn ngày nhận phòng và trả phòng", "warning");
    return;
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkOut <= checkIn) {
    showAlert("Ngày trả phòng phải sau ngày nhận phòng", "warning");
    return;
  }

  try {
    const bookingData = {
      maPhong: currentRoomId || 1, // Sử dụng room ID từ URL hoặc mặc định
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    };

    console.log("Submitting booking:", bookingData);

    const response = await apiCall("/api/bookings", "POST", bookingData);

    if (response.success) {
      const booking = response.data;

      // Hiển thị thông báo thành công và modal thanh toán
      showBookingSuccessModal(booking);
    } else {
      showAlert(response.message || "Không thể đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error submitting booking:", error);
    showAlert("Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!", "danger");
  }
}

function showBookingSuccessModal(booking) {
  const modalHtml = `
    <div class="modal fade" id="bookingSuccessModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-check-circle"></i> Đặt phòng thành công
            </h5>
          </div>
          <div class="modal-body">
            <div class="alert alert-success">
              <strong>Mã đặt phòng:</strong> #${booking.maDatPhong}<br>
              <strong>Tổng tiền:</strong> ${formatCurrency(booking.tongTien)}<br>
              <strong>Trạng thái:</strong> Chờ xác nhận
            </div>
            
            <div class="mb-3">
              <h6>Bạn có muốn thanh toán ngay không?</h6>
              <p class="text-muted small">
                Bạn có thể thanh toán một phần hoặc toàn bộ số tiền. 
                Admin sẽ xác nhận đặt phòng sau khi nhận được thanh toán.
              </p>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <label for="paymentAmount" class="form-label">Số tiền thanh toán (VNĐ)</label>
                <input type="number" class="form-control" id="paymentAmount" 
                       max="${booking.tongTien}" min="0" 
                       placeholder="Nhập số tiền">
                <div class="form-text">Tối đa: ${formatCurrency(booking.tongTien)}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentMethod" class="form-label">Phương thức thanh toán</label>
                <select class="form-select" id="paymentMethod">
                  <option value="Cash">Tiền mặt</option>
                  <option value="Credit Card">Thẻ tín dụng</option>
                  <option value="Bank Transfer">Chuyển khoản ngân hàng</option>
                  <option value="E-Wallet">Ví điện tử</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" onclick="skipPayment()">
              Thanh toán sau
            </button>
            <button type="button" class="btn btn-success" onclick="processPayment(${booking.maDatPhong}, ${booking.tongTien})">
              <i class="bi bi-credit-card"></i> Thanh toán ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("bookingSuccessModal"));
  modal.show();

  // Set default payment amount to full amount
  document.getElementById("paymentAmount").value = booking.tongTien;
}

async function processPayment(bookingId, totalAmount) {
  const paymentAmount = parseFloat(document.getElementById("paymentAmount").value);
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (!paymentAmount || paymentAmount <= 0) {
    showAlert("Vui lòng nhập số tiền thanh toán hợp lệ", "warning");
    return;
  }

  if (paymentAmount > totalAmount) {
    showAlert("Số tiền thanh toán không được vượt quá tổng tiền đặt phòng", "warning");
    return;
  }

  try {
    const paymentData = {
      maDatPhong: bookingId,
      soTien: paymentAmount,
      phuongThuc: paymentMethod,
    };

    const response = await apiCall("/api/payments/user-payment", "POST", paymentData);

    if (response.success) {
      showAlert("Thanh toán thành công! Vui lòng chờ admin xác nhận đặt phòng.", "success");

      // Đóng modal và chuyển đến trang đặt phòng của tôi
      const modal = bootstrap.Modal.getInstance(document.getElementById("bookingSuccessModal"));
      modal.hide();

      setTimeout(() => {
        window.location.href = "my-bookings.html";
      }, 2000);
    } else {
      showAlert(response.message || "Không thể xử lý thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    showAlert("Có lỗi xảy ra khi xử lý thanh toán", "danger");
  }
}

function skipPayment() {
  showAlert("Đặt phòng thành công! Bạn có thể thanh toán sau trong mục 'Đặt phòng của tôi'.", "info");

  const modal = bootstrap.Modal.getInstance(document.getElementById("bookingSuccessModal"));
  modal.hide();

  setTimeout(() => {
    window.location.href = "my-bookings.html";
  }, 2000);
}

// Cleanup modal when page unloads
window.addEventListener("beforeunload", function () {
  const modal = document.getElementById("bookingSuccessModal");
  if (modal) {
    modal.remove();
  }
});
