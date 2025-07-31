using HotelBooking.API.Models.DTOs;
using HotelBooking.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HotelBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet("hotel/{hotelId}")]
        public async Task<IActionResult> GetHotelReviews(int hotelId)
        {
            try
            {
                var reviews = await _reviewService.GetHotelReviewsAsync(hotelId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách đánh giá", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReviews(int userId)
        {
            try
            {
                var reviews = await _reviewService.GetUserReviewsAsync(userId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách đánh giá của người dùng", error = ex.Message });
            }
        }

        [HttpGet("my-reviews")]
        [Authorize]
        public async Task<IActionResult> GetMyReviews()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var reviews = await _reviewService.GetUserReviewsAsync(userId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách đánh giá của bạn", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewById(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                return Ok(review);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin đánh giá", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] ReviewCreateDto reviewDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var review = await _reviewService.CreateReviewAsync(userId, reviewDto);
                return CreatedAtAction(nameof(GetReviewById), new { id = review.MaDanhGia }, review);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo đánh giá", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] ReviewUpdateDto reviewDto)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                
                // Check if user owns this review or is admin
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdmin = User.IsInRole("Admin");
                
                if (review.MaNguoiDung != currentUserId && !isAdmin)
                {
                    return Forbid("Bạn không có quyền cập nhật đánh giá này");
                }

                var updatedReview = await _reviewService.UpdateReviewAsync(id, reviewDto);
                return Ok(updatedReview);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật đánh giá", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                
                // Check if user owns this review or is admin
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdmin = User.IsInRole("Admin");
                
                if (review.MaNguoiDung != currentUserId && !isAdmin)
                {
                    return Forbid("Bạn không có quyền xóa đánh giá này");
                }

                var result = await _reviewService.DeleteReviewAsync(id);
                if (result)
                    return NoContent();
                else
                    return BadRequest(new { message = "Không thể xóa đánh giá" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa đánh giá", error = ex.Message });
            }
        }
    }
}