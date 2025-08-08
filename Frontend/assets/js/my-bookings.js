let currentBookings = [];
let currentBookingId = null;

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
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <p class="text-muted small">
                                Mã đặt phòng: #${booking.maDatPhong}<br>
                                Đặt ngày: ${formatDate(booking.ngayDat)}
                            </p>
                            <div class="btn-group" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="viewBookingDetail(${booking.maDatPhong})">
                                    <i class="bi bi-eye"></i> Chi tiết
                                </button>
                                ${
                                  canEdit
                                    ? `<button class="btn btn-outline-warning btn-sm" onclick="editBooking(${booking.maDatPhong})">
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
                    </div>
                </div>
            `;

      document.getElementById("bookingDetailContent").innerHTML = detailHtml;

      // Show/hide action buttons
      const canEdit = booking.trangThai === "Pending";
      const canCancel = booking.trangThai === "Pending" || booking.trangThai === "Confirmed";

      document.getElementById("editBookingBtn").style.display = canEdit ? "inline-block" : "none";
      document.getElementById("cancelBookingBtn").style.display = canCancel ? "inline-block" : "none";

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

function editBooking() {
  const booking = currentBookings.find((b) => b.maDatPhong === currentBookingId);
  if (!booking) return;

  document.getElementById("editCheckInDate").value = booking.ngayNhanPhong.split("T")[0];
  document.getElementById("editCheckOutDate").value = booking.ngayTraPhong.split("T")[0];

  // Set minimum dates
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("editCheckInDate").min = today;
  document.getElementById("editCheckOutDate").min = today;

  bootstrap.Modal.getInstance(document.getElementById("bookingDetailModal")).hide();

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

function calculateNights(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "bg-warning";
    case "Confirmed":
      return "bg-success";
    case "Cancelled":
      return "bg-danger";
    case "Completed":
      return "bg-info";
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
