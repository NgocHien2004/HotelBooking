// Auth.js - Authentication handling
// API_URL được định nghĩa trong utils.js

// Check authentication status
// Check authentication status
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loginMenu = document.getElementById("loginMenu");
  const userMenu = document.getElementById("userMenu");
  const adminMenu = document.getElementById("adminMenu");
  const username = document.getElementById("username");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  if (token && user.email) {
    // User is logged in
    if (loginMenu) loginMenu.style.display = "none";
    if (userMenu) {
      userMenu.style.display = "block";
      if (username) username.textContent = user.hoTen || user.email;
    }

    // Show admin menu ONLY for admin users
    if (adminMenu && user.vaiTro === "Admin") {
      adminMenu.style.display = "block";
    } else if (adminMenu) {
      adminMenu.style.display = "none";
    }

    // Update dropdown menu based on role
    if (userDropdownMenu && user.vaiTro === "Admin") {
      // Admin user dropdown
      userDropdownMenu.innerHTML = `
        <li><h6 class="dropdown-header">Quản lý</h6></li>
        <li><a class="dropdown-item" href="admin/hotels.html"><i class="fas fa-hotel me-2"></i> Quản lý khách sạn</a></li>
        <li><a class="dropdown-item" href="admin/users.html"><i class="fas fa-users me-2"></i> Quản lý người dùng</a></li>
        <li><a class="dropdown-item" href="admin/bookings.html"><i class="fas fa-calendar-check me-2"></i> Quản lý đặt phòng</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><h6 class="dropdown-header">Tài khoản</h6></li>
        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Thông tin cá nhân</a></li>
        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Đăng xuất</a></li>
      `;
    } else if (userDropdownMenu) {
      // Regular user dropdown
      userDropdownMenu.innerHTML = `
        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Thông tin cá nhân</a></li>
        <li><a class="dropdown-item" href="my-bookings.html"><i class="fas fa-calendar-check me-2"></i> Đặt phòng của tôi</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Đăng xuất</a></li>
      `;
    }
  } else {
    // User is not logged in
    if (loginMenu) loginMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (adminMenu) adminMenu.style.display = "none";
  }
}

// Login function
async function login(email, password) {
  try {
    console.log("Attempting login to:", `${API_URL}/auth/login`);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        matKhau: password,
      }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (response.ok && data.success) {
      // Save token and user info - Chú ý: data nằm trong data.data
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      showAlert("Đăng nhập thành công!", "success");

      // Redirect based on role - UPDATED: Admin goes to hotels instead of dashboard
      setTimeout(() => {
        if (data.data.user.vaiTro === "Admin") {
          window.location.href = "admin/hotels.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1000);
    } else {
      showAlert(data.message || "Email hoặc mật khẩu không đúng", "danger");
    }
  } catch (error) {
    console.error("Login error:", error);
    showAlert("Không thể kết nối đến server. Vui lòng kiểm tra lại!", "danger");
  }
}

// Register function
async function register(userData) {
  try {
    console.log("Attempting register to:", `${API_URL}/auth/register`);
    console.log("Register data:", userData);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    console.log("Register response:", data);

    if (response.ok && data.success) {
      showAlert("Đăng ký thành công! Vui lòng đăng nhập.", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showAlert(data.message || "Đăng ký thất bại. Vui lòng thử lại!", "danger");
    }
  } catch (error) {
    console.error("Register error:", error);
    showAlert("Không thể kết nối đến server. Vui lòng kiểm tra lại!", "danger");
  }
}

// Logout function
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  }
}

// Check admin access
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.vaiTro || user.vaiTro !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
  }
}

// Login form handler
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    await login(email, password);
  });
}

// Register form handler
if (document.getElementById("registerForm")) {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      showAlert("Mật khẩu xác nhận không khớp!", "danger");
      return;
    }

    const userData = {
      hoTen: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      matKhau: password,
      soDienThoai: document.getElementById("phone").value,
      vaiTro: "Customer",
    };

    await register(userData);
  });
}

// Initialize authentication check on page load
document.addEventListener("DOMContentLoaded", checkAuth);
