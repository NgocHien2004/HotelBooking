// Booking Service
class BookingService {
  static async getAllBookings(page = 1, limit = 10) {
    try {
      const response = await Utils.get("/bookings", { page, limit });
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get bookings error:", error);
      return [];
    }
  }

  static async getBookingById(id) {
    try {
      const response = await Utils.get(`/bookings/${id}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Get booking error:", error);
      return null;
    }
  }

  static async getBookingsByUser(userId) {
    try {
      const response = await Utils.get(`/bookings/user/${userId}`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get user bookings error:", error);
      return [];
    }
  }

  static async createBooking(bookingData) {
    try {
      const response = await Utils.post("/bookings", bookingData);
      return response;
    } catch (error) {
      console.error("Create booking error:", error);
      throw error;
    }
  }

  static async updateBooking(id, bookingData) {
    try {
      const response = await Utils.put(`/bookings/${id}`, bookingData);
      return response;
    } catch (error) {
      console.error("Update booking error:", error);
      throw error;
    }
  }

  static async cancelBooking(id) {
    try {
      const response = await Utils.put(`/bookings/${id}/cancel`);
      return response;
    } catch (error) {
      console.error("Cancel booking error:", error);
      throw error;
    }
  }

  static async checkRoomAvailability(roomTypeId, checkIn, checkOut) {
    try {
      const response = await Utils.get("/rooms/availability", {
        roomTypeId,
        checkIn,
        checkOut,
      });
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Check availability error:", error);
      return null;
    }
  }

  static async calculateBookingTotal(roomTypeId, checkIn, checkOut) {
    try {
      const response = await Utils.get("/bookings/calculate", {
        roomTypeId,
        checkIn,
        checkOut,
      });
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Calculate total error:", error);
      return null;
    }
  }
}

// Room Service
class RoomService {
  static async getRoomsByHotel(hotelId) {
    try {
      const response = await Utils.get(`/rooms/hotel/${hotelId}`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get rooms error:", error);
      return [];
    }
  }

  static async getRoomTypeById(id) {
    try {
      const response = await Utils.get(`/rooms/types/${id}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Get room type error:", error);
      return null;
    }
  }

  static async getAvailableRooms(roomTypeId, checkIn, checkOut) {
    try {
      const response = await Utils.get("/rooms/available", {
        roomTypeId,
        checkIn,
        checkOut,
      });
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get available rooms error:", error);
      return [];
    }
  }
}

// Payment Service
class PaymentService {
  static async getPaymentMethods() {
    try {
      const response = await Utils.get("/payments/methods");
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get payment methods error:", error);
      return [
        { value: "Cash", label: "Tiền mặt" },
        { value: "Credit Card", label: "Thẻ tín dụng" },
        { value: "Bank Transfer", label: "Chuyển khoản ngân hàng" },
      ];
    }
  }

  static async createPayment(paymentData) {
    try {
      const response = await Utils.post("/payments", paymentData);
      return response;
    } catch (error) {
      console.error("Create payment error:", error);
      throw error;
    }
  }

  static async getPaymentsByBooking(bookingId) {
    try {
      const response = await Utils.get(`/payments/booking/${bookingId}`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get payments error:", error);
      return [];
    }
  }
}

// Enhanced Booking UI for booking.html
class BookingUI {
  constructor() {
    this.urlParams = Utils.getUrlParams();
    this.roomTypeId = this.urlParams.roomType;
    this.checkIn = this.urlParams.checkIn || Utils.getTodayString();
    this.checkOut = this.urlParams.checkOut || Utils.getTomorrowString();
    this.guests = this.urlParams.guests || 2;

    this.roomType = null;
    this.availableRooms = [];
    this.selectedRoom = null;
    this.bookingTotal = 0;
    this.paymentMethods = [];

    this.init();
  }

  async init() {
    if (!this.roomTypeId) {
      Utils.showError("Thông tin phòng không hợp lệ");
      Utils.redirect("index.html");
      return;
    }

    await this.loadInitialData();
    this.renderBookingForm();
    this.bindEvents();
  }

