let currentPayments = [];

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  loadPaymentHistory();

  document.getElementById("paymentMethodFilter").addEventListener("change", filterPayments);
  document.getElementById("dateFromFilter").addEventListener("change", filterPayments);
  document.getElementById("dateToFilter").addEventListener("change", filterPayments);
});

async function loadPaymentHistory() {
  try {
    const response = await apiCall("/api/payments/my-payments", "GET");

    if (response.success) {
      currentPayments = response.data;
      displayPayments(currentPayments);
      updateStatistics(currentPayments);
    } else {
      showAlert(response.message || "Lỗi tải lịch sử thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error loading payment history:", error);
    showAlert("Lỗi tải lịch sử thanh toán", "danger");
  }
}

function displayPayments(payments) {
  const tableBody = document.getElementById("paymentsTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!payments || payments.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  const paymentsHtml = payments
    .map(
      (payment) => `
        <tr>
            <td>#${payment.maThanhToan}</td>
            <td>#${payment.maDatPhong}</td>
            <td>${payment.tenKhachSan}</td>
            <td class="text-end">${formatCurrency(payment.soTien)}</td>
            <td>
                <span class="badge bg-info">${getPaymentMethodText(payment.phuongThuc)}</span>
            </td>
            <td>${formatDateTime(payment.ngayThanhToan)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentDetail(${payment.maThanhToan})">
                    <i class="bi bi-eye"></i> Chi tiết
                </button>
            </td>
        </tr>
    `
    )
    .join("");

  tableBody.innerHTML = paymentsHtml;
}

function updateStatistics(payments) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.soTien, 0);
  const totalCount = payments.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.ngayThanhToan);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });
  const thisMonthAmount = thisMonthPayments.reduce((sum, payment) => sum + payment.soTien, 0);

  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  document.getElementById("totalPayments").textContent = formatCurrency(totalAmount);
  document.getElementById("totalTransactions").textContent = totalCount;
  document.getElementById("thisMonthPayments").textContent = formatCurrency(thisMonthAmount);
  document.getElementById("averagePayment").textContent = formatCurrency(averageAmount);
}

function filterPayments() {
  const methodFilter = document.getElementById("paymentMethodFilter").value;
  const dateFromFilter = document.getElementById("dateFromFilter").value;
  const dateToFilter = document.getElementById("dateToFilter").value;

  let filteredPayments = [...currentPayments];

  if (methodFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.phuongThuc === methodFilter);
  }

  if (dateFromFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.ngayThanhToan >= dateFromFilter);
  }

  if (dateToFilter) {
    filteredPayments = filteredPayments.filter((payment) => payment.ngayThanhToan <= dateToFilter + "T23:59:59");
  }

  displayPayments(filteredPayments);
  updateStatistics(filteredPayments);
}

async function viewPaymentDetail(paymentId) {
  try {
    const response = await apiCall(`/api/payments/${paymentId}`, "GET");

    if (response.success) {
      const payment = response.data;

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
                    <p>Hotel Booking System</p>
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
