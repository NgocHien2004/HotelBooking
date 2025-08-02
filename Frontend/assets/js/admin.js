// Admin Dashboard
class AdminDashboard {
  constructor() {
    this.stats = {
      totalHotels: 0,
      totalRooms: 0,
      todayBookings: 0,
      monthlyRevenue: 0,
      totalUsers: 0,
      avgRating: 0,
    };
    this.activities = [];

    this.init();
  }

  async init() {
    await this.loadDashboardData();
    this.renderStats();
    this.renderActivities();
    this.initCharts();
  }

  async loadDashboardData() {
    try {
      // Mock data - replace with actual API calls
      this.stats = {
        totalHotels: 25,
        totalRooms: 450,
        todayBookings: 12,
        monthlyRevenue: 850000000,
        totalUsers: 1250,
        avgRating: 4.3,
      };

      this.activities = [
        {
          time: "10:30",
          activity: "Đặt phòng mới",
          user: "Nguyễn Văn A",
          status: "success",
        },
        {
          time: "09:15",
          activity: "Hủy đặt phòng",
          user: "Trần Thị B",
          status: "warning",
        },
        {
          time: "08:45",
          activity: "Đánh giá mới",
          user: "Lê Văn C",
          status: "info",
        },
      ];
    } catch (error) {
      console.error("Load dashboard data error:", error);
    }
  }

  renderStats() {
    Utils.$("#total-hotels").textContent = this.stats.totalHotels;
    Utils.$("#total-rooms").textContent = this.stats.totalRooms;
    Utils.$("#today-bookings").textContent = this.stats.todayBookings;
    Utils.$("#monthly-revenue").textContent = Utils.formatCurrency(this.stats.monthlyRevenue);
    Utils.$("#total-users").textContent = this.stats.totalUsers;
    Utils.$("#avg-rating").textContent = `${this.stats.avgRating}/5`;
  }

