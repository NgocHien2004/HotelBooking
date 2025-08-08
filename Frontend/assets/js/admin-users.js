let allUsers = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", function () {
  checkAdminAccess();
  loadUsers();
});

async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    const data = await response.json();
    allUsers = data.success && data.data ? data.data : data;
    displayUsers();
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Có lỗi xảy ra khi tải danh sách người dùng!", "danger");
  }
}

function displayUsers() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const roleFilter = document.getElementById("roleFilter").value;

  let filteredUsers = allUsers.filter((user) => {
    const matchSearch =
      (user.hoTen || "").toLowerCase().includes(searchTerm) ||
      (user.email || "").toLowerCase().includes(searchTerm) ||
      (user.soDienThoai || "").toLowerCase().includes(searchTerm);
    const matchRole = !roleFilter || user.vaiTro === roleFilter;

    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";

  if (usersToDisplay.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Không tìm thấy người dùng nào</td>
            </tr>
        `;
    return;
  }

  usersToDisplay.forEach((user) => {
    const createdDate = new Date(user.ngayTao).toLocaleDateString("vi-VN");
    tbody.innerHTML += `
            <tr>
                <td>${user.maNguoiDung}</td>
                <td>${user.hoTen}</td>
                <td>${user.email}</td>
                <td>${user.soDienThoai || "N/A"}</td>
                <td>
                    <span class="badge bg-${user.vaiTro === "Admin" ? "danger" : "primary"}">
                        ${user.vaiTro}
                    </span>
                </td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser(${user.maNguoiDung})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.maNguoiDung})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
    }
  }

  pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
}

function changePage(page) {
  currentPage = page;
  displayUsers();
}

async function addUser() {
  const userData = {
    hoTen: document.getElementById("addFullName").value,
    email: document.getElementById("addEmail").value,
    matKhau: document.getElementById("addPassword").value,
    soDienThoai: document.getElementById("addPhone").value,
    vaiTro: document.getElementById("addRole").value,
  };

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert("Thêm người dùng thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
      document.getElementById("addUserForm").reset();
      loadUsers();
    } else {
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error adding user:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

async function editUser(userId) {
  const user = allUsers.find((u) => u.maNguoiDung === userId);
  if (!user) return;

  document.getElementById("editUserId").value = user.maNguoiDung;
  document.getElementById("editFullName").value = user.hoTen;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editPhone").value = user.soDienThoai || "";
  document.getElementById("editRole").value = user.vaiTro;
  document.getElementById("editPassword").value = "";

  const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
  modal.show();
}
async function updateUser() {
  const userId = document.getElementById("editUserId").value;
  const userData = {
    hoTen: document.getElementById("editFullName").value,
    email: document.getElementById("editEmail").value,
    soDienThoai: document.getElementById("editPhone").value,
    vaiTro: document.getElementById("editRole").value,
  };

  const password = document.getElementById("editPassword").value;
  if (password) {
    userData.matKhau = password;
  }

  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      showAlert("Cập nhật người dùng thành công!", "success");
      bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
      loadUsers();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error updating user:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

async function deleteUser(userId) {
  if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      showAlert("Xóa người dùng thành công!", "success");
      loadUsers();
    } else {
      const data = await response.json();
      showAlert(data.message || "Có lỗi xảy ra!", "danger");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showAlert("Có lỗi xảy ra. Vui lòng thử lại!", "danger");
  }
}

document.getElementById("searchInput").addEventListener("input", () => {
  currentPage = 1;
  displayUsers();
});

document.getElementById("roleFilter").addEventListener("change", () => {
  currentPage = 1;
  displayUsers();
});
