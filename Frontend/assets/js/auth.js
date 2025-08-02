// Authentication service
class AuthService {
  static async login(email, password) {
    try {
      const response = await Utils.post("/auth/login", {
        email,
        matKhau: password,
      });

      if (response.success) {
        const { token, user } = response.data;
        Utils.setToken(token);
        Utils.setUser(user);

        // Update UI immediately after login
        AuthUI.updateNavigation();

        return { success: true, user };
      } else {
        return { success: false, message: response.message || "Đăng nhập thất bại" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Lỗi kết nối server" };
    }
  }

  static async register(userData) {
    try {
      const response = await Utils.post("/auth/register", {
        hoTen: userData.fullName,
        email: userData.email,
        matKhau: userData.password,
        soDienThoai: userData.phone,
      });

      if (response.success) {
        const { token, user } = response.data;
        Utils.setToken(token);
        Utils.setUser(user);

        // Update UI immediately after register
        AuthUI.updateNavigation();

        return { success: true, user };
      } else {
        return { success: false, message: response.message || "Đăng ký thất bại" };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: error.message || "Lỗi kết nối server" };
    }
  }

  static async checkEmailExists(email) {
    try {
      const response = await Utils.get(`/auth/check-email/${encodeURIComponent(email)}`);
      return response.exists || false;
    } catch (error) {
      console.error("Check email error:", error);
      return false;
    }
  }

  static logout() {
    Utils.removeToken();
    Utils.removeUser();

    // Update UI immediately after logout
    AuthUI.updateNavigation();

    // Redirect to home page
    Utils.redirect("index.html");
  }

  static getCurrentUser() {
    return Utils.getUser();
  }

  static isLoggedIn() {
    return Utils.isLoggedIn();
  }

  static isAdmin() {
    return Utils.isAdmin();
  }
}

// Auth UI Manager
class AuthUI {
  static init() {
    this.updateNavigation();
    this.bindEvents();
  }

  static updateNavigation() {
    const navAuth = Utils.$("#nav-auth");
    const navUser = Utils.$("#nav-user");
    const userName = Utils.$("#user-name");
    const adminMenu = Utils.$("#admin-menu");

    if (AuthService.isLoggedIn()) {
      const user = AuthService.getCurrentUser();

      // Hide auth buttons, show user menu
      if (navAuth) {
        navAuth.style.display = "none";
        navAuth.classList.add("hidden");
      }

      if (navUser) {
        navUser.style.display = "flex";
        navUser.classList.remove("hidden");
      }

      // Update user name
      if (userName) {
        userName.textContent = user.hoTen || user.email;
      }

      // Show/hide admin menu
      if (adminMenu) {
        if (AuthService.isAdmin()) {
          adminMenu.style.display = "block";
          adminMenu.classList.remove("hidden");
        } else {
          adminMenu.style.display = "none";
          adminMenu.classList.add("hidden");
        }
      }
    } else {
      // Show auth buttons, hide user menu
      if (navAuth) {
        navAuth.style.display = "flex";
        navAuth.classList.remove("hidden");
      }

      if (navUser) {
        navUser.style.display = "none";
        navUser.classList.add("hidden");
      }
    }
  }

  static bindEvents() {
    // User dropdown toggle
    const userBtn = Utils.$("#user-btn");
    const dropdownMenu = Utils.$("#dropdown-menu");

    if (userBtn && dropdownMenu) {
      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        dropdownMenu.classList.remove("show");
      });
    }

    // Logout button
    const logoutBtn = Utils.$("#logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Mobile navigation toggle
    const navToggle = Utils.$("#nav-toggle");
    const navMenu = Utils.$("#nav-menu");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
      });
    }
  }

  static handleLogout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      AuthService.logout();
    }
  }
}

// Login Form Handler
class LoginForm {
  constructor(formSelector) {
    this.form = Utils.$(formSelector);
    this.emailField = this.form?.querySelector('[name="email"]');
    this.passwordField = this.form?.querySelector('[name="password"]');
    this.submitButton = this.form?.querySelector('[type="submit"]');

    this.init();
  }

