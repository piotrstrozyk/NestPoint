package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pl.ug.NestPoint.dto.ReviewDTO;
import pl.ug.NestPoint.service.ReviewService;
import pl.ug.NestPoint.repository.ReviewRepository;

import java.io.IOException;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;


@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugReview(
            @RequestParam Long apartmentId,
            @RequestParam Long authorId) {
        Map<String, Object> debug = new HashMap<>();
        debug.put("canReview", reviewRepository.hasUserRentedApartment(apartmentId, authorId));
        return ResponseEntity.ok(debug);
    }
    
    @PostMapping(value = "/apartment", consumes = {"multipart/form-data"})
    public ResponseEntity<ReviewDTO> reviewApartment(
            @RequestParam("details") String reviewDetails,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        
        // Parse review details from JSON string
        ObjectMapper mapper = new ObjectMapper();
        ReviewDTO reviewDTO = mapper.readValue(reviewDetails, ReviewDTO.class);
        
        return ResponseEntity.ok(reviewService.reviewApartment(reviewDTO, file));
    }
    
    @PostMapping(value = "/user", consumes = {"multipart/form-data"})
    public ResponseEntity<ReviewDTO> reviewUser(
            @RequestParam("details") String reviewDetails) throws IOException {
        
        // Parse review details from JSON string
        ObjectMapper mapper = new ObjectMapper();
        ReviewDTO reviewDTO = mapper.readValue(reviewDetails, ReviewDTO.class);
        
        return ResponseEntity.ok(reviewService.reviewUser(reviewDTO));
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<Map<String, Object>> getApartmentReviews(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(reviewService.getApartmentReviews(apartmentId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

        
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping(value = "/{reviewId}", consumes = {"multipart/form-data"})
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @RequestParam("details") String reviewDetails,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        ReviewDTO reviewDTO = mapper.readValue(reviewDetails, ReviewDTO.class);
        reviewDTO.setId(reviewId); 
        
        return ResponseEntity.ok(reviewService.updateReview(reviewDTO, file));
    }
}