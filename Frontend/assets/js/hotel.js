// Hotel Service
class HotelService {
  static async getAllHotels(page = 1, limit = 12) {
    try {
      const response = await Utils.get("/hotels", { page, limit });
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get hotels error:", error);
      return [];
    }
  }

  static async getHotelById(id) {
    try {
      const response = await Utils.get(`/hotels/${id}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Get hotel error:", error);
      return null;
    }
  }

  static async searchHotels(searchTerm = "", city = "") {
    try {
      const params = {};
      if (searchTerm) params.searchTerm = searchTerm;
      if (city) params.city = city;

      const response = await Utils.get("/hotels/search", params);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Search hotels error:", error);
      return [];
    }
  }

  static async getHotelImages(hotelId) {
    try {
      const response = await Utils.get(`/hotels/${hotelId}/images`);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Get hotel images error:", error);
      return [];
    }
  }

  static async getCities() {
    try {
      const hotels = await this.getAllHotels(1, 1000); // Get all hotels to extract cities
      const cities = [...new Set(hotels.map((hotel) => hotel.thanhPho).filter((city) => city))];
      return cities.sort();
    } catch (error) {
      console.error("Get cities error:", error);
      return [];
    }
  }

  // Admin methods
  static async createHotel(hotelData) {
    try {
      const response = await Utils.post("/hotels", hotelData);
      return response;
    } catch (error) {
      console.error("Create hotel error:", error);
      throw error;
    }
  }

  static async updateHotel(id, hotelData) {
    try {
      const response = await Utils.put(`/hotels/${id}`, hotelData);
      return response;
    } catch (error) {
      console.error("Update hotel error:", error);
      throw error;
    }
  }

  static async deleteHotel(id) {
    try {
      const response = await Utils.delete(`/hotels/${id}`);
      return response;
    } catch (error) {
      console.error("Delete hotel error:", error);
      throw error;
    }
  }
}

// Hotel UI Manager
class HotelUI {
  constructor(containerSelector) {
    this.container = Utils.$(containerSelector);
    this.hotelsGrid = Utils.$("#hotels-grid");
    this.loadingElement = Utils.$("#loading");
    this.noResultsElement = Utils.$("#no-results");
    this.loadMoreBtn = Utils.$("#load-more-btn");

    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    this.currentFilters = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialData();
  }

  bindEvents() {
    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener("click", () => {
        this.loadMoreHotels();
      });
    }

    // Filter events
    const cityFilter = Utils.$("#city-filter");
    const priceFilter = Utils.$("#price-filter");
    const ratingFilter = Utils.$("#rating-filter");

    [cityFilter, priceFilter, ratingFilter].forEach((filter) => {
      if (filter) {
        filter.addEventListener("change", () => {
          this.applyFilters();
        });
      }
    });

    // Search form
    const searchForm = Utils.$("#search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }
  }

  async loadInitialData() {
    await this.loadCities();
    await this.loadHotels();
  }

  async loadCities() {
    try {
      const cities = await HotelService.getCities();
      const cityFilter = Utils.$("#city-filter");

      if (cityFilter && cities.length > 0) {
        cities.forEach((city) => {
          const option = document.createElement("option");
          option.value = city;
          option.textContent = city;
          cityFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Load cities error:", error);
    }
  }

  async loadHotels(reset = true) {
    if (this.isLoading) return;

    this.isLoading = true;

    if (reset) {
      this.currentPage = 1;
      if (this.loadingElement) Utils.show(this.loadingElement);
      if (this.noResultsElement) Utils.hide(this.noResultsElement);
      if (this.loadMoreBtn) Utils.hide(this.loadMoreBtn);
    }

    try {
      const hotels = await HotelService.getAllHotels(this.currentPage);

      if (reset && this.hotelsGrid) {
        this.hotelsGrid.innerHTML = "";
      }

      if (hotels.length === 0 && reset) {
        if (this.noResultsElement) Utils.show(this.noResultsElement);
      } else {
        const filteredHotels = this.filterHotels(hotels);
        this.renderHotels(filteredHotels);

        if (hotels.length >= 12) {
          // If full page, show load more
          if (this.loadMoreBtn) Utils.show(this.loadMoreBtn);
        }
      }
    } catch (error) {
      Utils.handleApiError(error);
    } finally {
      this.isLoading = false;
      if (this.loadingElement) Utils.hide(this.loadingElement);
    }
  }

  async loadMoreHotels() {
    this.currentPage++;
    await this.loadHotels(false);
  }

  filterHotels(hotels) {
    let filtered = [...hotels];

    // City filter
    if (this.currentFilters.city) {
      filtered = filtered.filter((hotel) => hotel.thanhPho === this.currentFilters.city);
    }

    // Price filter
    if (this.currentFilters.price) {
      const [min, max] = this.currentFilters.price.split("-");
      filtered = filtered.filter((hotel) => {
        const minPrice = hotel.loaiPhongs && hotel.loaiPhongs.length > 0 ? Math.min(...hotel.loaiPhongs.map((room) => room.giaMotDem)) : 0;

        if (max === undefined) {
          // "2000000+" format
          return minPrice >= parseInt(min);
        } else {
          return minPrice >= parseInt(min) && minPrice <= parseInt(max);
        }
      });
    }

    // Rating filter
    if (this.currentFilters.rating) {
      const minRating = parseFloat(this.currentFilters.rating);
      filtered = filtered.filter((hotel) => hotel.danhGiaTrungBinh >= minRating);
    }

    return filtered;
  }

  applyFilters() {
    const cityFilter = Utils.$("#city-filter");
    const priceFilter = Utils.$("#price-filter");
    const ratingFilter = Utils.$("#rating-filter");

    this.currentFilters = {
      city: cityFilter ? cityFilter.value : "",
      price: priceFilter ? priceFilter.value : "",
      rating: ratingFilter ? ratingFilter.value : "",
    };

    this.loadHotels(true);
  }

  async handleSearch() {
    const searchDestination = Utils.$("#search-destination");
    const checkIn = Utils.$("#check-in");
    const checkOut = Utils.$("#check-out");
    const guests = Utils.$("#guests");

    const searchTerm = searchDestination ? searchDestination.value.trim() : "";
    const checkInValue = checkIn ? checkIn.value : "";
    const checkOutValue = checkOut ? checkOut.value : "";
    const guestsValue = guests ? guests.value : "";

    // Validate dates
    if (checkInValue && checkOutValue) {
      const checkInDate = new Date(checkInValue);
      const checkOutDate = new Date(checkOutValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        Utils.showError("Ngày nhận phòng không thể là ngày trong quá khứ");
        return;
      }

      if (checkOutDate <= checkInDate) {
        Utils.showError("Ngày trả phòng phải sau ngày nhận phòng");
        return;
      }
    }

    try {
      if (this.loadingElement) Utils.show(this.loadingElement);
      if (this.noResultsElement) Utils.hide(this.noResultsElement);

      let hotels;
      if (searchTerm) {
        hotels = await HotelService.searchHotels(searchTerm);
      } else {
        hotels = await HotelService.getAllHotels();
      }

      if (this.hotelsGrid) {
        this.hotelsGrid.innerHTML = "";
      }

      if (hotels.length === 0) {
        if (this.noResultsElement) Utils.show(this.noResultsElement);
      } else {
        const filteredHotels = this.filterHotels(hotels);
        this.renderHotels(filteredHotels);
      }
    } catch (error) {
      Utils.handleApiError(error);
    } finally {
      if (this.loadingElement) Utils.hide(this.loadingElement);
    }
  }

  renderHotels(hotels) {
    if (!this.hotelsGrid) return;

    hotels.forEach((hotel) => {
      const hotelCard = this.createHotelCard(hotel);
      this.hotelsGrid.appendChild(hotelCard);
    });
  }

  createHotelCard(hotel) {
    const card = Utils.createElement("div", "hotel-card");

    // Get main image
    const mainImage = hotel.hinhAnhs && hotel.hinhAnhs.length > 0 ? hotel.hinhAnhs[0].duongDanAnh : Utils.getPlaceholderImage();

    // Get price range
    const priceRange = this.getHotelPriceRange(hotel);

    card.innerHTML = `
            <div class="hotel-image">
                <img src="${mainImage}" alt="${hotel.tenKhachSan}" 
                     onerror="Utils.handleImageError(this)">
                <div class="hotel-rating">
                    <i class="fas fa-star"></i>
                    ${hotel.danhGiaTrungBinh ? hotel.danhGiaTrungBinh.toFixed(1) : "0.0"}
                </div>
            </div>
            <div class="hotel-content">
                <h3 class="hotel-name">${hotel.tenKhachSan}</h3>
                <div class="hotel-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${hotel.diaChi}${hotel.thanhPho ? ", " + hotel.thanhPho : ""}</span>
                </div>
                <p class="hotel-description">${hotel.moTa || "Khách sạn chất lượng cao với dịch vụ tuyệt vời."}</p>
                <div class="hotel-footer">
                    <div class="hotel-price">
                        ${priceRange}
                        <span class="hotel-price-unit">/đêm</span>
                    </div>
                    <button class="btn-view-hotel" onclick="HotelUI.viewHotel(${hotel.maKhachSan})">
                        Xem chi tiết
                    </button>
                </div>
            </div>
        `;

    return card;
  }

  getHotelPriceRange(hotel) {
    if (!hotel.loaiPhongs || hotel.loaiPhongs.length === 0) {
      return "Liên hệ";
    }

    const prices = hotel.loaiPhongs.map((room) => room.giaMotDem);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return Utils.formatCurrency(minPrice);
    } else {
      return `${Utils.formatCurrency(minPrice)} - ${Utils.formatCurrency(maxPrice)}`;
    }
  }

  static viewHotel(hotelId) {
    Utils.redirect(`hotel-detail.html?id=${hotelId}`);
  }
}

// Hotel Detail UI Manager
class HotelDetailUI {
  constructor() {
    this.hotelId = Utils.getUrlParams().id;
    this.hotel = null;
    this.selectedRoom = null;
    this.selectedRating = 0;

    this.init();
  }

  async init() {
    if (!this.hotelId) {
      Utils.showError("Không tìm thấy thông tin khách sạn");
      Utils.redirect("index.html");
      return;
    }

    await this.loadHotelDetail();
    this.bindEvents();
  }

  async loadHotelDetail() {
    try {
      const contentElement = Utils.$("#hotel-detail-content");
      if (contentElement) {
        Utils.showLoading(contentElement);
      }

      this.hotel = await HotelService.getHotelById(this.hotelId);

      if (!this.hotel) {
        Utils.showError("Không tìm thấy khách sạn");
        Utils.redirect("index.html");
        return;
      }

      this.renderHotelDetail();
      await this.loadHotelImages();
      await this.loadReviews();
    } catch (error) {
      Utils.handleApiError(error);
      Utils.redirect("index.html");
    }
  }

  renderHotelDetail() {
    const container = Utils.$("#hotel-detail-content");
    if (!container) return;

    container.innerHTML = `
            <div class="hotel-detail-header">
                <div class="hotel-images">
                    <div class="main-image">
                        <img id="main-hotel-image" src="${Utils.getPlaceholderImage()}" 
                             alt="${this.hotel.tenKhachSan}">
                    </div>
                    <div class="image-thumbnails" id="image-thumbnails">
                        <!-- Thumbnails will be loaded here -->
                    </div>
                </div>
                
                <div class="hotel-info">
                    <h1 class="hotel-title">${this.hotel.tenKhachSan}</h1>
                    <div class="hotel-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${this.hotel.diaChi}${this.hotel.thanhPho ? ", " + this.hotel.thanhPho : ""}</span>
                    </div>
                    <div class="hotel-rating-detail">
                        <div class="rating-stars">
                            ${this.createStarRating(this.hotel.danhGiaTrungBinh || 0)}
                        </div>
                        <span class="rating-text">${this.hotel.danhGiaTrungBinh ? this.hotel.danhGiaTrungBinh.toFixed(1) : "0.0"} (${
      this.hotel.soLuongDanhGia || 0
    } đánh giá)</span>
                    </div>
                    <p class="hotel-description">${this.hotel.moTa || "Chưa có mô tả"}</p>
                </div>
            </div>

            <div class="hotel-detail-content">
                <div class="rooms-section">
                    <h2>Các loại phòng</h2>
                    <div class="rooms-grid" id="rooms-grid">
                        ${this.renderRooms()}
                    </div>
                </div>

                <div class="reviews-section">
                    <h2>Đánh giá khách hàng</h2>
                    <div class="reviews-container" id="reviews-container">
                        <!-- Reviews will be loaded here -->
                    </div>
                    
                    ${
                      AuthService.isLoggedIn()
                        ? `
                        <div class="add-review-section">
                            <h3>Viết đánh giá</h3>
                            <form id="review-form" class="review-form">
                                <div class="rating-input">
                                    <label>Đánh giá:</label>
                                    <div class="star-rating-input" id="star-rating-input">
                                        ${this.createRatingInput()}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="review-comment">Nhận xét:</label>
                                    <textarea id="review-comment" name="comment" rows="4" 
                                              placeholder="Chia sẻ trải nghiệm của bạn..." required></textarea>
                                </div>
                                <button type="submit" class="btn-primary">Gửi đánh giá</button>
                            </form>
                        </div>
                    `
                        : `
                        <p class="login-prompt">
                            <a href="login.html?returnUrl=${encodeURIComponent(window.location.href)}">
                                Đăng nhập
                            </a> để viết đánh giá
                        </p>
                    `
                    }
                </div>
            </div>
        `;
  }

  renderRooms() {
    if (!this.hotel.loaiPhongs || this.hotel.loaiPhongs.length === 0) {
      return '<p class="no-rooms">Hiện tại không có phòng nào.</p>';
    }

    return this.hotel.loaiPhongs
      .map(
        (room) => `
            <div class="room-card">
                <div class="room-info">
                    <h3 class="room-name">${room.tenLoaiPhong}</h3>
                    <p class="room-description">${room.moTa || "Phòng thoải mái và tiện nghi"}</p>
                    <div class="room-details">
                        <span class="room-capacity">
                            <i class="fas fa-users"></i>
                            ${room.sucChua} khách
                        </span>
                        <span class="room-available">
                            <i class="fas fa-check-circle text-success"></i>
                            ${room.soPhongTrong || 0} phòng trống
                        </span>
                    </div>
                </div>
                <div class="room-booking">
                    <div class="room-price">
                        ${Utils.formatCurrency(room.giaMotDem)}
                        <span class="price-unit">/đêm</span>
                    </div>
                    <button class="btn-book-room" 
                            onclick="HotelDetailUI.bookRoom(${room.maLoaiPhong})"
                            ${(room.soPhongTrong || 0) === 0 ? "disabled" : ""}>
                        ${(room.soPhongTrong || 0) === 0 ? "Hết phòng" : "Đặt phòng"}
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  async loadHotelImages() {
    try {
      const images = await HotelService.getHotelImages(this.hotelId);
      const mainImage = Utils.$("#main-hotel-image");
      const thumbnails = Utils.$("#image-thumbnails");

      if (images.length > 0) {
        // Set main image
        if (mainImage) {
          mainImage.src = images[0].duongDanAnh;
        }

        // Create thumbnails
        if (thumbnails) {
          thumbnails.innerHTML = images
            .map(
              (image, index) => `
                        <img src="${image.duongDanAnh}" alt="Hotel Image ${index + 1}"
                             class="thumbnail ${index === 0 ? "active" : ""}"
                             onclick="HotelDetailUI.changeMainImage('${image.duongDanAnh}', this)">
                    `
            )
            .join("");
        }
      }
    } catch (error) {
      console.error("Load images error:", error);
    }
  }

  async loadReviews() {
    try {
      const reviews = await ReviewService.getReviewsByHotel(this.hotelId);
      const container = Utils.$("#reviews-container");

      if (!container) return;

      if (reviews.length === 0) {
        container.innerHTML = '<p class="no-reviews">Chưa có đánh giá nào.</p>';
        return;
      }

      container.innerHTML = reviews
        .map(
          (review) => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <img src="${Utils.getPlaceholderImage()}" alt="Avatar" class="reviewer-avatar">
                            <div>
                                <h4 class="reviewer-name">${review.hoTenNguoiDung}</h4>
                                <div class="review-rating">
                                    ${this.createStarRating(review.diemDanhGia)}
                                </div>
                            </div>
                        </div>
                        <div class="review-date">${Utils.formatDate(review.ngayTao)}</div>
                    </div>
                    <p class="review-comment">${review.binhLuan}</p>
                </div>
            `
        )
        .join("");
    } catch (error) {
      console.error("Load reviews error:", error);
    }
  }

  bindEvents() {
    // Review form
    const reviewForm = Utils.$("#review-form");
    if (reviewForm) {
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleReviewSubmit();
      });
    }

    // Star rating input
    const starInputs = Utils.$$("#star-rating-input .star");
    starInputs.forEach((star, index) => {
      star.addEventListener("click", () => {
        this.setRating(index + 1);
      });
    });
  }

  createStarRating(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star ${i <= rating ? "filled" : "empty"}"></i>`;
    }
    return stars;
  }

  createRatingInput() {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star star" data-rating="${i}"></i>`;
    }
    return stars;
  }

  setRating(rating) {
    this.selectedRating = rating;
    const stars = Utils.$$("#star-rating-input .star");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("filled");
        star.classList.remove("empty");
      } else {
        star.classList.add("empty");
        star.classList.remove("filled");
      }
    });
  }