  init() {
    if (!this.form) return;
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  async handleSubmit() {
    if (!this.validateForm()) return;

    const email = this.emailField.value.trim();
    const password = this.passwordField.value;

    // Disable submit button
    this.submitButton.disabled = true;
    this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

    try {
      const result = await AuthService.login(email, password);

      if (result.success) {
        Utils.showSuccess("Đăng nhập thành công!");

        // Redirect based on user role after a short delay
        setTimeout(() => {
          if (AuthService.isAdmin()) {
            Utils.redirect("admin/dashboard.html");
          } else {
            const returnUrl = Utils.getUrlParams().returnUrl || "index.html";
            Utils.redirect(returnUrl);
          }
        }, 1000);
      } else {
        Utils.showError(result.message);
      }
    } catch (error) {
      Utils.showError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      // Re-enable submit button
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
    }
  }

  validateForm() {
    const email = this.emailField.value.trim();
    const password = this.passwordField.value;

    if (!email) {
      Utils.showError("Vui lòng nhập email");
      this.emailField.focus();
      return false;
    }

    if (!Utils.validateEmail(email)) {
      Utils.showError("Email không hợp lệ");
      this.emailField.focus();
      return false;
    }

    if (!password) {
      Utils.showError("Vui lòng nhập mật khẩu");
      this.passwordField.focus();
      return false;
    }

    return true;
  }
}

// Register Form Handler
class RegisterForm {
  constructor(formSelector) {
    this.form = Utils.$(formSelector);
    this.fullNameField = this.form?.querySelector('[name="fullName"]');
    this.emailField = this.form?.querySelector('[name="email"]');
    this.phoneField = this.form?.querySelector('[name="phone"]');
    this.passwordField = this.form?.querySelector('[name="password"]');
    this.confirmPasswordField = this.form?.querySelector('[name="confirmPassword"]');
    this.submitButton = this.form?.querySelector('[type="submit"]');

    this.init();
  }

  init() {
    if (!this.form) return;

    this.bindEvents();
    this.setupValidation();
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  setupValidation() {
    // Real-time validation
    this.fullNameField?.addEventListener("blur", () => this.validateFullName());
    this.emailField?.addEventListener("blur", () => this.validateEmail());
    this.phoneField?.addEventListener("blur", () => this.validatePhone());
    this.passwordField?.addEventListener("blur", () => this.validatePassword());
    this.confirmPasswordField?.addEventListener("blur", () => this.validateConfirmPassword());

    // Clear errors on input
    [this.fullNameField, this.emailField, this.phoneField, this.passwordField, this.confirmPasswordField].filter(Boolean).forEach((field) => {
      field.addEventListener("input", () => {
        Utils.clearFieldError(field.name);
      });
    });
  }

  async handleSubmit() {
    if (!this.validateForm()) return;

    const formData = {
      fullName: this.fullNameField.value.trim(),
      email: this.emailField.value.trim(),
      phone: this.phoneField.value.trim(),
      password: this.passwordField.value,
    };

    // Disable submit button
    this.submitButton.disabled = true;
    this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';

    try {
      const result = await AuthService.register(formData);

      if (result.success) {
        Utils.showSuccess("Đăng ký thành công! Chào mừng bạn đến với Hotel Booking!");

        // Redirect to home page after a short delay
        setTimeout(() => {
          Utils.redirect("index.html");
        }, 1500);
      } else {
        Utils.showError(result.message);
      }
    } catch (error) {
      Utils.showError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      // Re-enable submit button
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = '<i class="fas fa-user-plus"></i> Đăng ký';
    }
  }

  validateForm() {
    return this.validateFullName() && this.validateEmail() && this.validatePhone() && this.validatePassword() && this.validateConfirmPassword();
  }

  validateFullName() {
    const fullName = this.fullNameField.value.trim();

    if (!fullName) {
      Utils.setFieldError("fullName", "Vui lòng nhập họ tên");
      return false;
    }

    if (fullName.length < 2) {
      Utils.setFieldError("fullName", "Họ tên phải có ít nhất 2 ký tự");
      return false;
    }

    Utils.clearFieldError("fullName");
    return true;
  }

  validateEmail() {
    const email = this.emailField.value.trim();

    if (!email) {
      Utils.setFieldError("email", "Vui lòng nhập email");
      return false;
    }

    if (!Utils.validateEmail(email)) {
      Utils.setFieldError("email", "Email không hợp lệ");
      return false;
    }

    Utils.clearFieldError("email");
    return true;
  }

  validatePhone() {
    const phone = this.phoneField.value.trim();

    if (!phone) {
      Utils.setFieldError("phone", "Vui lòng nhập số điện thoại");
      return false;
    }

    if (!Utils.validatePhone(phone)) {
      Utils.setFieldError("phone", "Số điện thoại không hợp lệ");
      return false;
    }

    Utils.clearFieldError("phone");
    return true;
  }

  validatePassword() {
    const password = this.passwordField.value;

    if (!password) {
      Utils.setFieldError("password", "Vui lòng nhập mật khẩu");
      return false;
    }

    if (password.length < 6) {
      Utils.setFieldError("password", "Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    Utils.clearFieldError("password");
    return true;
  }

  validateConfirmPassword() {
    const password = this.passwordField.value;
    const confirmPassword = this.confirmPasswordField.value;

    if (!confirmPassword) {
      Utils.setFieldError("confirmPassword", "Vui lòng xác nhận mật khẩu");
      return false;
    }

    if (password !== confirmPassword) {
      Utils.setFieldError("confirmPassword", "Mật khẩu xác nhận không khớp");
      return false;
    }

    Utils.clearFieldError("confirmPassword");
    return true;
  }
}
