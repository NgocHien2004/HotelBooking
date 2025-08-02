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
      if (username) username.textContent = user.fullName || user.email;
    }

    // Show admin menu if user is admin
    if (adminMenu && user.role === "admin") {
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
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "admin/dashboard.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      showAlert(data.message || "Đăng nhập thất bại", "danger");
    }
  } catch (error) {
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

// Register function
async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert("Đăng ký thành công! Đang chuyển đến trang đăng nhập...", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showAlert(data.message || "Đăng ký thất bại", "danger");
    }
  } catch (error) {
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

// Check if user is admin
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user.role || user.role !== "admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "../index.html";
  }
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Handle login form submission
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

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

    const userData = {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      password: password,
    };

    await register(userData);
  });
}

// Check auth status on page load
document.addEventListener("DOMContentLoaded", function () {
  checkAuth();
});
