// D:\Temp\HotelBooking\Frontend\assets\js\utils.js

// Utility functions
const utils = {
  // Format currency VND
  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString("vi-VN");
  },

  // Format datetime
  formatDateTime(date) {
    return new Date(date).toLocaleString("vi-VN");
  },

  // Show toast notification
  showToast(message, type = "success") {
    const toastHTML = `
            <div class="toast position-fixed top-0 end-0 m-3" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">${type === "success" ? "Thành công" : "Lỗi"}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", toastHTML);
    const toast = new bootstrap.Toast(document.querySelector(".toast:last-child"));
    toast.show();

    // Remove toast after hidden
    document.querySelector(".toast:last-child").addEventListener("hidden.bs.toast", (e) => {
      e.target.remove();
    });
  },

  // Show loading
  showLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "flex";
  },

  // Hide loading
  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
  },

  // Get URL parameter
  getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  // Validate email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone
  validatePhone(phone) {
    const re = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return re.test(phone);
  },

  // Preview image
  previewImage(input, previewId) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById(previewId).src = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  },

  // Confirm delete
  confirmDelete(message = "Bạn có chắc chắn muốn xóa?") {
    return confirm(message);
  },
};
