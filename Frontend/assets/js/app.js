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
    // Initialize hotel list if HotelUI class exists
    if (typeof HotelUI !== "undefined") {
      const hotelUI = new HotelUI("#hotels");
    }

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
    // ✅ XÓA PHẦN KIỂM TRA REDIRECT - Để user có thể vào trang login
    // if (AuthService.isLoggedIn()) {
    //   const returnUrl = Utils.getUrlParams().returnUrl || "index.html";
    //   Utils.redirect(returnUrl);
    //   return;
    // }

    // Initialize login form
    if (typeof LoginForm !== "undefined") {
      new LoginForm("#login-form");
    }
  }

  initRegisterPage() {
    // ✅ XÓA PHẦN KIỂM TRA REDIRECT - Để user có thể vào trang register
    // if (AuthService.isLoggedIn()) {
    //   Utils.redirect("index.html");
    //   return;
    // }

    // Initialize register form
    if (typeof RegisterForm !== "undefined") {
      new RegisterForm("#register-form");
    }
  }

  initHotelDetailPage() {
    // Initialize hotel detail
    if (typeof HotelDetailUI !== "undefined") {
      new HotelDetailUI();
    }
  }

  initBookingPage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize booking
    if (typeof BookingUI !== "undefined") {
      new BookingUI();
    } else {
      this.renderBookingPlaceholder();
    }
  }

  initProfilePage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize profile
    if (typeof ProfileUI !== "undefined") {
      new ProfileUI();
    }
  }

  initBookingHistoryPage() {
    // Require authentication
    if (!Utils.requireAuth()) return;

    // Initialize booking history
    if (typeof BookingHistoryUI !== "undefined") {
      new BookingHistoryUI();
    }
  }

  initAdminPage() {
    // Require admin authentication
    if (!Utils.requireAdmin()) return;

    // Initialize admin functionality based on specific page
    const adminPage = this.currentPage.split("/")[1];
    switch (adminPage) {
      case "dashboard":
        if (typeof AdminDashboard !== "undefined") {
          new AdminDashboard();
        }
        break;
      case "hotels":
        if (typeof AdminHotels !== "undefined") {
          new AdminHotels();
        }
        break;
      case "rooms":
        if (typeof AdminRooms !== "undefined") {
          new AdminRooms();
        }
        break;
      case "bookings":
        if (typeof AdminBookings !== "undefined") {
          new AdminBookings();
        }
        break;
      case "users":
        if (typeof AdminUsers !== "undefined") {
          new AdminUsers();
        }
        break;
      case "reviews":
        if (typeof AdminReviews !== "undefined") {
          new AdminReviews();
        }
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
  }

  handleResize() {
    // Handle responsive behavior
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle("mobile", isMobile);
  }

  handleScroll() {
    // Handle scroll effects
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = Utils.$(".header");

    if (header) {
      header.classList.toggle("scrolled", scrollTop > 100);
    }
  }

  handleKeyboardShortcuts(e) {
    // Global keyboard shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case "/":
          e.preventDefault();
          const searchInput = Utils.$("#search-input");
          if (searchInput) {
            searchInput.focus();
          }
          break;
      }
    }

    // Escape key to close modals/dropdowns
    if (e.key === "Escape") {
      const dropdowns = Utils.$$(".dropdown-menu.show");
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("show");
      });
    }
  }

  // Placeholder methods for missing components
  renderHotelListPlaceholder() {
    const container = Utils.$("#hotels");
    if (!container) return;

    container.innerHTML = `
      <div class="hotel-placeholder">
        <h2>Danh sách khách sạn</h2>
        <p>Chức năng đang được phát triển...</p>
      </div>
    `;
  }

  renderBookingPlaceholder() {
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
window.App = App;