  async handleReviewSubmit() {
    if (!AuthService.isLoggedIn()) {
      Utils.showWarning("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!this.selectedRating) {
      Utils.showError("Vui lòng chọn số sao đánh giá");
      return;
    }

    const commentElement = Utils.$("#review-comment");
    const comment = commentElement ? commentElement.value.trim() : "";

    if (!comment) {
      Utils.showError("Vui lòng nhập nhận xét");
      return;
    }

    try {
      const result = await ReviewService.createReview({
        maKhachSan: this.hotelId,
        diemDanhGia: this.selectedRating,
        binhLuan: comment,
      });

      if (result.success) {
        Utils.showSuccess("Đánh giá của bạn đã được gửi thành công!");
        Utils.clearForm("#review-form");
        this.selectedRating = 0;
        this.setRating(0);
        await this.loadReviews();
      } else {
        Utils.showError(result.message || "Có lỗi xảy ra khi gửi đánh giá");
      }
    } catch (error) {
      Utils.handleApiError(error);
    }
  }

  static changeMainImage(imageSrc, thumbnailElement) {
    const mainImage = Utils.$("#main-hotel-image");
    const thumbnails = Utils.$$(".thumbnail");

    if (mainImage) {
      mainImage.src = imageSrc;
    }

    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    if (thumbnailElement) {
      thumbnailElement.classList.add("active");
    }
  }

  static bookRoom(roomTypeId) {
    if (!AuthService.isLoggedIn()) {
      Utils.showWarning("Vui lòng đăng nhập để đặt phòng");
      Utils.redirect(`login.html?returnUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    const urlParams = Utils.getUrlParams();
    const checkIn = urlParams.checkIn || Utils.getTodayString();
    const checkOut = urlParams.checkOut || Utils.getTomorrowString();
    const guests = urlParams.guests || 2;

    Utils.redirect(`booking.html?roomType=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
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
  static async createHotelWithImages(formData) {
    try {
      const response = await fetch(`${Utils.API_BASE_URL}/hotels`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // Không set Content-Type để browser tự động set multipart/form-data
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra");
      }

      return result;
    } catch (error) {
      console.error("Create hotel with images error:", error);
      throw error;
    }
  }

  // Method mới để cập nhật khách sạn với ảnh
  static async updateHotelWithImages(id, formData) {
    try {
      const response = await fetch(`${Utils.API_BASE_URL}/hotels/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // Không set Content-Type để browser tự động set multipart/form-data
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra");
      }

      return result;
    } catch (error) {
      console.error("Update hotel with images error:", error);
      throw error;
    }
  }

  // Method để upload ảnh riêng biệt
  static async uploadHotelImages(hotelId, files) {
    try {
      const formData = new FormData();
      formData.append("maKhachSan", hotelId);

      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(`${Utils.API_BASE_URL}/hotels/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra");
      }

      return result;
    } catch (error) {
      console.error("Upload hotel images error:", error);
      throw error;
    }
  }

  // Method để xóa ảnh khách sạn
  static async deleteHotelImage(imageId) {
    try {
      const response = await Utils.delete(`/hotels/images/${imageId}`);
      return response;
    } catch (error) {
      console.error("Delete hotel image error:", error);
      throw error;
    }
  }
}

// Export for global use
window.HotelService = HotelService;
window.HotelUI = HotelUI;
window.HotelDetailUI = HotelDetailUI;
window.ReviewService = ReviewService;
