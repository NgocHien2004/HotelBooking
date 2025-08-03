// Auth.js - Authentication handling
// API_URL được định nghĩa trong utils.js

// Check authentication status
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loginMenu = document.getElementById("loginMenu");
  const userMenu = document.getElementById("userMenu");
  const adminMenu = document.getElementById("adminMenu");
  const username = document.getElementById("username");

  if (token && user.email) {
    // User is logged in
    if (loginMenu) loginMenu.style.display = "none";
    if (userMenu) {
      userMenu.style.display = "block";
      if (username) username.textContent = user.hoTen || user.email;
    }

    // Show admin menu if user is admin
    if (adminMenu && user.vaiTro === "admin") {
      adminMenu.style.display = "block";
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

      // Redirect based on role
      setTimeout(() => {
        if (data.data.user.vaiTro === "admin") {
          window.location.href = "admin/dashboard.html";
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
      showAlert("Đăng ký thành công! Đang chuyển đến trang đăng nhập...", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showAlert(data.message || "Đăng ký thất bại", "danger");
    }
  } catch (error) {
    console.error("Register error:", error);
    showAlert("Không thể kết nối đến server. Vui lòng kiểm tra lại!", "danger");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/Frontend/index.html";
}

// Check if user is admin
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  if (!token || !user.vaiTro || user.vaiTro !== "admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
    return false;
  }
  return true;
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Show alert message
function showAlert(message, type = "danger") {
  const alertDiv = document.getElementById("alertMessage");
  if (alertDiv) {
    alertDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.innerHTML = "";
    }, 5000);
  }
}

// Handle login form submission
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAlert("Vui lòng nhập đầy đủ email và mật khẩu!", "warning");
      return;
    }

    await login(email, password);
  });
}

// Handle register form submission
if (document.getElementById("registerForm")) {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      showAlert("Mật khẩu xác nhận không khớp!", "danger");
      return;
    }

    if (password.length < 6) {
      showAlert("Mật khẩu phải có ít nhất 6 ký tự!", "warning");
      return;
    }

    const userData = {
      hoTen: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      soDienThoai: document.getElementById("phone").value.trim(),
      matKhau: password,
    };

    await register(userData);
  });
}

// Check auth status on page load
document.addEventListener("DOMContentLoaded", function () {
  checkAuth();
});
