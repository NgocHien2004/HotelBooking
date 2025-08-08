let userBookings = [];
let currentBookingId = null;

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  loadUserBookings();
});

async function loadUserBookings() {
  try {
    showLoading("bookingsContainer");

    const response = await apiCall("/api/bookings/my-bookings", "GET");

    if (response.success) {
      userBookings = response.data;
      displayBookings();
    } else {
      throw new Error(response.message || "Không thể tải danh sách đặt phòng");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    document.getElementById("bookingsContainer").innerHTML = `
            <div class="alert alert-danger">
                <h5>Không thể tải danh sách đặt phòng</h5>
                <p>${error.message}</p>
                <button class="btn btn-outline-danger" onclick="loadUserBookings()">Thử lại</button>
            </div>
        `;
  }
}

function displayBookings() {
  const container = document.getElementById("bookingsContainer");

  if (userBookings.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x display-1 text-muted"></i>
                <h3>Chưa có đặt phòng nào</h3>
                <p class="text-muted">Hãy bắt đầu đặt phòng đầu tiên của bạn!</p>
                <a href="index.html" class="btn btn-primary">Khám phá khách sạn</a>
            </div>
        `;
    return;
  }

  let html = '<div class="row">';

  userBookings.forEach((booking) => {
    const paymentStatus = getPaymentStatus(booking.totalPaid || 0, booking.tongTien);
    const canPay = booking.trangThai === "Pending" || (booking.trangThai === "Confirmed" && (booking.totalPaid || 0) < booking.tongTien);

    html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-primary">#${booking.maDatPhong}</h6>
                            <span class="badge ${getStatusClass(booking.trangThai)}">${getStatusText(booking.trangThai)}</span>
                        </div>
                        
                        <h6 class="mb-2">${booking.tenKhachSan}</h6>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-geo-alt"></i> ${booking.diaChiKhachSan}
                        </p>
                        
                        <div class="mb-2">
                            <small class="text-muted">Loại phòng:</small>
                            <div>${booking.tenLoaiPhong}</div>
                        </div>
                        
                        <div class="row mb-2">
                            <div class="col-6">
                                <small class="text-muted">Nhận phòng:</small>
                                <div class="small">${formatDate(booking.ngayNhanPhong)}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Trả phòng:</small>
                                <div class="small">${formatDate(booking.ngayTraPhong)}</div>
                            </div>
                        </div>
                        
                        <div class="mb-2">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">Tổng tiền:</small>
                                <strong>${formatCurrency(booking.tongTien)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">Đã thanh toán:</small>
                                <span class="${paymentStatus.class}">${formatCurrency(booking.totalPaid || 0)}</span>
                            </div>
                            ${
                              (booking.totalPaid || 0) < booking.tongTien
                                ? `
                                <div class="d-flex justify-content-between">
                                    <small class="text-muted">Còn lại:</small>
                                    <span class="text-warning">${formatCurrency(booking.tongTien - (booking.totalPaid || 0))}</span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                        
                        <div class="mb-2">
                            <small class="${paymentStatus.class}">
                                <i class="bi bi-credit-card"></i> ${paymentStatus.text}
                            </small>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent">
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-outline-primary btn-sm" onclick="showBookingDetail(${booking.maDatPhong})">
                                <i class="bi bi-eye"></i> Chi tiết
                            </button>
                            
                            ${
                              canPay
                                ? `
                                <button class="btn btn-success btn-sm" onclick="showPaymentModal(${booking.maDatPhong}, ${
                                    booking.tongTien - (booking.totalPaid || 0)
                                  })">
                                    <i class="bi bi-credit-card"></i> Thanh toán
                                </button>
                            `
                                : ""
                            }
                            
                            ${
                              booking.trangThai === "Pending"
                                ? `
                                <button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${booking.maDatPhong})">
                                    <i class="bi bi-x-circle"></i> Hủy
                                </button>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

async function showBookingDetail(bookingId) {
  try {
    const response = await apiCall(`/api/bookings/${bookingId}`, "GET");

    if (response.success) {
      const booking = response.data;
      currentBookingId = bookingId;

      // Load payments for this booking
      const paymentsResponse = await apiCall(`/api/payments/booking/${bookingId}`, "GET");
      const payments = paymentsResponse.success ? paymentsResponse.data : [];

      const paymentStatus = getPaymentStatus(booking.totalPaid || 0, booking.tongTien);

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
                
                <hr>
                
                <div class="row">
                    <div class="col-12">
                        <h6>Thông tin thanh toán</h6>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Tổng tiền:</span>
                            <strong>${formatCurrency(booking.tongTien)}</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Đã thanh toán:</span>
                            <span class="${paymentStatus.class}">${formatCurrency(booking.totalPaid || 0)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span>Còn lại:</span>
                            <span class="text-warning">${formatCurrency(booking.tongTien - (booking.totalPaid || 0))}</span>
                        </div>
                        
                        ${
                          payments.length > 0
                            ? `
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
                            : '<p class="text-muted">Chưa có thanh toán nào</p>'
                        }
                    </div>
                </div>
            `;

      document.getElementById("bookingDetailContent").innerHTML = detailHtml;

      // Show/hide action buttons
      const canEdit = booking.trangThai === "Pending";
      const canCancel = booking.trangThai === "Pending" || booking.trangThai === "Confirmed";
      const canPay = booking.trangThai === "Pending" || (booking.trangThai === "Confirmed" && (booking.totalPaid || 0) < booking.tongTien);

      document.getElementById("editBookingBtn").style.display = canEdit ? "inline-block" : "none";
      document.getElementById("cancelBookingBtn").style.display = canCancel ? "inline-block" : "none";

      // Add payment button if applicable
      const payBtn = document.getElementById("payBookingBtn");
      if (payBtn) {
        payBtn.style.display = canPay ? "inline-block" : "none";
      } else if (canPay) {
        // Create payment button if it doesn't exist
        const modalFooter = document.querySelector("#bookingModal .modal-footer");
        const payButton = document.createElement("button");
        payButton.id = "payBookingBtn";
        payButton.className = "btn btn-success";
        payButton.innerHTML = '<i class="bi bi-credit-card"></i> Thanh toán';
        payButton.onclick = () => showPaymentModal(booking.maDatPhong, booking.tongTien - (booking.totalPaid || 0));
        modalFooter.insertBefore(payButton, modalFooter.firstChild);
      }

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

function showPaymentModal(bookingId, remainingAmount) {
  const modalHtml = `
    <div class="modal fade" id="paymentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-credit-card"></i> Thanh toán đặt phòng #${bookingId}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <p>Số tiền còn lại cần thanh toán: <strong class="text-danger">${formatCurrency(remainingAmount)}</strong></p>
            </div>
            
            <div class="mb-3">
              <label for="paymentAmount" class="form-label">Số tiền thanh toán (VNĐ)</label>
              <input type="number" class="form-control" id="paymentAmount" 
                     max="${remainingAmount}" min="1" 
                     value="${remainingAmount}"
                     placeholder="Nhập số tiền">
              <div class="form-text">Tối đa: ${formatCurrency(remainingAmount)}</div>
            </div>
            
            <div class="mb-3">
              <label for="paymentMethod" class="form-label">Phương thức thanh toán</label>
              <select class="form-select" id="paymentMethod">
                <option value="Cash">Tiền mặt</option>
                <option value="Credit Card">Thẻ tín dụng</option>
                <option value="Bank Transfer">Chuyển khoản ngân hàng</option>
                <option value="E-Wallet">Ví điện tử</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-success" onclick="processPaymentFromModal(${bookingId})">
              <i class="bi bi-check-circle"></i> Xác nhận thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing payment modal if any
  const existingModal = document.getElementById("paymentModal");
  if (existingModal) {
    existingModal.remove();
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("paymentModal"));
  modal.show();
}

async function processPaymentFromModal(bookingId) {
  const paymentAmount = parseFloat(document.getElementById("paymentAmount").value);
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (!paymentAmount || paymentAmount <= 0) {
    showAlert("Vui lòng nhập số tiền thanh toán hợp lệ", "warning");
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
      showAlert("Thanh toán thành công! Admin sẽ xác nhận đặt phòng sau khi kiểm tra.", "success");

      // Close payment modal
      const paymentModal = bootstrap.Modal.getInstance(document.getElementById("paymentModal"));
      paymentModal.hide();

      // Close booking detail modal if open
      const bookingModal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
      if (bookingModal) {
        bookingModal.hide();
      }

      // Reload bookings
      loadUserBookings();
    } else {
      showAlert(response.message || "Không thể xử lý thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    showAlert("Có lỗi xảy ra khi xử lý thanh toán", "danger");
  }
}

async function cancelBooking(bookingId) {
  if (!confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) {
    return;
  }

  try {
    const response = await apiCall(`/api/bookings/${bookingId}/status`, "PATCH", "Cancelled", {
      "Content-Type": "application/json",
    });

    if (response.success) {
      showAlert("Đã hủy đặt phòng thành công", "success");
      loadUserBookings();
    } else {
      showAlert(response.message || "Không thể hủy đặt phòng", "danger");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    showAlert("Có lỗi xảy ra khi hủy đặt phòng", "danger");
  }
}
