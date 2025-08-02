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
    Utils.logout();
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
      Utils.hide(navAuth);
      Utils.show(navUser);

      // Update user name
      if (userName) {
        userName.textContent = user.hoTen || user.email;
      }

      // Show/hide admin menu
      if (adminMenu) {
        if (AuthService.isAdmin()) {
          Utils.show(adminMenu);
        } else {
          Utils.hide(adminMenu);
        }
      }
    } else {
      // Show auth buttons, hide user menu
      Utils.show(navAuth);
      Utils.hide(navUser);
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
      Utils.showSuccess("Đăng xuất thành công");
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
    this.setupValidation();
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  setupValidation() {
    // Email validation
    this.emailField?.addEventListener("blur", () => {
      this.validateEmail();
    });

    // Password validation
    this.passwordField?.addEventListener("blur", () => {
      this.validatePassword();
    });

    // Clear errors on input
    this.emailField?.addEventListener("input", () => {
      Utils.clearFieldError("email");
    });

    this.passwordField?.addEventListener("input", () => {
      Utils.clearFieldError("password");
    });
  }

  validateEmail() {
    const email = this.emailField?.value?.trim();

    if (!email) {
      Utils.showFieldError("email", "Vui lòng nhập email");
      return false;
    }

    if (!Utils.validateEmail(email)) {
      Utils.showFieldError("email", "Email không hợp lệ");
      return false;
    }

    Utils.clearFieldError("email");
    return true;
  }

  validatePassword() {
    const password = this.passwordField?.value;

    if (!password) {
      Utils.showFieldError("password", "Vui lòng nhập mật khẩu");
      return false;
    }

    Utils.clearFieldError("password");
    return true;
  }

  validate() {
    const emailValid = this.validateEmail();
    const passwordValid = this.validatePassword();

    return emailValid && passwordValid;
  }

  async handleSubmit() {
    if (!this.validate()) return;

    const email = this.emailField.value.trim();
    const password = this.passwordField.value;

    // Disable submit button
    this.submitButton.disabled = true;
    this.submitButton.textContent = "Đang đăng nhập...";

    try {
      const result = await AuthService.login(email, password);

      if (result.success) {
        Utils.showSuccess("Đăng nhập thành công!");

        // Redirect based on user role
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
      this.submitButton.textContent = "Đăng nhập";
    }
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
    [this.fullNameField, this.emailField, this.phoneField, this.passwordField, this.confirmPasswordField].forEach((field) => {
      if (field) {
        field.addEventListener("input", () => {
          Utils.clearFieldError(field.name);
        });
      }
    });
  }

  validateFullName() {
    const fullName = this.fullNameField?.value?.trim();

    if (!fullName) {
      Utils.showFieldError("fullName", "Vui lòng nhập họ tên");
      return false;
    }

    if (fullName.length < 2) {
      Utils.showFieldError("fullName", "Họ tên phải có ít nhất 2 ký tự");
      return false;
    }

    Utils.clearFieldError("fullName");
    return true;
  }

  validateEmail() {
    const email = this.emailField?.value?.trim();

    if (!email) {
      Utils.showFieldError("email", "Vui lòng nhập email");
      return false;
    }

    if (!Utils.validateEmail(email)) {
      Utils.showFieldError("email", "Email không hợp lệ");
      return false;
    }

    Utils.clearFieldError("email");
    return true;
  }

  validatePhone() {
    const phone = this.phoneField?.value?.trim();

    if (phone && !Utils.validatePhone(phone)) {
      Utils.showFieldError("phone", "Số điện thoại không hợp lệ");
      return false;
    }

    Utils.clearFieldError("phone");
    return true;
  }

  validatePassword() {
    const password = this.passwordField?.value;

    if (!password) {
      Utils.showFieldError("password", "Vui lòng nhập mật khẩu");
      return false;
    }

    if (!Utils.validatePassword(password)) {
      Utils.showFieldError("password", "Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    Utils.clearFieldError("password");
    return true;
  }

  validateConfirmPassword() {
    const password = this.passwordField?.value;
    const confirmPassword = this.confirmPasswordField?.value;

    if (!confirmPassword) {
      Utils.showFieldError("confirmPassword", "Vui lòng xác nhận mật khẩu");
      return false;
    }

    if (password !== confirmPassword) {
      Utils.showFieldError("confirmPassword", "Mật khẩu xác nhận không khớp");
      return false;
    }

    Utils.clearFieldError("confirmPassword");
    return true;
  }

  validate() {
    const fullNameValid = this.validateFullName();
    const emailValid = this.validateEmail();
    const phoneValid = this.validatePhone();
    const passwordValid = this.validatePassword();
    const confirmPasswordValid = this.validateConfirmPassword();

    return fullNameValid && emailValid && phoneValid && passwordValid && confirmPasswordValid;
  }

  async handleSubmit() {
    if (!this.validate()) return;

    const formData = Utils.getFormData(this.form);

    // Check if email already exists
    const emailExists = await AuthService.checkEmailExists(formData.email);
    if (emailExists) {
      Utils.showFieldError("email", "Email này đã được sử dụng");
      return;
    }

    // Disable submit button
    this.submitButton.disabled = true;
    this.submitButton.textContent = "Đang đăng ký...";

    try {
      const result = await AuthService.register(formData);

      if (result.success) {
        Utils.showSuccess("Đăng ký thành công!");

        setTimeout(() => {
          if (AuthService.isAdmin()) {
            Utils.redirect("admin/dashboard.html");
          } else {
            Utils.redirect("index.html");
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
      this.submitButton.textContent = "Đăng ký";
    }
  }
}

// Export for global use
window.AuthService = AuthService;
window.AuthUI = AuthUI;
window.LoginForm = LoginForm;
window.RegisterForm = RegisterForm;