  renderActivities() {
    const tbody = Utils.$("#recent-activities");
    if (!tbody) return;

    if (this.activities.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        Chưa có hoạt động nào
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = this.activities
      .map(
        (activity) => `
            <tr>
                <td>${activity.time}</td>
                <td>${activity.activity}</td>
                <td>${activity.user}</td>
                <td>
                    <span class="status-badge ${activity.status}">
                        ${this.getActivityStatusText(activity.status)}
                    </span>
                </td>
            </tr>
        `
      )
      .join("");
  }

  getActivityStatusText(status) {
    const statusMap = {
      success: "Thành công",
      warning: "Cảnh báo",
      info: "Thông tin",
      error: "Lỗi",
    };
    return statusMap[status] || status;
  }

  initCharts() {
    // Mock chart initialization
    this.initBookingsChart();
    this.initRevenueChart();
  }

  initBookingsChart() {
    const canvas = Utils.$("#bookings-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Mock chart data
    const mockData = {
      labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
      bookings: [45, 52, 48, 61, 55, 67, 73, 69, 75, 81, 78, 85],
    };

    // Simple line chart drawing
    this.drawLineChart(ctx, canvas.width, canvas.height, mockData.labels, mockData.bookings, "#2563eb");
  }

  initRevenueChart() {
    const canvas = Utils.$("#revenue-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Mock chart data
    const mockData = {
      labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
      revenue: [120, 135, 128, 155, 142, 168, 185, 172, 195, 210, 198, 225],
    };

    // Simple bar chart drawing
    this.drawBarChart(ctx, canvas.width, canvas.height, mockData.labels, mockData.revenue, "#10b981");
  }

  drawLineChart(ctx, width, height, labels, data, color) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max values
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  drawBarChart(ctx, width, height, labels, data, color) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value
    const maxValue = Math.max(...data);

    // Draw bars
    ctx.fillStyle = color;
    const barWidth = (chartWidth / data.length) * 0.8;
    const barSpacing = (chartWidth / data.length) * 0.2;

    data.forEach((value, index) => {
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2;
      const barHeight = (value / maxValue) * chartHeight;
      const y = padding + chartHeight - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  static refreshActivities() {
    const dashboard = window.adminDashboard;
    if (dashboard) {
      dashboard.loadDashboardData().then(() => {
        dashboard.renderActivities();
        Utils.showSuccess("Đã làm mới hoạt động gần đây");
      });
    }
  }
}

// Admin Service Classes
class AdminService {
  static async getDashboardStats() {
    try {
      const response = await Utils.get("/admin/dashboard/stats");
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return null;
    }
  }

  static async getRecentActivities() {
    try {
      const response = await Utils.get("/admin/activities/recent");
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get recent activities error:", error);
      return [];
    }
  }

  static async exportData(type, filters = {}) {
    try {
      const response = await Utils.post("/admin/export", {
        type,
        filters,
      });

      if (response.success) {
        // Handle file download
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        return true;
      }
      return false;
    } catch (error) {
      console.error("Export data error:", error);
      throw error;
    }
  }
}

// Admin User Management
class AdminUsers {
  constructor() {
    this.users = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.selectedUserId = null;

    this.init();
  }

  async init() {
    await this.loadUsers();
    this.bindEvents();
  }

  async loadUsers() {
    try {
      // Mock data - replace with actual API call
      this.users = [
        {
          maNguoiDung: 1,
          hoTen: "Nguyễn Văn A",
          email: "nguyenvana@email.com",
          soDienThoai: "0123456789",
          vaiTro: "Customer",
          ngayTao: "2024-01-15T10:30:00",
          trangThai: "Active",
        },
        {
          maNguoiDung: 2,
          hoTen: "Trần Thị B",
          email: "tranthib@email.com",
          soDienThoai: "0987654321",
          vaiTro: "Customer",
          ngayTao: "2024-02-20T14:15:00",
          trangThai: "Active",
        },
        {
          maNguoiDung: 3,
          hoTen: "Admin User",
          email: "admin@hotel.com",
          soDienThoai: "0111222333",
          vaiTro: "Admin",
          ngayTao: "2024-01-01T09:00:00",
          trangThai: "Active",
        },
      ];

      this.renderUsersTable();
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  renderUsersTable() {
    const tbody = Utils.$("#users-table-body");
    if (!tbody) return;

    if (this.users.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Chưa có người dùng nào
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = this.users
      .map(
        (user) => `
            <tr>
                <td>#${user.maNguoiDung}</td>
                <td>
                    <div>
                        <strong>${user.hoTen}</strong>
                        <br>
                        <small class="text-secondary">${user.email}</small>
                    </div>
                </td>
                <td>${user.soDienThoai || "-"}</td>
                <td>
                    <span class="status-badge ${user.vaiTro.toLowerCase()}">
                        ${user.vaiTro}
                    </span>
                </td>
                <td>${Utils.formatDate(user.ngayTao)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminUsers.editUser(${user.maNguoiDung})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${
                      user.vaiTro !== "Admin"
                        ? `
                        <button class="btn btn-sm btn-error" onclick="AdminUsers.deleteUser(${user.maNguoiDung})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    `
                        : ""
                    }
                </td>
            </tr>
        `
      )
      .join("");
  }

  bindEvents() {
    // Search functionality
    const searchInput = Utils.$("#search-users");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          this.searchUsers(e.target.value);
        }, 300)
      );
    }
  }

  searchUsers(searchTerm) {
    if (!searchTerm.trim()) {
      this.renderUsersTable();
      return;
    }

    const filteredUsers = this.users.filter(
      (user) =>
        user.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.soDienThoai?.includes(searchTerm)
    );

    this.renderFilteredUsersTable(filteredUsers);
  }

  renderFilteredUsersTable(users) {
    const tbody = Utils.$("#users-table-body");
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Không tìm thấy người dùng nào phù hợp
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>#${user.maNguoiDung}</td>
                <td>
                    <div>
                        <strong>${user.hoTen}</strong>
                        <br>
                        <small class="text-secondary">${user.email}</small>
                    </div>
                </td>
                <td>${user.soDienThoai || "-"}</td>
                <td>
                    <span class="status-badge ${user.vaiTro.toLowerCase()}">
                        ${user.vaiTro}
                    </span>
                </td>
                <td>${Utils.formatDate(user.ngayTao)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminUsers.editUser(${user.maNguoiDung})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${
                      user.vaiTro !== "Admin"
                        ? `
                        <button class="btn btn-sm btn-error" onclick="AdminUsers.deleteUser(${user.maNguoiDung})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    `
                        : ""
                    }
                </td>
            </tr>
        `
      )
      .join("");
  }

  static editUser(userId) {
    // Implementation for editing user
    Utils.showInfo("Chức năng sửa người dùng đang được phát triển");
  }

  static deleteUser(userId) {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      // Implementation for deleting user
      Utils.showInfo("Chức năng xóa người dùng đang được phát triển");
    }
  }
}

// Admin Reviews Management
class AdminReviews {
  constructor() {
    this.reviews = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.selectedReviewId = null;

    this.init();
  }

  async init() {
    await this.loadReviews();
    this.bindEvents();
  }

  async loadReviews() {
    try {
      // Mock data - replace with actual API call
      this.reviews = [
        {
          maDanhGia: 1,
          hoTenNguoiDung: "Nguyễn Văn A",
          tenKhachSan: "Hotel ABC",
          diemDanhGia: 5,
          binhLuan: "Khách sạn rất tuyệt vời, phòng sạch sẽ, nhân viên thân thiện.",
          ngayTao: "2024-12-20T15:30:00",
          trangThai: "Approved",
        },
        {
          maDanhGia: 2,
          hoTenNguoiDung: "Trần Thị B",
          tenKhachSan: "Hotel XYZ",
          diemDanhGia: 4,
          binhLuan: "Phòng đẹp nhưng wifi hơi chậm.",
          ngayTao: "2024-12-19T10:15:00",
          trangThai: "Pending",
        },
        {
          maDanhGia: 3,
          hoTenNguoiDung: "Lê Văn C",
          tenKhachSan: "Hotel ABC",
          diemDanhGia: 2,
          binhLuan: "Dịch vụ kém, phòng không sạch.",
          ngayTao: "2024-12-18T20:45:00",
          trangThai: "Rejected",
        },
      ];

      this.renderReviewsTable();
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  renderReviewsTable() {
    const tbody = Utils.$("#reviews-table-body");
    if (!tbody) return;

    if (this.reviews.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Chưa có đánh giá nào
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = this.reviews
      .map(
        (review) => `
            <tr>
                <td>#${review.maDanhGia}</td>
                <td>
                    <div>
                        <strong>${review.hoTenNguoiDung}</strong>
                        <br>
                        <small class="text-secondary">${review.tenKhachSan}</small>
                    </div>
                </td>
                <td>
                    <div class="rating">
                        ${this.createStarRating(review.diemDanhGia)}
                        <span>${review.diemDanhGia}/5</span>
                    </div>
                </td>
                <td>
                    <div class="review-comment-preview">
                        ${review.binhLuan.length > 50 ? review.binhLuan.substring(0, 50) + "..." : review.binhLuan}
                    </div>
                </td>
                <td>${Utils.formatDate(review.ngayTao)}</td>
                <td>
                    <span class="status-badge ${review.trangThai.toLowerCase()}">
                        ${this.getReviewStatusText(review.trangThai)}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminReviews.viewReview(${review.maDanhGia})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${
                      review.trangThai === "Pending"
                        ? `
                        <button class="btn btn-sm btn-success" onclick="AdminReviews.approveReview(${review.maDanhGia})" title="Duyệt">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-error" onclick="AdminReviews.rejectReview(${review.maDanhGia})" title="Từ chối">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-sm btn-error" onclick="AdminReviews.deleteReview(${review.maDanhGia})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  createStarRating(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
      } else {
        stars += '<i class="fas fa-star" style="color: #e5e7eb;"></i>';
      }
    }
    return stars;
  }

  getReviewStatusText(status) {
    const statusMap = {
      Pending: "Chờ duyệt",
      Approved: "Đã duyệt",
      Rejected: "Từ chối",
    };
    return statusMap[status] || status;
  }

  bindEvents() {
    // Filter by status
    const statusFilter = Utils.$("#review-status-filter");
    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        this.filterReviews();
      });
    }

    // Search functionality
    const searchInput = Utils.$("#search-reviews");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          this.searchReviews(e.target.value);
        }, 300)
      );
    }
  }

  filterReviews() {
    const status = Utils.$("#review-status-filter").value;

    if (!status) {
      this.renderReviewsTable();
      return;
    }

    const filteredReviews = this.reviews.filter((review) => review.trangThai === status);
    this.renderFilteredReviewsTable(filteredReviews);
  }

  searchReviews(searchTerm) {
    if (!searchTerm.trim()) {
      this.renderReviewsTable();
      return;
    }

    const filteredReviews = this.reviews.filter(
      (review) =>
        review.hoTenNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.tenKhachSan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.binhLuan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.renderFilteredReviewsTable(filteredReviews);
  }

  renderFilteredReviewsTable(reviews) {
    const tbody = Utils.$("#reviews-table-body");
    if (!tbody) return;

    if (reviews.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        Không tìm thấy đánh giá nào phù hợp
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = reviews
      .map(
        (review) => `
            <tr>
                <td>#${review.maDanhGia}</td>
                <td>
                    <div>
                        <strong>${review.hoTenNguoiDung}</strong>
                        <br>
                        <small class="text-secondary">${review.tenKhachSan}</small>
                    </div>
                </td>
                <td>
                    <div class="rating">
                        ${this.createStarRating(review.diemDanhGia)}
                        <span>${review.diemDanhGia}/5</span>
                    </div>
                </td>
                <td>
                    <div class="review-comment-preview">
                        ${review.binhLuan.length > 50 ? review.binhLuan.substring(0, 50) + "..." : review.binhLuan}
                    </div>
                </td>
                <td>${Utils.formatDate(review.ngayTao)}</td>
                <td>
                    <span class="status-badge ${review.trangThai.toLowerCase()}">
                        ${this.getReviewStatusText(review.trangThai)}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline" onclick="AdminReviews.viewReview(${review.maDanhGia})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${
                      review.trangThai === "Pending"
                        ? `
                        <button class="btn btn-sm btn-success" onclick="AdminReviews.approveReview(${review.maDanhGia})" title="Duyệt">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-error" onclick="AdminReviews.rejectReview(${review.maDanhGia})" title="Từ chối">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-sm btn-error" onclick="AdminReviews.deleteReview(${review.maDanhGia})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  static viewReview(reviewId) {
    const review = window.adminReviews.reviews.find((r) => r.maDanhGia === reviewId);
    if (!review) {
      Utils.showError("Không tìm thấy đánh giá");
      return;
    }

    // Show review detail modal
    Utils.showInfo(`Đánh giá từ ${review.hoTenNguoiDung}: "${review.binhLuan}"`);
  }

  static async approveReview(reviewId) {
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const review = window.adminReviews.reviews.find((r) => r.maDanhGia === reviewId);
      if (review) {
        review.trangThai = "Approved";
        window.adminReviews.renderReviewsTable();
        Utils.showSuccess("Đã duyệt đánh giá");
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  static async rejectReview(reviewId) {
    if (!confirm("Bạn có chắc chắn muốn từ chối đánh giá này?")) {
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const review = window.adminReviews.reviews.find((r) => r.maDanhGia === reviewId);
      if (review) {
        review.trangThai = "Rejected";
        window.adminReviews.renderReviewsTable();
        Utils.showSuccess("Đã từ chối đánh giá");
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  static async deleteReview(reviewId) {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const index = window.adminReviews.reviews.findIndex((r) => r.maDanhGia === reviewId);
      if (index !== -1) {
        window.adminReviews.reviews.splice(index, 1);
        window.adminReviews.renderReviewsTable();
        Utils.showSuccess("Đã xóa đánh giá");
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }
}

// Admin File Upload Helper
class AdminFileUpload {
  static setupImageUpload(inputId, previewId, options = {}) {
    const input = Utils.$(inputId);
    const preview = Utils.$(previewId);

    if (!input || !preview) return;

    const maxFiles = options.maxFiles || 5;
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
    const allowedTypes = options.allowedTypes || ["image/jpeg", "image/png", "image/gif"];

    input.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);

      // Validate files
      const validFiles = files.filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          Utils.showError(`File ${file.name} không đúng định dạng`);
          return false;
        }

        if (file.size > maxSize) {
          Utils.showError(`File ${file.name} quá lớn (tối đa ${maxSize / 1024 / 1024}MB)`);
          return false;
        }

        return true;
      });

      if (validFiles.length > maxFiles) {
        Utils.showError(`Chỉ được chọn tối đa ${maxFiles} file`);
        return;
      }

      // Preview files
      preview.innerHTML = "";
      validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageItem = Utils.createElement("div", "image-item");
          imageItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="image-delete" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
          preview.appendChild(imageItem);
        };
        reader.readAsDataURL(file);
      });
    });

    // Setup drag and drop
    const uploadArea = input.closest(".file-upload");
    if (uploadArea) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        uploadArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        uploadArea.addEventListener(eventName, () => {
          uploadArea.classList.add("dragover");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        uploadArea.addEventListener(eventName, () => {
          uploadArea.classList.remove("dragover");
        });
      });

      uploadArea.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        input.files = files;
        input.dispatchEvent(new Event("change"));
      });
    }
  }
}

// Admin Table Helper
class AdminTable {
  static addSortingToTable(tableId) {
    const table = Utils.$(tableId);
    if (!table) return;

    const headers = table.querySelectorAll("th");
    headers.forEach((header, index) => {
      if (header.classList.contains("no-sort")) return;

      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        this.sortTable(table, index);
      });
    });
  }

  static sortTable(table, columnIndex) {
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isAscending = table.getAttribute("data-sort-direction") !== "asc";
    table.setAttribute("data-sort-direction", isAscending ? "asc" : "desc");

    rows.sort((a, b) => {
      const aValue = a.cells[columnIndex]?.textContent.trim() || "";
      const bValue = b.cells[columnIndex]?.textContent.trim() || "";

      const aNum = parseFloat(aValue.replace(/[^\d.-]/g, ""));
      const bNum = parseFloat(bValue.replace(/[^\d.-]/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return isAscending ? aNum - bNum : bNum - aNum;
      } else {
        return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
    });

    // Clear tbody and append sorted rows
    tbody.innerHTML = "";
    rows.forEach((row) => tbody.appendChild(row));

    // Update header indicators
    const headers = table.querySelectorAll("th");
    headers.forEach((header) => {
      header.classList.remove("sort-asc", "sort-desc");
    });
    headers[columnIndex].classList.add(isAscending ? "sort-asc" : "sort-desc");
  }

  static addBulkActions(tableId, actions) {
    const table = Utils.$(tableId);
    if (!table) return;

    // Add select all checkbox to header
    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      const selectAllCell = document.createElement("th");
      selectAllCell.innerHTML = '<input type="checkbox" id="select-all">';
      headerRow.insertBefore(selectAllCell, headerRow.firstChild);
    }

    // Add checkboxes to each row
    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((row) => {
      const selectCell = document.createElement("td");
      selectCell.innerHTML = '<input type="checkbox" class="row-select">';
      row.insertBefore(selectCell, row.firstChild);
    });

    // Handle select all
    const selectAllCheckbox = Utils.$("#select-all");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (e) => {
        const rowCheckboxes = table.querySelectorAll(".row-select");
        rowCheckboxes.forEach((checkbox) => {
          checkbox.checked = e.target.checked;
        });
        this.updateBulkActionButtons(actions);
      });
    }

    // Handle individual row selection
    table.addEventListener("change", (e) => {
      if (e.target.classList.contains("row-select")) {
        this.updateBulkActionButtons(actions);
      }
    });

    // Add bulk action buttons
    this.createBulkActionButtons(table, actions);
  }

  static updateBulkActionButtons(actions) {
    const selectedRows = document.querySelectorAll(".row-select:checked");
    const bulkActions = Utils.$("#bulk-actions");

    if (bulkActions) {
      if (selectedRows.length > 0) {
        bulkActions.style.display = "block";
        Utils.$("#selected-count").textContent = selectedRows.length;
      } else {
        bulkActions.style.display = "none";
      }
    }
  }

  static createBulkActionButtons(table, actions) {
    const container = table.closest(".admin-table-container");
    if (!container) return;

    const bulkActionsDiv = Utils.createElement("div", "bulk-actions");
    bulkActionsDiv.id = "bulk-actions";
    bulkActionsDiv.style.display = "none";

    bulkActionsDiv.innerHTML = `
            <div class="bulk-actions-content">
                <span>Đã chọn <span id="selected-count">0</span> mục</span>
                <div class="bulk-action-buttons">
                    ${actions
                      .map(
                        (action) => `
                        <button class="btn btn-sm btn-${action.type}" onclick="${action.handler}">
                            <i class="fas fa-${action.icon}"></i>
                            ${action.label}
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    container.insertBefore(bulkActionsDiv, table);
  }
}

// Export classes for global use
window.AdminDashboard = AdminDashboard;
window.AdminService = AdminService;
window.AdminUsers = AdminUsers;
window.AdminReviews = AdminReviews;
window.AdminFileUpload = AdminFileUpload;
window.AdminTable = AdminTable;
