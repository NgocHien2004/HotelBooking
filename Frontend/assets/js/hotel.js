// Hotel.js - Hotel listing page functions
// API_URL được định nghĩa trong utils.js

// Load hotels list
let allHotels = [];
let currentPage = 1;
const itemsPerPage = 6;

async function loadHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`);
    const data = await response.json();

    // Kiểm tra response format từ backend
    if (data.success && data.data) {
      allHotels = data.data;
    } else {
      allHotels = data; // Fallback nếu response trực tiếp là array
    }

    // Extract unique locations for filter
    const locations = [...new Set(allHotels.map((h) => h.thanhPho || h.city))];
    const locationFilter = document.getElementById("locationFilter");
    locationFilter.innerHTML = '<option value="">Tất cả địa điểm</option>';
    locations.forEach((location) => {
      if (location) {
        locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
      }
    });

    displayHotels();
  } catch (error) {
    console.error("Error loading hotels:", error);
    document.getElementById("hotelsList").innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Có lỗi xảy ra khi tải danh sách khách sạn.</p>
            </div>
        `;
  }
}

// SỬA ĐỔI: Thêm function tính giá phòng thấp nhất
function getMinPriceFromHotel(hotel) {
  // Tính giá phòng thấp nhất từ các loại phòng
  if (hotel.loaiPhongs && hotel.loaiPhongs.length > 0) {
    const prices = hotel.loaiPhongs.map((room) => room.giaMotDem).filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  // Fallback cho các property khác
  return hotel.giaPhongThapNhat || hotel.giaMotDem || hotel.price || 0;
}

function displayHotels() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedLocation = document.getElementById("locationFilter").value;
  const priceRange = document.getElementById("priceFilter").value;

  // Filter hotels
  let filteredHotels = allHotels.filter((hotel) => {
    // Xử lý cả tên property tiếng Việt và tiếng Anh
    const hotelName = hotel.tenKhachSan || hotel.name || "";
    const hotelCity = hotel.thanhPho || hotel.city || "";
    const hotelAddress = hotel.diaChi || hotel.address || "";

    // SỬA ĐỔI: Sử dụng function tính giá thấp nhất
    const minPrice = getMinPriceFromHotel(hotel);

    const matchSearch =
      hotelName.toLowerCase().includes(searchTerm) || hotelCity.toLowerCase().includes(searchTerm) || hotelAddress.toLowerCase().includes(searchTerm);
    const matchLocation = !selectedLocation || hotelCity === selectedLocation;

    let matchPrice = true;
    if (priceRange && minPrice > 0) {
      const [min, max] = priceRange.split("-").map(Number);
      matchPrice = minPrice >= min && minPrice <= max;
    }

    return matchSearch && matchLocation && matchPrice;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const hotelsToShow = filteredHotels.slice(startIndex, endIndex);

  displayHotelList(hotelsToShow);
  displayPagination(totalPages);
}

function displayHotelList(hotels) {
  const container = document.getElementById("hotelsList");

  if (hotels.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center">
                <p>Không tìm thấy khách sạn nào phù hợp với tiêu chí tìm kiếm.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = "";
  hotels.forEach((hotel) => {
    container.innerHTML += createHotelCardForListing(hotel);
  });
}

// SỬA ĐỔI: Function tạo hotel card cho trang listing với style mới
function createHotelCardForListing(hotel) {
  const rating = hotel.danhGiaTrungBinh || hotel.rating || 0;
  const city = hotel.thanhPho || hotel.city || "";
  const minPrice = getMinPriceFromHotel(hotel);

  // Get the main image
  let imageUrl = getImageUrl(null); // Default placeholder
  if (hotel.hinhAnhs && hotel.hinhAnhs.length > 0) {
    imageUrl = getImageUrl(hotel.hinhAnhs[0]);
  }

  return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card hotel-card h-100">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="${hotel.tenKhachSan}" 
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='${getImageUrl(null)}'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white;">
                          ${rating.toFixed(1)} ⭐
                        </span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${hotel.tenKhachSan}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${city}
                    </p>
                    <p class="card-text">${truncateText(hotel.moTa || "", 100)}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold" style="color: #28a745; font-size: 1.1rem;">
                                ${minPrice > 0 ? `Chỉ từ ${formatCurrency(minPrice)}/đêm` : "Liên hệ để biết giá"}
                            </span>
                            <button class="btn btn-outline-primary" onclick="viewHotelDetails(${hotel.maKhachSan})">
                                Xem chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayPagination(totalPages) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  container.innerHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    container.innerHTML += `
            <li class="page-item ${currentPage === i ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
  }

  // Next button
  container.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
}

function changePage(page) {
  if (page < 1) return;
  currentPage = page;
  displayHotels();
}

function viewHotelDetails(hotelId) {
  window.location.href = `hotel-detail.html?id=${hotelId}`;
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  loadHotels();

  document.getElementById("searchInput").addEventListener("input", () => {
    currentPage = 1;
    displayHotels();
  });

  document.getElementById("locationFilter").addEventListener("change", () => {
    currentPage = 1;
    displayHotels();
  });

  document.getElementById("priceFilter").addEventListener("change", () => {
    currentPage = 1;
    displayHotels();
  });
});