  async loadInitialData() {
    try {
      Utils.showLoading("#booking-content");

      // Load room type info
      this.roomType = await RoomService.getRoomTypeById(this.roomTypeId);
      if (!this.roomType) {
        throw new Error("Không tìm thấy loại phòng");
      }

      // Load available rooms
      this.availableRooms = await RoomService.getAvailableRooms(this.roomTypeId, this.checkIn, this.checkOut);

      // Calculate booking total
      const totalData = await BookingService.calculateBookingTotal(this.roomTypeId, this.checkIn, this.checkOut);
      this.bookingTotal = totalData?.total || 0;

      // Load payment methods
      this.paymentMethods = await PaymentService.getPaymentMethods();
    } catch (error) {
      Utils.handleApiError(error);
      Utils.redirect("index.html");
    } finally {
      Utils.hideLoading("#booking-content");
    }
  }

  renderBookingForm() {
    const container = Utils.$("#booking-content");
    if (!container) return;

    const numberOfNights = Utils.calculateDays(this.checkIn, this.checkOut);

    container.innerHTML = `
            <div class="booking-container">
                <div class="booking-header">
                    <h1>Đặt phòng</h1>
                    <nav class="breadcrumb">
                        <a href="index.html">Trang chủ</a>
                        <i class="fas fa-chevron-right"></i>
                        <a href="hotel-detail.html?id=${this.roomType.maKhachSan}">Chi tiết khách sạn</a>
                        <i class="fas fa-chevron-right"></i>
                        <span>Đặt phòng</span>
                    </nav>
                </div>

                <div class="booking-content">
                    <div class="booking-main">
                        <div class="room-summary">
                            <h2>Thông tin phòng</h2>
                            <div class="room-info-card">
                                <h3>${this.roomType.tenLoaiPhong}</h3>
                                <p><strong>Khách sạn:</strong> ${this.roomType.tenKhachSan}</p>
                                <p><strong>Sức chứa:</strong> ${this.roomType.sucChua} khách</p>
                                <p><strong>Mô tả:</strong> ${this.roomType.moTa || "Phòng tiện nghi, thoải mái"}</p>
                            </div>
                        </div>

                        <div class="booking-details">
                            <h2>Chi tiết đặt phòng</h2>
                            <form id="booking-form" class="booking-form">
                                <div class="booking-dates">
                                    <div class="form-group">
                                        <label for="check-in-date">Ngày nhận phòng:</label>
                                        <input type="date" id="check-in-date" name="checkIn" 
                                               value="${this.checkIn}" min="${Utils.getTodayString()}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="check-out-date">Ngày trả phòng:</label>
                                        <input type="date" id="check-out-date" name="checkOut" 
                                               value="${this.checkOut}" min="${Utils.getTomorrowString()}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="guest-count">Số khách:</label>
                                        <select id="guest-count" name="guests" required>
                                            ${this.generateGuestOptions()}
                                        </select>
                                    </div>
                                </div>

                                <div class="room-selection">
                                    <h3>Chọn phòng</h3>
                                    <div class="available-rooms" id="available-rooms">
                                        ${this.renderAvailableRooms()}
                                    </div>
                                </div>

                                <div class="guest-info">
                                    <h3>Thông tin khách hàng</h3>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="guest-name">Họ và tên:</label>
                                            <input type="text" id="guest-name" name="guestName" 
                                                   value="${AuthService.getCurrentUser()?.hoTen || ""}" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="guest-email">Email:</label>
                                            <input type="email" id="guest-email" name="guestEmail" 
                                                   value="${AuthService.getCurrentUser()?.email || ""}" required readonly>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="guest-phone">Số điện thoại:</label>
                                            <input type="tel" id="guest-phone" name="guestPhone" 
                                                   value="${AuthService.getCurrentUser()?.soDienThoai || ""}" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="special-requests">Yêu cầu đặc biệt (tùy chọn):</label>
                                        <textarea id="special-requests" name="specialRequests" rows="3" 
                                                  placeholder="Nhập các yêu cầu đặc biệt của bạn..."></textarea>
                                    </div>
                                </div>

                                <div class="payment-method">
                                    <h3>Phương thức thanh toán</h3>
                                    <div class="payment-options">
                                        ${this.renderPaymentMethods()}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="booking-sidebar">
                        <div class="booking-summary">
                            <h3>Tóm tắt đặt phòng</h3>
                            <div class="summary-item">
                                <span>Loại phòng:</span>
                                <span>${this.roomType.tenLoaiPhong}</span>
                            </div>
                            <div class="summary-item">
                                <span>Ngày nhận phòng:</span>
                                <span id="summary-checkin">${Utils.formatDate(this.checkIn)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Ngày trả phòng:</span>
                                <span id="summary-checkout">${Utils.formatDate(this.checkOut)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Số đêm:</span>
                                <span id="summary-nights">${numberOfNights} đêm</span>
                            </div>
                            <div class="summary-item">
                                <span>Số khách:</span>
                                <span id="summary-guests">${this.guests} khách</span>
                            </div>
                            <hr>
                            <div class="summary-item">
                                <span>Giá phòng/đêm:</span>
                                <span>${Utils.formatCurrency(this.roomType.giaMotDem)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Tổng tiền phòng:</span>
                                <span id="summary-subtotal">${Utils.formatCurrency(this.bookingTotal)}</span>
                            </div>
                            <div class="summary-item total">
                                <span><strong>Tổng cộng:</strong></span>
                                <span id="summary-total"><strong>${Utils.formatCurrency(this.bookingTotal)}</strong></span>
                            </div>

                            <button type="submit" form="booking-form" class="btn-confirm-booking" id="confirm-booking-btn">
                                <i class="fas fa-credit-card"></i>
                                Xác nhận đặt phòng
                            </button>
                        </div>

                        <div class="booking-policies">
                            <h4>Chính sách đặt phòng</h4>
                            <ul>
                                <li>Thời gian nhận phòng: 14:00</li>
                                <li>Thời gian trả phòng: 12:00</li>
                                <li>Hủy miễn phí trước 24h</li>
                                <li>Thanh toán khi nhận phòng</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  generateGuestOptions() {
    let options = "";
    for (let i = 1; i <= this.roomType.sucChua; i++) {
      const selected = i == this.guests ? "selected" : "";
      options += `<option value="${i}" ${selected}>${i} khách</option>`;
    }
    return options;
  }

  renderAvailableRooms() {
    if (this.availableRooms.length === 0) {
      return '<p class="no-rooms">Không có phòng trống trong thời gian này.</p>';
    }

    return this.availableRooms
      .map(
        (room) => `
            <div class="room-option">
                <input type="radio" id="room-${room.maPhong}" name="selectedRoom" 
                       value="${room.maPhong}" required>
                <label for="room-${room.maPhong}" class="room-option-label">
                    <div class="room-number">Phòng ${room.soPhong}</div>
                    <div class="room-status">
                        <i class="fas fa-check-circle text-success"></i>
                        Có sẵn
                    </div>
                </label>
            </div>
        `
      )
      .join("");
  }

  renderPaymentMethods() {
    return this.paymentMethods
      .map(
        (method) => `
            <div class="payment-option">
                <input type="radio" id="payment-${method.value}" name="paymentMethod" 
                       value="${method.value}" required>
                <label for="payment-${method.value}" class="payment-option-label">
                    <i class="fas fa-${this.getPaymentIcon(method.value)}"></i>
                    ${method.label}
                </label>
            </div>
        `
      )
      .join("");
  }

  getPaymentIcon(method) {
    const icons = {
      Cash: "money-bill-wave",
      "Credit Card": "credit-card",
      "Bank Transfer": "university",
      "E-Wallet": "mobile-alt",
    };
    return icons[method] || "credit-card";
  }

  bindEvents() {
    // Date change events
    const checkInInput = Utils.$("#check-in-date");
    const checkOutInput = Utils.$("#check-out-date");

    if (checkInInput && checkOutInput) {
      checkInInput.addEventListener("change", () => {
        this.updateDates();
      });

      checkOutInput.addEventListener("change", () => {
        this.updateDates();
      });
    }

    // Guest count change
    const guestCountSelect = Utils.$("#guest-count");
    if (guestCountSelect) {
      guestCountSelect.addEventListener("change", () => {
        this.updateGuestCount();
      });
    }

    // Room selection
    const roomInputs = Utils.$$('input[name="selectedRoom"]');
    roomInputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.selectedRoom = input.value;
      });
    });

    // Form submission
    const bookingForm = Utils.$("#booking-form");
    if (bookingForm) {
      bookingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }
  }

  async updateDates() {
    const checkIn = Utils.$("#check-in-date").value;
    const checkOut = Utils.$("#check-out-date").value;

    if ((checkIn && checkOut && checkIn !== this.checkIn) || checkOut !== this.checkOut) {
      this.checkIn = checkIn;
      this.checkOut = checkOut;

      // Update URL
      Utils.setUrlParam("checkIn", checkIn);
      Utils.setUrlParam("checkOut", checkOut);

      // Reload available rooms and recalculate total
      await this.loadAvailableRooms();
      await this.recalculateTotal();
      this.updateSummary();
    }
  }

  updateGuestCount() {
    this.guests = Utils.$("#guest-count").value;
    Utils.setUrlParam("guests", this.guests);
    this.updateSummary();
  }

  async loadAvailableRooms() {
    try {
      this.availableRooms = await RoomService.getAvailableRooms(this.roomTypeId, this.checkIn, this.checkOut);

      const roomsContainer = Utils.$("#available-rooms");
      if (roomsContainer) {
        roomsContainer.innerHTML = this.renderAvailableRooms();

        // Re-bind room selection events
        const roomInputs = Utils.$$('input[name="selectedRoom"]');
        roomInputs.forEach((input) => {
          input.addEventListener("change", () => {
            this.selectedRoom = input.value;
          });
        });
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  async recalculateTotal() {
    try {
      const totalData = await BookingService.calculateBookingTotal(this.roomTypeId, this.checkIn, this.checkOut);
      this.bookingTotal = totalData?.total || 0;
    } catch (error) {
      console.error("Recalculate total error:", error);
    }
  }

  updateSummary() {
    const numberOfNights = Utils.calculateDays(this.checkIn, this.checkOut);

    Utils.$("#summary-checkin").textContent = Utils.formatDate(this.checkIn);
    Utils.$("#summary-checkout").textContent = Utils.formatDate(this.checkOut);
    Utils.$("#summary-nights").textContent = `${numberOfNights} đêm`;
    Utils.$("#summary-guests").textContent = `${this.guests} khách`;
    Utils.$("#summary-subtotal").textContent = Utils.formatCurrency(this.bookingTotal);
    Utils.$("#summary-total").textContent = Utils.formatCurrency(this.bookingTotal);
  }

  async handleBookingSubmit() {
    if (!this.validateBookingForm()) return;

    const formData = Utils.getFormData("#booking-form");
    const confirmBtn = Utils.$("#confirm-booking-btn");

    // Disable button
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

    try {
      const bookingData = {
        maPhong: parseInt(formData.selectedRoom),
        ngayNhanPhong: this.checkIn,
        ngayTraPhong: this.checkOut,
        ghiChu: formData.specialRequests || "",
      };

      const result = await BookingService.createBooking(bookingData);

      if (result.success) {
        Utils.showSuccess("Đặt phòng thành công!");

        // Redirect to booking confirmation or history
        setTimeout(() => {
          Utils.redirect(`booking-history.html`);
        }, 2000);
      } else {
        Utils.showError(result.message || "Có lỗi xảy ra khi đặt phòng");
      }
    } catch (error) {
      Utils.handleApiError(error);
    } finally {
      // Re-enable button
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-credit-card"></i> Xác nhận đặt phòng';
    }
  }

  validateBookingForm() {
    // Validate dates
    const checkInDate = new Date(this.checkIn);
    const checkOutDate = new Date(this.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      Utils.showError("Ngày nhận phòng không thể là ngày trong quá khứ");
      return false;
    }

    if (checkOutDate <= checkInDate) {
      Utils.showError("Ngày trả phòng phải sau ngày nhận phòng");
      return false;
    }

    // Validate room selection
    if (!this.selectedRoom) {
      Utils.showError("Vui lòng chọn phòng");
      return false;
    }

    // Validate guest info
    const guestName = Utils.$("#guest-name").value.trim();
    const guestPhone = Utils.$("#guest-phone").value.trim();

    if (!guestName) {
      Utils.showError("Vui lòng nhập họ tên");
      return false;
    }

    if (!guestPhone) {
      Utils.showError("Vui lòng nhập số điện thoại");
      return false;
    }

    if (!Utils.validatePhone(guestPhone)) {
      Utils.showError("Số điện thoại không hợp lệ");
      return false;
    }

    // Validate payment method
    const paymentMethod = Utils.$('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
      Utils.showError("Vui lòng chọn phương thức thanh toán");
      return false;
    }

    return true;
  }
}

// Booking History UI for booking-history.html
class BookingHistoryUI {
  constructor() {
    this.currentUser = AuthService.getCurrentUser();
    this.bookings = [];
    this.currentPage = 1;
    this.totalPages = 1;

    this.init();
  }

  async init() {
    await this.loadBookingHistory();
    this.renderBookingHistory();
    this.bindEvents();
  }

  async loadBookingHistory() {
    try {
      Utils.showLoading("#booking-history-content");

      this.bookings = await BookingService.getBookingsByUser(this.currentUser.maNguoiDung);
    } catch (error) {
      Utils.handleApiError(error);
    } finally {
      Utils.hideLoading("#booking-history-content");
    }
  }

  renderBookingHistory() {
    const container = Utils.$("#booking-history-content");
    if (!container) return;

    container.innerHTML = `
            <div class="booking-history-header">
                <h1>Lịch sử đặt phòng</h1>
                <p>Quản lý tất cả các đặt phòng của bạn</p>
            </div>

            <div class="booking-history-filters">
                <div class="filter-group">
                    <label for="status-filter">Trạng thái:</label>
                    <select id="status-filter">
                        <option value="">Tất cả</option>
                        <option value="Pending">Chờ xác nhận</option>
                        <option value="Confirmed">Đã xác nhận</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div class="booking-list">
                ${this.renderBookingList()}
            </div>
        `;
  }

  renderBookingList() {
    if (this.bookings.length === 0) {
      return `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Chưa có đặt phòng nào</h3>
                    <p>Bạn chưa có đặt phòng nào. Hãy khám phá các khách sạn và đặt phòng ngay!</p>
                    <a href="index.html" class="btn-primary">Khám phá khách sạn</a>
                </div>
            `;
    }

    return this.bookings
      .map(
        (booking) => `
            <div class="booking-item">
                <div class="booking-item-header">
                    <div class="booking-info">
                        <h3>${booking.tenKhachSan}</h3>
                        <p class="booking-room">Phòng: ${booking.soPhong} - ${booking.tenLoaiPhong}</p>
                        <p class="booking-dates">
                            <i class="fas fa-calendar"></i>
                            ${Utils.formatDate(booking.ngayNhanPhong)} - ${Utils.formatDate(booking.ngayTraPhong)}
                            (${booking.soNgayO} đêm)
                        </p>
                    </div>
                    <div class="booking-status">
                        <span class="status-badge ${booking.trangThai.toLowerCase()}">
                            ${this.getStatusText(booking.trangThai)}
                        </span>
                        <div class="booking-total">
                            ${Utils.formatCurrency(booking.tongTien)}
                        </div>
                    </div>
                </div>
                
                <div class="booking-item-actions">
                    <button class="btn btn-outline" onclick="BookingHistoryUI.viewBookingDetail(${booking.maDatPhong})">
                        <i class="fas fa-eye"></i>
                        Xem chi tiết
                    </button>
                    
                    ${
                      booking.trangThai === "Pending" || booking.trangThai === "Confirmed"
                        ? `
                        <button class="btn btn-error" onclick="BookingHistoryUI.cancelBooking(${booking.maDatPhong})">
                            <i class="fas fa-times"></i>
                            Hủy đặt phòng
                        </button>
                    `
                        : ""
                    }
                    
                    ${
                      booking.trangThai === "Completed"
                        ? `
                        <button class="btn btn-primary" onclick="BookingHistoryUI.reviewHotel(${booking.maKhachSan})">
                            <i class="fas fa-star"></i>
                            Đánh giá
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");
  }

  getStatusText(status) {
    const statusMap = {
      Pending: "Chờ xác nhận",
      Confirmed: "Đã xác nhận",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  }

  bindEvents() {
    // Status filter
    const statusFilter = Utils.$("#status-filter");
    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        this.filterBookings();
      });
    }
  }

  filterBookings() {
    const statusFilter = Utils.$("#status-filter").value;

    let filteredBookings = [...this.bookings];

    if (statusFilter) {
      filteredBookings = filteredBookings.filter((booking) => booking.trangThai === statusFilter);
    }

    // Re-render booking list
    const bookingList = Utils.$(".booking-list");
    if (bookingList) {
      bookingList.innerHTML = this.renderFilteredBookingList(filteredBookings);
    }
  }

  renderFilteredBookingList(bookings) {
    if (bookings.length === 0) {
      return `
                <div class="no-bookings">
                    <i class="fas fa-search"></i>
                    <h3>Không tìm thấy đặt phòng nào</h3>
                    <p>Không có đặt phòng nào phù hợp với bộ lọc hiện tại.</p>
                </div>
            `;
    }

    return bookings
      .map(
        (booking) => `
            <div class="booking-item">
                <div class="booking-item-header">
                    <div class="booking-info">
                        <h3>${booking.tenKhachSan}</h3>
                        <p class="booking-room">Phòng: ${booking.soPhong} - ${booking.tenLoaiPhong}</p>
                        <p class="booking-dates">
                            <i class="fas fa-calendar"></i>
                            ${Utils.formatDate(booking.ngayNhanPhong)} - ${Utils.formatDate(booking.ngayTraPhong)}
                            (${booking.soNgayO} đêm)
                        </p>
                    </div>
                    <div class="booking-status">
                        <span class="status-badge ${booking.trangThai.toLowerCase()}">
                            ${this.getStatusText(booking.trangThai)}
                        </span>
                        <div class="booking-total">
                            ${Utils.formatCurrency(booking.tongTien)}
                        </div>
                    </div>
                </div>
                
                <div class="booking-item-actions">
                    <button class="btn btn-outline" onclick="BookingHistoryUI.viewBookingDetail(${booking.maDatPhong})">
                        <i class="fas fa-eye"></i>
                        Xem chi tiết
                    </button>
                    
                    ${
                      booking.trangThai === "Pending" || booking.trangThai === "Confirmed"
                        ? `
                        <button class="btn btn-error" onclick="BookingHistoryUI.cancelBooking(${booking.maDatPhong})">
                            <i class="fas fa-times"></i>
                            Hủy đặt phòng
                        </button>
                    `
                        : ""
                    }
                    
                    ${
                      booking.trangThai === "Completed"
                        ? `
                        <button class="btn btn-primary" onclick="BookingHistoryUI.reviewHotel(${booking.maKhachSan})">
                            <i class="fas fa-star"></i>
                            Đánh giá
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");
  }

  static async viewBookingDetail(bookingId) {
    try {
      const booking = await BookingService.getBookingById(bookingId);
      if (!booking) {
        Utils.showError("Không tìm thấy thông tin đặt phòng");
        return;
      }

      // Show booking detail modal
      Utils.showModal("#booking-detail-modal");

      // Render booking detail in modal
      const modalBody = Utils.$("#booking-detail-modal .modal-body");
      if (modalBody) {
        modalBody.innerHTML = `
                    <div class="booking-detail">
                        <h3>${booking.tenKhachSan}</h3>
                        <div class="detail-row">
                            <span>Mã đặt phòng:</span>
                            <span>#${booking.maDatPhong}</span>
                        </div>
                        <div class="detail-row">
                            <span>Phòng:</span>
                            <span>${booking.soPhong} - ${booking.tenLoaiPhong}</span>
                        </div>
                        <div class="detail-row">
                            <span>Ngày nhận phòng:</span>
                            <span>${Utils.formatDateTime(booking.ngayNhanPhong)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Ngày trả phòng:</span>
                            <span>${Utils.formatDateTime(booking.ngayTraPhong)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Số đêm:</span>
                            <span>${booking.soNgayO} đêm</span>
                        </div>
                        <div class="detail-row">
                            <span>Trạng thái:</span>
                            <span class="status-badge ${booking.trangThai.toLowerCase()}">
                                ${BookingHistoryUI.prototype.getStatusText(booking.trangThai)}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span>Tổng tiền:</span>
                            <span class="booking-total">${Utils.formatCurrency(booking.tongTien)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Ngày đặt:</span>
                            <span>${Utils.formatDateTime(booking.ngayDat)}</span>
                        </div>
                        ${
                          booking.ghiChu
                            ? `
                            <div class="detail-row">
                                <span>Ghi chú:</span>
                                <span>${booking.ghiChu}</span>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  static async cancelBooking(bookingId) {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) {
      return;
    }

    try {
      const result = await BookingService.cancelBooking(bookingId);

      if (result.success) {
        Utils.showSuccess("Hủy đặt phòng thành công");

        // Reload page to refresh data
        setTimeout(() => {
          Utils.reload();
        }, 1000);
      } else {
        Utils.showError(result.message || "Có lỗi xảy ra khi hủy đặt phòng");
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  static reviewHotel(hotelId) {
    Utils.redirect(`hotel-detail.html?id=${hotelId}#reviews`);
  }
}

// Export for global use
window.BookingService = BookingService;
window.RoomService = RoomService;
window.PaymentService = PaymentService;
window.BookingUI = BookingUI;
window.BookingHistoryUI = BookingHistoryUI;
