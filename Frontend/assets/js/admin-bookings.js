let currentBookings = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentBookingId = null;

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = "../login.html";
    return;
  }

  loadBookings();

  document.getElementById("searchInput").addEventListener("input", debounce(filterBookings, 300));
  document.getElementById("statusFilter").addEventListener("change", filterBookings);
  document.getElementById("dateFilter").addEventListener("change", filterBookings);
});

async function loadBookings() {
  try {
    const response = await apiCall("/api/bookings", "GET");

    if (response.success) {
      currentBookings = response.data;
      displayBookings(currentBookings);
      updatePagination(currentBookings.length);
    } else {
      showAlert(response.message || "Lỗi tải danh sách đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    showAlert("Lỗi tải danh sách đặt phòng", "danger");
  }
}

function displayBookings(bookings) {
  const tableBody = document.getElementById("bookingsTableBody");

  if (!bookings || bookings.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted"></i>
                    <p class="mt-2 text-muted">Không có đặt phòng nào</p>
                </td>
            </tr>
        `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = bookings.slice(startIndex, endIndex);

  const bookingsHtml = paginatedBookings
    .map((booking) => {
      const statusClass = getStatusClass(booking.trangThai);
      const statusText = getStatusText(booking.trangThai);

      return `
            <tr>
                <td>#${booking.maDatPhong}</td>
                <td>${booking.hoTenKhach}</td>
                <td>${booking.tenKhachSan}</td>
                <td>${booking.soPhong}</td>
                <td>${formatDate(booking.ngayNhanPhong)}</td>
                <td>${formatDate(booking.ngayTraPhong)}</td>
                <td class="text-end">${formatCurrency(booking.tongTien)}</td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewBookingDetail(${booking.maDatPhong})">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${
                          booking.trangThai === "Pending"
                            ? `
                            <button class="btn btn-sm btn-outline-success" onclick="confirmBooking(${booking.maDatPhong})">
                                <i class="bi bi-check"></i>
                            </button>
                        `
                            : ""
                        }
                        ${
                          booking.trangThai !== "Cancelled" && booking.trangThai !== "Completed"
                            ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelBooking(${booking.maDatPhong})">
                                <i class="bi bi-x"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");

  tableBody.innerHTML = bookingsHtml;
}

function filterBookings() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

  let filteredBookings = [...currentBookings];

  if (searchTerm) {
    filteredBookings = filteredBookings.filter(
      (booking) =>
        booking.maDatPhong.toString().includes(searchTerm) ||
        booking.hoTenKhach.toLowerCase().includes(searchTerm) ||
        booking.tenKhachSan.toLowerCase().includes(searchTerm)
    );
  }

  if (statusFilter) {
    filteredBookings = filteredBookings.filter((booking) => booking.trangThai === statusFilter);
  }

  if (dateFilter) {
    filteredBookings = filteredBookings.filter((booking) => booking.ngayNhanPhong.startsWith(dateFilter));
  }

  currentPage = 1;
  displayBookings(filteredBookings);
  updatePagination(filteredBookings.length);
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
                        <h6>Thông tin khách hàng</h6>
                        <p><strong>Họ tên:</strong> ${booking.hoTenKhach}</p>
                        <p><strong>Email:</strong> ${booking.emailKhach}</p>
                        <p><strong>Điện thoại:</strong> ${booking.soDienThoaiKhach || "Chưa cập nhật"}</p>
                        
                        <h6 class="mt-4">Thông tin khách sạn</h6>
                        <p><strong>Tên:</strong> ${booking.tenKhachSan}</p>
                        <p><strong>Địa chỉ:</strong> ${booking.diaChiKhachSan}</p>
                        
                        <h6 class="mt-4">Thông tin phòng</h6>
                        <p><strong>Loại phòng:</strong> ${booking.tenLoaiPhong}</p>
                        <p><strong>Số phòng:</strong> ${booking.soPhong}</p>
                        <p><strong>Sức chứa:</strong> ${booking.sucChua} người</p>
                        <p><strong>Giá/đêm:</strong> ${formatCurrency(booking.giaMotDem)}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Thông tin đặt phòng</h6>
                        <p><strong>Mã đặt phòng:</strong> #${booking.maDatPhong}</p>
                        <p><strong>Ngày đặt:</strong> ${formatDateTime(booking.ngayDat)}</p>
                        <p><strong>Ngày nhận phòng:</strong> ${formatDate(booking.ngayNhanPhong)}</p>
                        <p><strong>Ngày trả phòng:</strong> ${formatDate(booking.ngayTraPhong)}</p>
                        <p><strong>Số đêm:</strong> ${booking.soDem}</p>
                        <p><strong>Trạng thái:</strong> <span class="badge ${getStatusClass(booking.trangThai)}">${getStatusText(
        booking.trangThai
      )}</span></p>
                        
                        <h6 class="mt-4">Chi tiết thanh toán</h6>
                        <p><strong>Tổng tiền:</strong> ${formatCurrency(booking.tongTien)}</p>
                        <p><strong>Đã thanh toán:</strong> ${formatCurrency(booking.totalPaid || 0)}</p>
                        <p><strong>Còn lại:</strong> ${formatCurrency(booking.remainingAmount || booking.tongTien)}</p>
                        
                        ${
                          booking.remainingAmount && booking.remainingAmount > 0
                            ? `
                            <button class="btn btn-success btn-sm" onclick="showAddPaymentModal(${booking.maDatPhong}, ${booking.remainingAmount})">
                                <i class="bi bi-plus"></i> Thêm thanh toán
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;

      document.getElementById("bookingDetails").innerHTML = detailHtml;

      const confirmBtn = document.getElementById("confirmBtn");
      const cancelBtn = document.getElementById("cancelBtn");

      confirmBtn.style.display = booking.trangThai === "Pending" ? "inline-block" : "none";
      cancelBtn.style.display = booking.trangThai !== "Cancelled" && booking.trangThai !== "Completed" ? "inline-block" : "none";

      const modal = new bootstrap.Modal(document.getElementById("bookingModal"));
      modal.show();
    } else {
      showAlert(response.message || "Lỗi tải chi tiết đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error loading booking detail:", error);
    showAlert("Lỗi tải chi tiết đặt phòng", "danger");
  }
}

async function confirmBooking(bookingId) {
  if (!confirm("Xác nhận đặt phòng này?")) {
    return;
  }

  await updateBookingStatus(bookingId || currentBookingId, "Confirmed");
}

async function cancelBooking(bookingId) {
  if (!confirm("Hủy đặt phòng này?")) {
    return;
  }

  await updateBookingStatus(bookingId || currentBookingId, "Cancelled");
}

async function updateBookingStatus(bookingId, status) {
  try {
    const response = await apiCall(`/api/bookings/${bookingId}/status`, "PATCH", status, {
      "Content-Type": "application/json",
    });

    if (response.success) {
      showAlert(`${getStatusText(status)} đặt phòng thành công`, "success");

      const modal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
      if (modal) modal.hide();

      loadBookings();
    } else {
      showAlert(response.message || "Lỗi cập nhật trạng thái đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error updating booking status:", error);
    showAlert("Lỗi cập nhật trạng thái đặt phòng", "danger");
  }
}

function showAddPaymentModal(bookingId, remainingAmount) {
  window.location.href = `payments.html?booking=${bookingId}&amount=${remainingAmount}`;
}

function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pagination = document.getElementById("pagination");

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHtml = "";

  paginationHtml += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHtml += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;

  pagination.innerHTML = paginationHtml;
}

function changePage(page) {
  const totalPages = Math.ceil(currentBookings.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayBookings(currentBookings);
    updatePagination(currentBookings.length);
  }
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

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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
async function loadBookings() {
  try {
    const response = await apiCall("/api/bookings", "GET");

    if (response.success) {
      currentBookings = response.data;
      displayBookings(currentBookings);
      updatePagination(currentBookings.length);

      document.title = `Quản lý đặt phòng (${currentBookings.length}) - Admin`;
    } else {
      showAlert(response.message || "Lỗi tải danh sách đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    showAlert("Lỗi tải danh sách đặt phòng", "danger");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = "../login.html";
    return;
  }

  loadBookings();

  document.getElementById("searchInput").addEventListener("input", debounce(filterBookings, 300));
  document.getElementById("statusFilter").addEventListener("change", filterBookings);
  document.getElementById("dateFilter").addEventListener("change", filterBookings);

  setInterval(loadBookings, 30000);
});
