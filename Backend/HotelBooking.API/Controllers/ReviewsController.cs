using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelBooking.API.DTOs;
using HotelBooking.API.Services.Interfaces;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<DanhGiaDto>>> GetAllReviews()
        {
            try
            {
                var reviews = await _reviewService.GetAllReviewsAsync();
                return Ok(new { success = true, data = reviews });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all reviews");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DanhGiaDto>> GetReview(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                if (review == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá" });
                }

                return Ok(new { success = true, data = review });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotel/{hotelId}")]
        public async Task<ActionResult<IEnumerable<DanhGiaDto>>> GetReviewsByHotel(int hotelId)
        {
            try
            {
                var reviews = await _reviewService.GetReviewsByHotelAsync(hotelId);
                return Ok(new { success = true, data = reviews });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews for hotel {HotelId}", hotelId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotel/{hotelId}/summary")]
        public async Task<ActionResult<ReviewSummaryDto>> GetReviewSummary(int hotelId)
        {
            try
            {
                var summary = await _reviewService.GetReviewSummaryAsync(hotelId);
                if (summary == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khách sạn" });
                }

                return Ok(new { success = true, data = summary });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review summary for hotel {HotelId}", hotelId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DanhGiaDto>>> GetReviewsByUser(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();

                if (currentUserId != userId && currentUserRole != "Admin")
                {
                    return Forbid();
                }

                var reviews = await _reviewService.GetReviewsByUserAsync(userId);
                return Ok(new { success = true, data = reviews });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<DanhGiaDto>> CreateReview(CreateDanhGiaDto createReviewDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = GetCurrentUserId();
                var review = await _reviewService.CreateReviewAsync(currentUserId, createReviewDto);

                return CreatedAtAction(nameof(GetReview), new { id = review.MaDanhGia }, 
                    new { success = true, data = review });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<DanhGiaDto>> UpdateReview(int id, UpdateDanhGiaDto updateReviewDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = GetCurrentUserId();
                var review = await _reviewService.UpdateReviewAsync(id, currentUserId, updateReviewDto);

                if (review == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa" });
                }

                return Ok(new { success = true, data = review });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteReview(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var result = await _reviewService.DeleteReviewAsync(id, currentUserId);

                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá hoặc bạn không có quyền xóa" });
                }

                return Ok(new { success = true, message = "Xóa đánh giá thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("can-review/{hotelId}")]
        [Authorize]
        public async Task<ActionResult> CanUserReviewHotel(int hotelId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var canReview = await _reviewService.CanUserReviewHotelAsync(currentUserId, hotelId);

                return Ok(new { success = true, data = new { canReview } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user can review hotel {HotelId}", hotelId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private string GetCurrentUserRole()
        {
            return User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value ?? "Customer";
        }
    }
}