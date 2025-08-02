// Main Application
class App {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    return page.replace(".html", "");
  }

  init() {
    // Initialize auth UI
    AuthUI.init();

    // Set default date values
    this.setDefaultDates();

    // Initialize page-specific functionality
    this.initPageSpecific();

    // Initialize global event listeners
    this.initGlobalEvents();
  }

  setDefaultDates() {
    const checkInInput = Utils.$("#check-in");
    const checkOutInput = Utils.$("#check-out");

    if (checkInInput && !checkInInput.value) {
      checkInInput.value = Utils.getTodayString();
      checkInInput.min = Utils.getTodayString();
    }

    if (checkOutInput && !checkOutInput.value) {
      checkOutInput.value = Utils.getTomorrowString();
      checkOutInput.min = Utils.getTomorrowString();
    }

    // Update checkout min date when checkin changes
    if (checkInInput && checkOutInput) {
      checkInInput.addEventListener("change", () => {
        const checkInDate = new Date(checkInInput.value);
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);

        checkOutInput.min = nextDay.toISOString().split("T")[0];

        if (checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = nextDay.toISOString().split("T")[0];
        }
      });
    }
  }

  initPageSpecific() {
    switch (this.currentPage) {
      case "index":
        this.initHomePage();
        break;
      case "login":
        this.initLoginPage();
        break;
      case "register":
        this.initRegisterPage();
        break;
      case "hotel-detail":
        this.initHotelDetailPage();
        break;
      case "booking":
        this.initBookingPage();
        break;
      case "profile":
        this.initProfilePage();
        break;
      case "booking-history":
        this.initBookingHistoryPage();
        break;
      default:
        // Admin pages
        if (this.currentPage.startsWith("admin/")) {
          this.initAdminPage();
        }
        break;
    }
  }

  initHomePage() {
    // Initialize hotel list
    const hotelUI = new HotelUI("#hotels");

    // Smooth scrolling for navigation links
    const navLinks = Utils.$$('a[href^="#"]');
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetElement = Utils.$(`#${targetId}`);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  initLoginPage() {
    // Check if already logged in
    if (AuthService.isLoggedIn()) {
      const returnUrl = Utils.getUrlParams().returnUrl || "index.html";
      Utils.redirect(returnUrl);
      return;
    }

    // Initialize login form
    new LoginForm("#login-form");
  }

  initRegisterPage() {
    // Check if already logged in
    if (AuthService.isLoggedIn()) {
      Utils.redirect("index.html");
      return;
    }

    // Initialize register form
    new RegisterForm("#register-form");
  }

  initHotelDetailPage() {
    // Initialize hotel detail
    new HotelDetailUI();
  }

  initBookingPage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize booking
    new BookingUI();
  }

  initProfilePage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize profile
    new ProfileUI();
  }

  initBookingHistoryPage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize booking history
    new BookingHistoryUI();
  }

  initAdminPage() {
    // Require admin authentication
    if (!Utils.requireAdmin()) return;

    // Initialize admin functionality based on specific page
    const adminPage = this.currentPage.split("/")[1];
    switch (adminPage) {
      case "dashboard":
        new AdminDashboard();
        break;
      case "hotels":
        new AdminHotels();
        break;
      case "rooms":
        new AdminRooms();
        break;
      case "bookings":
        new AdminBookings();
        break;
      case "users":
        new AdminUsers();
        break;
      case "reviews":
        new AdminReviews();
        break;
    }
  }

  initGlobalEvents() {
    // Handle window resize
    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        this.handleResize();
      }, 250)
    );

    // Handle scroll
    window.addEventListener(
      "scroll",
      Utils.debounce(() => {
        this.handleScroll();
      }, 10)
    );

    // Handle online/offline status
    window.addEventListener("online", () => {
      Utils.showSuccess("Kết nối internet đã được khôi phục");
    });

    window.addEventListener("offline", () => {
      Utils.showWarning("Mất kết nối internet");
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle clicks outside modals to close them
    document.addEventListener("click", (e) => {
      this.handleModalClicks(e);
    });
  }

  handleResize() {
    // Update mobile navigation if needed
    const navMenu = Utils.$("#nav-menu");
    if (window.innerWidth > 768 && navMenu) {
      navMenu.classList.remove("active");
    }
  }

  handleScroll() {
    // Add shadow to header when scrolling
    const header = Utils.$(".header");
    if (header) {
      if (window.scrollY > 0) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }

    // Show/hide back to top button
    const backToTop = Utils.$("#back-to-top");
    if (backToTop) {
      if (window.scrollY > 300) {
        Utils.show(backToTop);
      } else {
        Utils.hide(backToTop);
      }
    }
  }

  handleKeyboardShortcuts(e) {
    // ESC key to close modals
    if (e.key === "Escape") {
      const activeModal = Utils.$(".modal.active");
      if (activeModal) {
        Utils.hideModal(`#${activeModal.id}`);
      }
    }

    // Ctrl+/ for search shortcut
    if (e.ctrlKey && e.key === "/") {
      e.preventDefault();
      const searchInput = Utils.$("#search-destination");
      if (searchInput) {
        searchInput.focus();
      }
    }
  }

  handleModalClicks(e) {
    // Close modal when clicking outside
    if (e.target.classList.contains("modal")) {
      Utils.hideModal(`#${e.target.id}`);
    }
  }
}

