let currentPayments = [];
let currentBookings = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentPaymentId = null;

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = "../login.html";
    return;
  }

  loadPayments();
  loadBookingsForSelect();

  document.getElementById("searchInput").addEventListener("input", debounce(filterPayments, 300));
  document.getElementById("paymentMethodFilter").addEventListener("change", filterPayments);
  document.getElementById("dateFromFilter").addEventListener("change", filterPayments);
  document.getElementById("dateToFilter").addEventListener("change", filterPayments);
});

async function loadPayments() {
  try {
    const response = await apiCall("/api/payments", "GET");

    if (response.success) {
      currentPayments = response.data;
      displayPayments(currentPayments);
      updatePagination(currentPayments.length);
      updateStatistics(currentPayments);
    } else {
      showAlert(response.message || "Lỗi tải danh sách thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error loading payments:", error);
    showAlert("Lỗi tải danh sách thanh toán", "danger");
  }
}

async function loadBookingsForSelect() {
  try {
    const response = await apiCall("/api/bookings", "GET");

    if (response.success) {
      currentBookings = response.data.filter(
        (booking) => booking.trangThai === "Confirmed" && (booking.remainingAmount === undefined || booking.remainingAmount > 0)
      );

      const select = document.getElementById("bookingSelect");
      select.innerHTML = '<option value="">-- Chọn đặt phòng --</option>';

      currentBookings.forEach((booking) => {
        const option = document.createElement("option");
        option.value = booking.maDatPhong;
        option.textContent = `#${booking.maDatPhong} - ${booking.hoTenKhach} - ${booking.tenKhachSan} - ${formatCurrency(
          booking.remainingAmount || booking.tongTien
        )}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
  }
}

function displayPayments(payments) {
  const tableBody = document.getElementById("paymentsTableBody");

  if (!payments || payments.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted"></i>
                    <p class="mt-2 text-muted">Không có thanh toán nào</p>
                </td>
            </tr>
        `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, endIndex);

  const paymentsHtml = paginatedPayments
    .map(
      (payment) => `
        <tr>
            <td>#${payment.maThanhToan}</td>
            <td>#${payment.maDatPhong}</td>
            <td>${payment.hoTenKhach}</td>
            <td>${payment.tenKhachSan}</td>
            <td class="text-end">${formatCurrency(payment.soTien)}</td>
            <td>
                <span class="badge bg-info">${getPaymentMethodText(payment.phuongThuc)}</span>
            </td>
            <td>${formatDateTime(payment.ngayThanhToan)}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentDetail(${payment.maThanhToan})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="refundPayment(${payment.maThanhToan})">
                        <i class="bi bi-arrow-return-left"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  tableBody.innerHTML = paymentsHtml;
}

function updateStatistics(payments) {
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.soTien, 0);
  const totalTransactions = payments.length;

  const today = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter((payment) => payment.ngayThanhToan.startsWith(today));
  const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.soTien, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.ngayThanhToan);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });
  const monthRevenue = monthPayments.reduce((sum, payment) => sum + payment.soTien, 0);

  document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue);
  document.getElementById("todayRevenue").textContent = formatCurrency(todayRevenue);
  document.getElementById("monthRevenue").textContent = formatCurrency(monthRevenue);
  document.getElementById("totalTransactions").textContent = totalTransactions;
}

function filterPayments() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const methodFilter = document.getElementById("paymentMethodFilter").value;
  const dateFromFilter = document.getElementById("dateFromFilter").value;
  const dateToFilter = document.getElementById("dateToFilter").value;

  let filteredPayments = [...currentPayments];

  if (searchTerm) {
    filteredPayments = filteredPayments.filter(
      (payment) =>
        payment.maDatPhong.toString().includes(searchTerm) ||
        payment.hoTenKhach.toLowerCase().includes(searchTerm) ||
        payment.tenKhachSan.toLowerCase().includes(searchTerm)
    );
  }

  if (methodFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.phuongThuc === methodFilter);
  }

  if (dateFromFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.ngayThanhToan >= dateFromFilter);
  }

  if (dateToFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.ngayThanhToan <= dateToFilter + "T23:59:59");
  }

  currentPage = 1;
  displayPayments(filteredPayments);
  updatePagination(filteredPayments.length);
  updateStatistics(filteredPayments);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("paymentMethodFilter").value = "";
  document.getElementById("dateFromFilter").value = "";
  document.getElementById("dateToFilter").value = "";

  filterPayments();
}

async function addPayment() {
  const bookingId = document.getElementById("bookingSelect").value;
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const method = document.getElementById("paymentMethod").value;

  if (!bookingId || !amount || !method) {
    showAlert("Vui lòng điền đầy đủ thông tin", "warning");
    return;
  }

  if (amount <= 0) {
    showAlert("Số tiền phải lớn hơn 0", "warning");
    return;
  }

  try {
    const paymentData = {
      maDatPhong: parseInt(bookingId),
      soTien: amount,
      phuongThuc: method,
    };

    const response = await apiCall("/api/payments", "POST", paymentData);

    if (response.success) {
      showAlert("Thêm thanh toán thành công", "success");

      const modal = bootstrap.Modal.getInstance(document.getElementById("addPaymentModal"));
      modal.hide();
      document.getElementById("addPaymentForm").reset();

      loadPayments();
      loadBookingsForSelect();
    } else {
      showAlert(response.message || "Lỗi thêm thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error adding payment:", error);
    showAlert("Lỗi thêm thanh toán", "danger");
  }
}

async function viewPaymentDetail(paymentId) {
  try {
    const response = await apiCall(`/api/payments/${paymentId}`, "GET");

    if (response.success) {
      const payment = response.data;
      currentPaymentId = paymentId;

      const detailHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Thông tin thanh toán</h6>
                        <p><strong>Mã thanh toán:</strong> #${payment.maThanhToan}</p>
                        <p><strong>Mã đặt phòng:</strong> #${payment.maDatPhong}</p>
                        <p><strong>Số tiền:</strong> ${formatCurrency(payment.soTien)}</p>
                        <p><strong>Phương thức:</strong> ${getPaymentMethodText(payment.phuongThuc)}</p>
                        <p><strong>Ngày thanh toán:</strong> ${formatDateTime(payment.ngayThanhToan)}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Thông tin đặt phòng</h6>
                        <p><strong>Khách hàng:</strong> ${payment.hoTenKhach}</p>
                        <p><strong>Khách sạn:</strong> ${payment.tenKhachSan}</p>
                        <p><strong>Phòng:</strong> ${payment.soPhong}</p>
                        <p><strong>Nhận phòng:</strong> ${formatDate(payment.ngayNhanPhong)}</p>
                        <p><strong>Trả phòng:</strong> ${formatDate(payment.ngayTraPhong)}</p>
                    </div>
                </div>
                
                <hr>
                
                <div class="row">
                    <div class="col-12">
                        <h6>Hóa đơn thanh toán</h6>
                        <div class="border p-3 bg-light">
                            <div class="d-flex justify-content-between">
                                <span>Mã giao dịch:</span>
                                <strong>#${payment.maThanhToan}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Số tiền thanh toán:</span>
                                <strong>${formatCurrency(payment.soTien)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Phương thức:</span>
                                <strong>${getPaymentMethodText(payment.phuongThuc)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Thời gian:</span>
                                <strong>${formatDateTime(payment.ngayThanhToan)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.getElementById("paymentDetailContent").innerHTML = detailHtml;

      const modal = new bootstrap.Modal(document.getElementById("paymentDetailModal"));
      modal.show();
    } else {
      showAlert(response.message || "Lỗi tải chi tiết thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error loading payment detail:", error);
    showAlert("Lỗi tải chi tiết thanh toán", "danger");
  }
}

async function refundPayment(paymentId = null) {
  const id = paymentId || currentPaymentId;

  if (!confirm("Bạn có chắc chắn muốn hoàn tiền cho thanh toán này?")) {
    return;
  }

  try {
    const response = await apiCall(`/api/payments/${id}/refund`, "POST");

    if (response.success) {
      showAlert("Hoàn tiền thành công", "success");

      const modal = bootstrap.Modal.getInstance(document.getElementById("paymentDetailModal"));
      if (modal) modal.hide();

      loadPayments();
    } else {
      showAlert(response.message || "Lỗi hoàn tiền", "danger");
    }
  } catch (error) {
    console.error("Error refunding payment:", error);
    showAlert("Lỗi hoàn tiền", "danger");
  }
}

function printReceipt() {
  const paymentDetail = document.getElementById("paymentDetailContent").innerHTML;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
        <head>
            <title>Hóa đơn thanh toán</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @media print {
                    .no-print { display: none; }
                }
                body { font-family: Arial, sans-serif; }
                .receipt-header { text-align: center; margin-bottom: 30px; }
                .receipt-content { max-width: 600px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="receipt-content">
                <div class="receipt-header">
                    <h2>HÓA ĐƠN THANH TOÁN</h2>
                    <p>Hotel Booking System - Admin</p>
                </div>
                ${paymentDetail}
                <div class="text-center mt-4 no-print">
                    <button class="btn btn-primary" onclick="window.print()">In hóa đơn</button>
                    <button class="btn btn-secondary" onclick="window.close()">Đóng</button>
                </div>
            </div>
        </body>
        </html>
    `);
  printWindow.document.close();
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
  const totalPages = Math.ceil(currentPayments.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayPayments(currentPayments);
    updatePagination(currentPayments.length);
  }
}

function getPaymentMethodText(method) {
  switch (method) {
    case "Cash":
      return "Tiền mặt";
    case "Credit Card":
      return "Thẻ tín dụng";
    case "Bank Transfer":
      return "Chuyển khoản";
    case "E-Wallet":
      return "Ví điện tử";
    default:
      return method || "Không xác định";
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

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("bookingSelect").addEventListener("change", function () {
    const selectedBookingId = this.value;
    if (selectedBookingId) {
      const booking = currentBookings.find((b) => b.maDatPhong == selectedBookingId);
      if (booking) {
        document.getElementById("paymentAmount").value = booking.remainingAmount || booking.tongTien;
      }
    } else {
      document.getElementById("paymentAmount").value = "";
    }
  });
});
