function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loginMenu = document.getElementById("loginMenu");
  const userMenu = document.getElementById("userMenu");
  const adminMenu = document.getElementById("adminMenu");
  const username = document.getElementById("username");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  const bookingsMenu = document.getElementById("bookingsMenu");
  const paymentHistoryMenu = document.getElementById("paymentHistoryMenu");

  if (token && user.email) {
    if (loginMenu) loginMenu.style.display = "none";
    if (userMenu) {
      userMenu.style.display = "block";
      if (username) username.textContent = user.hoTen || user.email;
    }

    if (bookingsMenu) bookingsMenu.style.display = "block";
    if (paymentHistoryMenu) paymentHistoryMenu.style.display = "block";

    if (adminMenu && user.vaiTro === "Admin") {
      adminMenu.style.display = "block";
    } else if (adminMenu) {
      adminMenu.style.display = "none";
    }

    if (userDropdownMenu) {
      userDropdownMenu.innerHTML = `
        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Đăng xuất</a></li>
      `;
    }
  } else {
    if (loginMenu) loginMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (adminMenu) adminMenu.style.display = "none";

    if (bookingsMenu) bookingsMenu.style.display = "none";
    if (paymentHistoryMenu) paymentHistoryMenu.style.display = "none";
  }
}

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
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      showAlert("Đăng nhập thành công!", "success");

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

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  }
}

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.vaiTro || user.vaiTro !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

function isAuthenticated() {
  const token = localStorage.getItem("token");
  return token !== null;
}

document.addEventListener("DOMContentLoaded", function () {
  checkAuth();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        showAlert("Vui lòng nhập đầy đủ thông tin!", "warning");
        return;
      }

      await login(email, password);
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      if (!fullName || !email || !phone || !password || !confirmPassword) {
        showAlert("Vui lòng nhập đầy đủ thông tin!", "warning");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Mật khẩu xác nhận không khớp!", "warning");
        return;
      }

      if (password.length < 6) {
        showAlert("Mật khẩu phải có ít nhất 6 ký tự!", "warning");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert("Email không hợp lệ!", "warning");
        return;
      }

      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        showAlert("Số điện thoại phải có 10-11 chữ số!", "warning");
        return;
      }

      const userData = {
        hoTen: fullName,
        email: email,
        soDienThoai: phone,
        matKhau: password,
        vaiTro: "Customer",
      };

      await register(userData);
    });
  }
});