// Review Service (needed for hotel detail page)
class ReviewService {
  static async getReviewsByHotel(hotelId) {
    try {
      const response = await Utils.get(`/reviews/hotel/${hotelId}`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get reviews error:", error);
      return [];
    }
  }

  static async createReview(reviewData) {
    try {
      const response = await Utils.post("/reviews", reviewData);
      return response;
    } catch (error) {
      console.error("Create review error:", error);
      throw error;
    }
  }

  static async updateReview(id, reviewData) {
    try {
      const response = await Utils.put(`/reviews/${id}`, reviewData);
      return response;
    } catch (error) {
      console.error("Update review error:", error);
      throw error;
    }
  }

  static async deleteReview(id) {
    try {
      const response = await Utils.delete(`/reviews/${id}`);
      return response;
    } catch (error) {
      console.error("Delete review error:", error);
      throw error;
    }
  }
}

// Profile UI (placeholder for profile page)
class ProfileUI {
  constructor() {
    this.user = AuthService.getCurrentUser();
    this.init();
  }

  init() {
    this.renderProfile();
    this.bindEvents();
  }

  renderProfile() {
    const container = Utils.$("#profile-content");
    if (!container) return;

    container.innerHTML = `
            <div class="profile-header">
                <h1>Thông tin cá nhân</h1>
            </div>
            <form id="profile-form" class="profile-form">
                <div class="form-group">
                    <label for="fullName">Họ tên:</label>
                    <input type="text" id="fullName" name="fullName" value="${this.user.hoTen}" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" value="${this.user.email}" readonly>
                </div>
                <div class="form-group">
                    <label for="phone">Số điện thoại:</label>
                    <input type="tel" id="phone" name="phone" value="${this.user.soDienThoai || ""}">
                </div>
                <button type="submit" class="btn-primary">Cập nhật thông tin</button>
            </form>
        `;
  }

  bindEvents() {
    const form = Utils.$("#profile-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  async handleSubmit() {
    // Implementation for updating profile
    Utils.showInfo("Chức năng cập nhật thông tin đang được phát triển");
  }
}

// Booking History UI (placeholder)
class BookingHistoryUI {
  constructor() {
    this.init();
  }

  init() {
    this.loadBookingHistory();
  }

  async loadBookingHistory() {
    const container = Utils.$("#booking-history-content");
    if (!container) return;

    container.innerHTML = `
            <div class="booking-history-header">
                <h1>Lịch sử đặt phòng</h1>
            </div>
            <div class="booking-history-list">
                <p>Chức năng lịch sử đặt phòng đang được phát triển...</p>
            </div>
        `;
  }
}

// Booking UI (placeholder)
class BookingUI {
  constructor() {
    this.init();
  }

  init() {
    const container = Utils.$("#booking-content");
    if (!container) return;

    container.innerHTML = `
            <div class="booking-header">
                <h1>Đặt phòng</h1>
            </div>
            <div class="booking-form">
                <p>Chức năng đặt phòng đang được phát triển...</p>
            </div>
        `;
  }
}

// Admin classes (placeholders)
class AdminDashboard {
  constructor() {
    Utils.showInfo("Admin Dashboard đang được phát triển");
  }
}

class AdminHotels {
  constructor() {
    Utils.showInfo("Quản lý khách sạn đang được phát triển");
  }
}

class AdminRooms {
  constructor() {
    Utils.showInfo("Quản lý phòng đang được phát triển");
  }
}

class AdminBookings {
  constructor() {
    Utils.showInfo("Quản lý đặt phòng đang được phát triển");
  }
}

class AdminUsers {
  constructor() {
    Utils.showInfo("Quản lý người dùng đang được phát triển");
  }
}

class AdminReviews {
  constructor() {
    Utils.showInfo("Quản lý đánh giá đang được phát triển");
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check for stored authentication
  if (Utils.isLoggedIn()) {
    const user = Utils.getUser();
    const token = Utils.getToken();

    // Validate token (basic check)
    if (!user || !token) {
      Utils.logout();
    }
  }

  // Initialize the application
  window.app = new App();
});

// Export classes for global use
window.ReviewService = ReviewService;
window.ProfileUI = ProfileUI;
window.BookingHistoryUI = BookingHistoryUI;
window.BookingUI = BookingUI;
