let currentBookings = [];
let currentBookingId = null;
let currentBookingData = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // Check if there's a new booking notification
  if (localStorage.getItem("newBookingCreated") === "true") {
    localStorage.removeItem("newBookingCreated");
    const lastBookingId = localStorage.getItem("lastBookingId");
    if (lastBookingId) {
      showAlert(`Đặt phòng #${lastBookingId} đã được tạo thành công!`, "success");
      localStorage.removeItem("lastBookingId");
    }
  }

  loadMyBookings();

  // Event listeners
  document.getElementById("statusFilter").addEventListener("change", filterBookings);
  document.getElementById("dateFilter").addEventListener("change", filterBookings);

  // Auto refresh every 30 seconds to check for updates
  setInterval(loadMyBookings, 30000);
});

async function loadMyBookings() {
  try {
    const response = await apiCall("/api/bookings/my-bookings", "GET");

    if (response.success) {
      currentBookings = response.data;
      displayBookings(currentBookings);

      // Update page title with booking count
      document.title = `Đặt phòng của tôi (${currentBookings.length}) - Hotel Booking`;
    } else {
      showAlert(response.message || "Lỗi tải danh sách đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    showAlert("Lỗi tải danh sách đặt phòng", "danger");
  }
}

function displayBookings(bookings) {
  const bookingsList = document.getElementById("bookingsList");
  const emptyState = document.getElementById("emptyState");

  if (!bookings || bookings.length === 0) {
    bookingsList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  const bookingsHtml = bookings
    .map((booking) => {
      const statusClass = getStatusClass(booking.trangThai);
      const statusText = getStatusText(booking.trangThai);
      const canEdit = booking.trangThai === "Pending";
      const canCancel = booking.trangThai === "Pending" || booking.trangThai === "Confirmed";
      const canPay = booking.trangThai === "Pending" || booking.trangThai === "Confirmed" || booking.trangThai === "Waiting Payment";

      // Calculate payment status
      const totalPaid = booking.totalPaid || 0;
      const remainingAmount = booking.tongTien - totalPaid;
      const paymentStatus = totalPaid > 0 ? getPaymentStatus(totalPaid, booking.tongTien) : null;

      return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">
                                ${booking.tenKhachSan}
                                <span class="badge ${statusClass} ms-2">${statusText}</span>
                            </h5>
                            <h6 class="card-subtitle mb-2 text-muted">${booking.tenLoaiPhong}</h6>
                            <p class="card-text">
                                <i class="bi bi-geo-alt"></i> ${booking.diaChiKhachSan}<br>
                                <i class="bi bi-calendar"></i> ${formatDate(booking.ngayNhanPhong)} - ${formatDate(booking.ngayTraPhong)}<br>
                                <i class="bi bi-currency-dollar"></i> ${formatCurrency(booking.tongTien)}
                                ${totalPaid > 0 ? `<br><i class="bi bi-credit-card"></i> Đã thanh toán: ${formatCurrency(totalPaid)}` : ""}
                                ${
                                  remainingAmount > 0 && totalPaid > 0
                                    ? `<br><span class="text-warning">Còn lại: ${formatCurrency(remainingAmount)}</span>`
                                    : ""
                                }
                            </p>
                            ${
                              paymentStatus
                                ? `<span class="${paymentStatus.class}"><i class="bi bi-info-circle"></i> ${paymentStatus.text}</span>`
                                : ""
                            }
                        </div>
                        <div class="col-md-4 text-end">
                            <p class="text-muted small">
                                Mã đặt phòng: #${booking.maDatPhong}<br>
                                Đặt ngày: ${formatDate(booking.ngayDat)}
                            </p>
                            <div class="btn-group-vertical d-grid gap-1" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="viewBookingDetail(${booking.maDatPhong})">
                                    <i class="bi bi-eye"></i> Chi tiết
                                </button>
                                ${
                                  canPay && remainingAmount > 0
                                    ? `<button class="btn btn-outline-success btn-sm" onclick="showPaymentModalDirect(${booking.maDatPhong})">
                                        <i class="bi bi-credit-card"></i> Thanh toán
                                    </button>`
                                    : ""
                                }
                                ${
                                  canEdit
                                    ? `<button class="btn btn-outline-warning btn-sm" onclick="editBookingDirect(${booking.maDatPhong})">
                                        <i class="bi bi-pencil"></i> Sửa
                                    </button>`
                                    : ""
                                }
                                ${
                                  canCancel
                                    ? `<button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${booking.maDatPhong})">
                                        <i class="bi bi-x-circle"></i> Hủy
                                    </button>`
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  bookingsList.innerHTML = bookingsHtml;
}

function filterBookings() {
  const statusFilter = document.getElementById("statusFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

  let filteredBookings = [...currentBookings];

  if (statusFilter) {
    filteredBookings = filteredBookings.filter((booking) => booking.trangThai === statusFilter);
  }

  if (dateFilter) {
    filteredBookings = filteredBookings.filter((booking) => booking.ngayNhanPhong.startsWith(dateFilter));
  }

  displayBookings(filteredBookings);
}

async function viewBookingDetail(bookingId) {
  try {
    const response = await apiCall(`/api/bookings/${bookingId}`, "GET");

    if (response.success) {
      const booking = response.data;
      currentBookingId = bookingId;
      currentBookingData = booking;

      // Load payment info
      let payments = [];
      let totalPaid = 0;

      try {
        const paymentsResponse = await apiCall(`/api/payments/booking/${bookingId}`, "GET");
        if (paymentsResponse.success) {
          payments = paymentsResponse.data;
          totalPaid = payments.reduce((sum, payment) => sum + payment.soTien, 0);
        }
      } catch (error) {
        console.log("No payments found or error loading payments");
      }

      const remainingAmount = booking.tongTien - totalPaid;
      const paymentStatus = totalPaid > 0 ? getPaymentStatus(totalPaid, booking.tongTien) : null;

      const detailHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Thông tin khách sạn</h6>
                        <p><strong>Tên:</strong> ${booking.tenKhachSan}</p>
                        <p><strong>Địa chỉ:</strong> ${booking.diaChiKhachSan}</p>
                        
                        <h6 class="mt-3">Thông tin phòng</h6>
                        <p><strong>Loại phòng:</strong> ${booking.tenLoaiPhong}</p>
                        <p><strong>Số phòng:</strong> ${booking.soPhong || "Chưa xác định"}</p>
                        <p><strong>Sức chứa:</strong> ${booking.sucChua} người</p>
                        <p><strong>Giá/đêm:</strong> ${formatCurrency(booking.giaMotDem)}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Thông tin đặt phòng</h6>
                        <p><strong>Mã đặt phòng:</strong> #${booking.maDatPhong}</p>
                        <p><strong>Ngày đặt:</strong> ${formatDateTime(booking.ngayDat)}</p>
                        <p><strong>Ngày nhận phòng:</strong> ${formatDate(booking.ngayNhanPhong)}</p>
                        <p><strong>Ngày trả phòng:</strong> ${formatDate(booking.ngayTraPhong)}</p>
                        <p><strong>Số đêm:</strong> ${booking.soDem || calculateNights(booking.ngayNhanPhong, booking.ngayTraPhong)}</p>
                        <p><strong>Tổng tiền:</strong> ${formatCurrency(booking.tongTien)}</p>
                        <p><strong>Trạng thái:</strong> <span class="badge ${getStatusClass(booking.trangThai)}">${getStatusText(
        booking.trangThai
      )}</span></p>
                        
                        ${
                          totalPaid > 0
                            ? `
                        <h6 class="mt-3">Thông tin thanh toán</h6>
                        <p><strong>Đã thanh toán:</strong> ${formatCurrency(totalPaid)}</p>
                        <p><strong>Còn lại:</strong> ${formatCurrency(remainingAmount)}</p>
                        <p><strong>Tình trạng:</strong> <span class="${paymentStatus.class}">${paymentStatus.text}</span></p>
                        `
                            : ""
                        }
                    </div>
                </div>
                
                ${
                  payments.length > 0
                    ? `
                <hr>
                <h6>Lịch sử thanh toán</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Số tiền</th>
                                <th>Phương thức</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments
                              .map(
                                (payment) => `
                                <tr>
                                    <td>${formatDateTime(payment.ngayThanhToan)}</td>
                                    <td>${formatCurrency(payment.soTien)}</td>
                                    <td>${getPaymentMethodDisplay(payment.phuongThuc)}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                `
                    : ""
                }
            `;

      document.getElementById("bookingDetailContent").innerHTML = detailHtml;

      // Show/hide action buttons
      const canEdit = booking.trangThai === "Pending";
      const canCancel = booking.trangThai === "Pending" || booking.trangThai === "Confirmed";
      const canPay =
        (booking.trangThai === "Pending" || booking.trangThai === "Confirmed" || booking.trangThai === "Waiting Payment") && remainingAmount > 0;

      document.getElementById("editBookingBtn").style.display = canEdit ? "inline-block" : "none";
      document.getElementById("cancelBookingBtn").style.display = canCancel ? "inline-block" : "none";
      document.getElementById("paymentBtn").style.display = canPay ? "inline-block" : "none";

      const modal = new bootstrap.Modal(document.getElementById("bookingDetailModal"));
      modal.show();
    } else {
      showAlert(response.message || "Lỗi tải chi tiết đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error loading booking detail:", error);
    showAlert("Lỗi tải chi tiết đặt phòng", "danger");
  }
}

function editBookingDirect(bookingId) {
  currentBookingId = bookingId;
  editBooking();
}

function editBooking() {
  const booking = currentBookings.find((b) => b.maDatPhong === currentBookingId);
  if (!booking) return;

  document.getElementById("editCheckInDate").value = booking.ngayNhanPhong.split("T")[0];
  document.getElementById("editCheckOutDate").value = booking.ngayTraPhong.split("T")[0];

  // Set minimum dates
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("editCheckInDate").min = today;
  document.getElementById("editCheckOutDate").min = today;

  // Close detail modal if open
  const detailModal = bootstrap.Modal.getInstance(document.getElementById("bookingDetailModal"));
  if (detailModal) detailModal.hide();

  const editModal = new bootstrap.Modal(document.getElementById("editBookingModal"));
  editModal.show();
}

async function saveBookingChanges() {
  const checkInDate = document.getElementById("editCheckInDate").value;
  const checkOutDate = document.getElementById("editCheckOutDate").value;

  if (!checkInDate || !checkOutDate) {
    showAlert("Vui lòng chọn đầy đủ ngày nhận và trả phòng", "warning");
    return;
  }

  if (new Date(checkOutDate) <= new Date(checkInDate)) {
    showAlert("Ngày trả phòng phải sau ngày nhận phòng", "warning");
    return;
  }

  try {
    const updateData = {
      ngayNhanPhong: checkInDate,
      ngayTraPhong: checkOutDate,
    };

    const response = await apiCall(`/api/bookings/${currentBookingId}`, "PUT", updateData);

    if (response.success) {
      showAlert("Cập nhật đặt phòng thành công", "success");
      bootstrap.Modal.getInstance(document.getElementById("editBookingModal")).hide();

      // Force reload bookings to get fresh data
      await loadMyBookings();
    } else {
      showAlert(response.message || "Lỗi cập nhật đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    showAlert("Lỗi cập nhật đặt phòng", "danger");
  }
}

async function cancelBooking(bookingId = null) {
  const id = bookingId || currentBookingId;

  if (!confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) {
    return;
  }

  try {
    const response = await apiCall(`/api/bookings/${id}`, "DELETE");

    if (response.success) {
      showAlert("Hủy đặt phòng thành công", "success");

      // Close modals if open
      const detailModal = bootstrap.Modal.getInstance(document.getElementById("bookingDetailModal"));
      if (detailModal) detailModal.hide();

      // Force reload bookings to get fresh data
      await loadMyBookings();
    } else {
      showAlert(response.message || "Lỗi hủy đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    showAlert("Lỗi hủy đặt phòng", "danger");
  }
}

// PAYMENT FUNCTIONS

async function showPaymentModalDirect(bookingId) {
  currentBookingId = bookingId;
  const booking = currentBookings.find((b) => b.maDatPhong === bookingId);
  if (booking) {
    currentBookingData = booking;
    await showPaymentModal();
  }
}

async function showPaymentModal() {
  if (!currentBookingData) {
    showAlert("Không tìm thấy thông tin đặt phòng", "danger");
    return;
  }

  console.log("=== PAYMENT MODAL DEBUG ===");
  console.log("Current booking data:", currentBookingData);
  console.log("Current booking ID:", currentBookingId);

  try {
    // Load payment info
    let totalPaid = 0;

    try {
      const paymentsResponse = await apiCall(`/api/payments/booking/${currentBookingId}`, "GET");
      console.log("Payments response:", paymentsResponse);
      if (paymentsResponse && paymentsResponse.success) {
        totalPaid = paymentsResponse.data.reduce((sum, payment) => sum + payment.soTien, 0);
      }
    } catch (error) {
      console.log("No payments found:", error);
    }

    const remainingAmount = currentBookingData.tongTien - totalPaid;

    console.log("Total paid:", totalPaid);
    console.log("Remaining amount:", remainingAmount);

    if (remainingAmount <= 0) {
      showAlert("Đặt phòng này đã được thanh toán đủ", "info");
      return;
    }

    const paymentInfoHtml = `
      <div class="alert alert-info">
        <h6><i class="bi bi-info-circle"></i> Thông tin thanh toán</h6>
        <p><strong>Mã đặt phòng:</strong> #${currentBookingData.maDatPhong}</p>
        <p><strong>Tổng tiền:</strong> ${formatCurrency(currentBookingData.tongTien)}</p>
        <p><strong>Đã thanh toán:</strong> ${formatCurrency(totalPaid)}</p>
        <p><strong>Số tiền còn lại:</strong> <span class="text-danger">${formatCurrency(remainingAmount)}</span></p>
      </div>
    `;

    document.getElementById("paymentInfo").innerHTML = paymentInfoHtml;
    document.getElementById("paymentAmount").max = remainingAmount;
    document.getElementById("paymentAmount").value = remainingAmount;

    // Clear any existing alerts in payment modal (chỉ xóa alert, không xóa form)
    const existingAlerts = document.querySelectorAll("#paymentModal .payment-alert");
    existingAlerts.forEach((alert) => alert.remove());

    // Close detail modal if open
    const detailModal = bootstrap.Modal.getInstance(document.getElementById("bookingDetailModal"));
    if (detailModal) detailModal.hide();

    const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal"));
    paymentModal.show();
  } catch (error) {
    console.error("Error loading payment info:", error);
    showAlert("Lỗi tải thông tin thanh toán", "danger");
  }
}

async function submitPayment() {
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const method = document.getElementById("paymentMethod").value;

  console.log("=== PAYMENT SUBMIT DEBUG START ===");
  console.log("Current booking ID:", currentBookingId);
  console.log("Current booking data:", currentBookingData);
  console.log("Payment amount (raw):", document.getElementById("paymentAmount").value);
  console.log("Payment amount (parsed):", amount);
  console.log("Payment method:", method);

  // Clear previous error messages in payment modal (chỉ xóa alert)
  const existingAlerts = document.querySelectorAll("#paymentModal .payment-alert");
  existingAlerts.forEach((alert) => alert.remove());

  if (!amount || amount <= 0) {
    showPaymentAlert("Vui lòng nhập số tiền hợp lệ", "warning");
    return;
  }

  if (!method) {
    showPaymentAlert("Vui lòng chọn phương thức thanh toán", "warning");
    return;
  }

  if (amount < 1000) {
    showPaymentAlert("Số tiền thanh toán tối thiểu là 1,000 VNĐ", "warning");
    return;
  }

  // Disable submit button and show loading
  const submitBtn = document.querySelector("#paymentModal .btn-success");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang xử lý...';

  try {
    const paymentData = {
      maDatPhong: parseInt(currentBookingId), // Đảm bảo là integer
      soTien: parseFloat(amount), // Đảm bảo là decimal
      phuongThuc: method,
    };

    console.log("Sending payment data:", paymentData);
    console.log("API endpoint:", "/api/payments/user-payment");
    console.log("Request headers will include Authorization token");

    const response = await apiCall("/api/payments/user-payment", "POST", paymentData);

    console.log("Payment response:", response);
    console.log("Response type:", typeof response);
    console.log("Response success:", response?.success);
    console.log("=== PAYMENT SUBMIT DEBUG END ===");

    if (response && response.success) {
      showPaymentAlert("Thanh toán thành công! Chờ admin xác nhận đơn đặt phòng.", "success");

      // Wait 2 seconds then close modal and reload
      setTimeout(async () => {
        bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
        await loadMyBookings();

        // Reset form
        document.getElementById("paymentForm").reset();
      }, 2000);
    } else {
      const errorMessage = response?.message || "Có lỗi xảy ra khi thanh toán";
      console.error("Payment failed:", errorMessage);
      showPaymentAlert(errorMessage, "danger");
    }
  } catch (error) {
    console.error("Error submitting payment:", error);
    console.log("Full error object:", error);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);

    // Parse error message if it's from API
    let errorMessage = "Lỗi kết nối. Vui lòng thử lại.";
    if (error.message) {
      if (error.message.includes("500")) {
        errorMessage = "Lỗi server (HTTP 500). Vui lòng kiểm tra dữ liệu và thử lại.";
      } else {
        errorMessage = error.message;
      }
    }

    showPaymentAlert(errorMessage, "danger");
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// NEW FUNCTION: Show alert inside payment modal - DƯỚI FORM
function showPaymentAlert(message, type = "danger") {
  // Tìm vị trí để chèn alert - sau form payment
  const paymentForm = document.querySelector("#paymentModal form");

  // Remove existing alerts
  const existingAlerts = document.querySelectorAll("#paymentModal .payment-alert");
  existingAlerts.forEach((alert) => alert.remove());

  // Create new alert
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type} alert-dismissible fade show payment-alert`;
  alertElement.innerHTML = `
   ${message}
   <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
 `;

  // Insert AFTER payment form (không xóa form)
  paymentForm.parentNode.insertBefore(alertElement, paymentForm.nextSibling);

  // Auto-remove success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
    }, 3000);
  }
}

function calculateNights(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Utility functions - updated with new statuses
function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "bg-warning";
    case "Confirmed":
      return "bg-success";
    case "Waiting Payment":
      return "bg-info";
    case "Cancelled":
      return "bg-danger";
    case "Completed":
      return "bg-primary";
    default:
      return "bg-secondary";
  }
}

function getStatusText(status) {
  switch (status) {
    case "Pending":
      return "Chờ xác nhận";
    case "Confirmed":
      return "Đã xác nhận";
    case "Waiting Payment":
      return "Chờ thanh toán";
    case "Cancelled":
      return "Đã hủy";
    case "Completed":
      return "Hoàn thành";
    default:
      return status;
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

// Utility functions
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

function formatCurrency(amount) {
  if (typeof amount !== "number") {
    amount = parseFloat(amount) || 0;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function isAuthenticated() {
  return localStorage.getItem("token") !== null;
}
