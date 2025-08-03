// Hotel.js - Hotel listing page functions
// API_URL được định nghĩa trong utils.js

// Load hotels list
let allHotels = [];
let currentPage = 1;
const itemsPerPage = 6;

async function loadHotels() {
  try {
    const response = await fetch(`${API_URL}/hotels`);
    allHotels = await response.json();

    // Extract unique locations for filter
    const locations = [...new Set(allHotels.map((h) => h.city))];
    const locationFilter = document.getElementById("locationFilter");
    locationFilter.innerHTML = '<option value="">Tất cả địa điểm</option>';
    locations.forEach((location) => {
      locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
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

function displayHotels() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedLocation = document.getElementById("locationFilter").value;
  const priceRange = document.getElementById("priceFilter").value;

  // Filter hotels
  let filteredHotels = allHotels.filter((hotel) => {
    const matchSearch =
      hotel.name.toLowerCase().includes(searchTerm) ||
      hotel.city.toLowerCase().includes(searchTerm) ||
      hotel.address.toLowerCase().includes(searchTerm);
    const matchLocation = !selectedLocation || hotel.city === selectedLocation;

    let matchPrice = true;
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      matchPrice = hotel.price >= min && hotel.price <= max;
    }

    return matchSearch && matchLocation && matchPrice;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const hotelsToDisplay = filteredHotels.slice(startIndex, endIndex);

  // Display hotels
  const container = document.getElementById("hotelsList");
  container.innerHTML = "";

  if (hotelsToDisplay.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center">
                <p>Không tìm thấy khách sạn nào.</p>
            </div>
        `;
    return;
  }

  hotelsToDisplay.forEach((hotel) => {
    container.innerHTML += createHotelCard(hotel);
  });

  // Update pagination
  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Trước</a>
        </li>
    `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pagination.innerHTML += `
                <li class="page-item disabled">
                    <a class="page-link" href="#">...</a>
                </li>
            `;
    }
  }

  // Next button
  pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Sau</a>
        </li>
    `;
}

function changePage(page) {
  currentPage = page;
  displayHotels();
  window.scrollTo(0, 0);
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("hotelsList")) {
    loadHotels();

    // Search functionality
    document.getElementById("searchInput").addEventListener("input", () => {
      currentPage = 1;
      displayHotels();
    });

    // Filter functionality
    document.getElementById("locationFilter").addEventListener("change", () => {
      currentPage = 1;
      displayHotels();
    });

    document.getElementById("priceFilter").addEventListener("change", () => {
      currentPage = 1;
      displayHotels();
    });
  }
});
