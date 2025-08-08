let bookings = [];
let currentBookingId = null;
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;

document.addEventListener("DOMContentLoaded", function () {
  if (!isAuthenticated()) {
    window.location.href = "../login.html";
    return;
  }

  // Check admin access
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.vaiTro || user.vaiTro !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
    return;
  }

  loadBookings();

  // Add event listeners
  document.getElementById("searchInput").addEventListener("input", filterBookings);
  document.getElementById("statusFilter").addEventListener("change", filterBookings);
  document.getElementById("dateFilter").addEventListener("change", filterBookings);
});

async function loadBookings() {
  try {
    showLoading("bookingsTable");

    const response = await apiCall("/api/bookings", "GET");

    if (response.success) {
      bookings = response.data;
      totalItems = bookings.length;
      displayBookings();
      updatePagination(totalItems);
    } else {
      throw new Error(response.message || "Không thể tải danh sách đặt phòng");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    document.getElementById("bookingsTable").innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="alert alert-danger">
                        <h5>Không thể tải danh sách đặt phòng</h5>
                        <p>${error.message}</p>
                        <button class="btn btn-outline-danger" onclick="loadBookings()">Thử lại</button>
                    </div>
                </td>
            </tr>
        `;
  }
}

function displayBookings() {
  const tableBody = document.getElementById("bookingsTable");

  if (bookings.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
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

  let html = "";
  paginatedBookings.forEach((booking) => {
    const paymentStatus = getPaymentStatus(booking.totalPaid || 0, booking.tongTien);

    html += `
            <tr>
                <td>#${booking.maDatPhong}</td>
                <td>${booking.hoTenKhach}</td>
                <td>${booking.tenKhachSan}</td>
                <td>${booking.tenLoaiPhong}</td>
                <td>${formatDate(booking.ngayNhanPhong)}</td>
                <td>${formatDate(booking.ngayTraPhong)}</td>
                <td>${formatCurrency(booking.tongTien)}</td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="${paymentStatus.class} small">${paymentStatus.text}</span>
                        <span class="text-muted small">${formatCurrency(booking.totalPaid || 0)}/${formatCurrency(booking.tongTien)}</span>
                    </div>
                </td>
                <td><span class="badge ${getStatusClass(booking.trangThai)}">${getStatusText(booking.trangThai)}</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="showBookingDetail(${booking.maDatPhong})" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${
                          booking.trangThai === "Pending"
                            ? `
                            <button class="btn btn-outline-success" onclick="confirmBooking(${booking.maDatPhong})" title="Xác nhận">
                                <i class="bi bi-check-circle"></i>
                            </button>
                        `
                            : ""
                        }
                        ${
                          booking.trangThai !== "Cancelled" && booking.trangThai !== "Completed"
                            ? `
                            <button class="btn btn-outline-danger" onclick="cancelBooking(${booking.maDatPhong})" title="Hủy">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                    </td>
           </tr>
       `;
  });

  tableBody.innerHTML = html;
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
                       <h6>Thông tin khách hàng</h6>
                       <p><strong>Họ tên:</strong> ${booking.hoTenKhach}</p>
                       <p><strong>Email:</strong> ${booking.emailKhach}</p>
                       <p><strong>SĐT:</strong> ${booking.soDienThoaiKhach || "Chưa cập nhật"}</p>
                       
                       <h6 class="mt-3">Thông tin khách sạn</h6>
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
                       <p><strong>Ngày nhận phong:</strong> ${formatDate(booking.ngayNhanPhong)}</p>
                       <p><strong>Ngày trả phòng:</strong> ${formatDate(booking.ngayTraPhong)}</p>
                       <p><strong>Số đêm:</strong> ${booking.soDem || calculateNights(booking.ngayNhanPhong, booking.ngayTraPhong)}</p>
                       <p><strong>Tổng tiền:</strong> ${formatCurrency(booking.tongTien)}</p>
                       <p><strong>Trạng thái:</strong> <span class="badge ${getStatusClass(booking.trangThai)}">${getStatusText(
        booking.trangThai
      )}</span></p>
                       
                       <h6 class="mt-3">Tình trạng thanh toán</h6>
                       <div class="card">
                           <div class="card-body">
                               <div class="d-flex justify-content-between mb-2">
                                   <span>Tổng tiền:</span>
                                   <strong>${formatCurrency(booking.tongTien)}</strong>
                               </div>
                               <div class="d-flex justify-content-between mb-2">
                                   <span>Đã thanh toán:</span>
                                   <span class="${paymentStatus.class}">${formatCurrency(booking.totalPaid || 0)}</span>
                               </div>
                               <div class="d-flex justify-content-between mb-2">
                                   <span>Còn lại:</span>
                                   <span class="text-warning">${formatCurrency(booking.tongTien - (booking.totalPaid || 0))}</span>
                               </div>
                               <div class="mt-2">
                                   <span class="badge ${
                                     paymentStatus.class === "text-success"
                                       ? "bg-success"
                                       : paymentStatus.class === "text-warning"
                                       ? "bg-warning text-dark"
                                       : "bg-danger"
                                   }">
                                       ${paymentStatus.text}
                                   </span>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
               
               <hr>
               
               <div class="row">
                   <div class="col-12">
                       ${
                         payments.length > 0
                           ? `
                           <h6>Lịch sử thanh toán</h6>
                           <div class="table-responsive">
                               <table class="table table-sm">
                                   <thead>
                                       <tr>
                                           <th>Mã thanh toán</th>
                                           <th>Ngày thanh toán</th>
                                           <th>Số tiền</th>
                                           <th>Phương thức</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       ${payments
                                         .map(
                                           (payment) => `
                                           <tr>
                                               <td>#${payment.maThanhToan}</td>
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
                       
                       ${
                         (booking.totalPaid || 0) < booking.tongTien && booking.trangThai !== "Cancelled"
                           ? `
                           <button class="btn btn-success btn-sm mt-2" onclick="showAddPaymentModal(${booking.maDatPhong}, ${
                               booking.tongTien - (booking.totalPaid || 0)
                             })">
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
  const modalHtml = `
   <div class="modal fade" id="addPaymentModal" tabindex="-1">
     <div class="modal-dialog">
       <div class="modal-content">
         <div class="modal-header bg-success text-white">
           <h5 class="modal-title">
             <i class="bi bi-plus-circle"></i> Thêm thanh toán cho đặt phòng #${bookingId}
           </h5>
           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
         </div>
         <div class="modal-body">
           <div class="alert alert-info">
             <strong>Số tiền còn lại:</strong> ${formatCurrency(remainingAmount)}
           </div>
           
           <div class="mb-3">
             <label for="adminPaymentAmount" class="form-label">Số tiền thanh toán (VNĐ) *</label>
             <input type="number" class="form-control" id="adminPaymentAmount" 
                    max="${remainingAmount}" min="1" 
                    value="${remainingAmount}"
                    placeholder="Nhập số tiền" required>
             <div class="form-text">Tối đa: ${formatCurrency(remainingAmount)}</div>
           </div>
           
           <div class="mb-3">
             <label for="adminPaymentMethod" class="form-label">Phương thức thanh toán *</label>
             <select class="form-select" id="adminPaymentMethod" required>
               <option value="Cash">Tiền mặt</option>
               <option value="Credit Card">Thẻ tín dụng</option>
               <option value="Bank Transfer">Chuyển khoản ngân hàng</option>
               <option value="E-Wallet">Ví điện tử</option>
             </select>
           </div>
           
           <div class="mb-3">
             <label for="paymentNote" class="form-label">Ghi chú (tùy chọn)</label>
             <textarea class="form-control" id="paymentNote" rows="2" 
                       placeholder="Ghi chú về thanh toán này..."></textarea>
           </div>
         </div>
         <div class="modal-footer">
           <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
           <button type="button" class="btn btn-success" onclick="processAdminPayment(${bookingId})">
             <i class="bi bi-check-circle"></i> Xác nhận thanh toán
           </button>
         </div>
       </div>
     </div>
   </div>
 `;

  // Remove existing modal if any
  const existingModal = document.getElementById("addPaymentModal");
  if (existingModal) {
    existingModal.remove();
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("addPaymentModal"));
  modal.show();
}

async function processAdminPayment(bookingId) {
  const paymentAmount = parseFloat(document.getElementById("adminPaymentAmount").value);
  const paymentMethod = document.getElementById("adminPaymentMethod").value;
  const paymentNote = document.getElementById("paymentNote").value;

  if (!paymentAmount || paymentAmount <= 0) {
    showAlert("Vui lòng nhập số tiền thanh toán hợp lệ", "warning");
    return;
  }

  if (!paymentMethod) {
    showAlert("Vui lòng chọn phương thức thanh toán", "warning");
    return;
  }

  try {
    const paymentData = {
      maDatPhong: bookingId,
      soTien: paymentAmount,
      phuongThuc: paymentMethod,
      ghiChu: paymentNote || undefined,
    };

    const response = await apiCall("/api/payments", "POST", paymentData);

    if (response.success) {
      showAlert("Thêm thanh toán thành công!", "success");

      // Close payment modal
      const paymentModal = bootstrap.Modal.getInstance(document.getElementById("addPaymentModal"));
      paymentModal.hide();

      // Close booking detail modal
      const bookingModal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
      if (bookingModal) {
        bookingModal.hide();
      }

      // Reload bookings
      loadBookings();
    } else {
      showAlert(response.message || "Không thể thêm thanh toán", "danger");
    }
  } catch (error) {
    console.error("Error processing admin payment:", error);
    showAlert("Có lỗi xảy ra khi thêm thanh toán", "danger");
  }
}

function filterBookings() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

  let filtered = bookings;

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(
      (booking) =>
        booking.maDatPhong.toString().includes(searchTerm) ||
        booking.hoTenKhach.toLowerCase().includes(searchTerm) ||
        booking.emailKhach.toLowerCase().includes(searchTerm) ||
        booking.tenKhachSan.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by status
  if (statusFilter) {
    filtered = filtered.filter((booking) => booking.trangThai === statusFilter);
  }

  // Filter by check-in date
  if (dateFilter) {
    filtered = filtered.filter((booking) => booking.ngayNhanPhong.startsWith(dateFilter));
  }

  // Update display
  const originalBookings = bookings;
  bookings = filtered;
  currentPage = 1;
  displayBookings();
  updatePagination(filtered.length);

  // Restore original array for future filters
  bookings = originalBookings;
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
           <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
       </li>
   `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHtml += `
               <li class="page-item ${currentPage === i ? "active" : ""}">
                   <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
               </li>
           `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  paginationHtml += `
       <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
           <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
       </li>
   `;

  pagination.innerHTML = paginationHtml;
}

function changePage(page) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  displayBookings();
  updatePagination(totalItems);
}
