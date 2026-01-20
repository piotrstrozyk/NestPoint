package pl.ug.NestPoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.dto.ReviewDTO;
import pl.ug.NestPoint.mapper.ReviewMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.repository.ReviewRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.domain.enums.Role;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final PhotoService photoService;
    private final ReviewMapper reviewMapper;

    @Transactional
    public ReviewDTO reviewApartment(ReviewDTO reviewDTO, MultipartFile file) throws IOException {
        // 1. Check required fields
        if (reviewDTO.getApartmentId() == null || reviewDTO.getAuthorId() == null) {
            throw new IllegalArgumentException("Apartment ID and author ID are required");
        }
        
        // 2. Validate the apartment exists
        Apartment apartment = apartmentRepository.findById(reviewDTO.getApartmentId())
            .orElseThrow(() -> new RuntimeException("Apartment not found"));
            
        // 3. Validate user exists and is a tenant
        User author = userRepository.findById(reviewDTO.getAuthorId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!author.getRoles().contains(Role.TENANT)) {
            throw new IllegalArgumentException("Only tenants can review apartments");
        }
        
        // 4. Validate the rental has been completed
        boolean hasCompletedRental = reviewRepository.hasUserRentedApartment(
            reviewDTO.getApartmentId(), reviewDTO.getAuthorId());
        if (!hasCompletedRental) {
            throw new IllegalArgumentException("Can only review apartments after completing a rental");
        }
        
        // 5. Check for duplicate reviews
        boolean hasReviewed = reviewRepository.existsByApartmentIdAndAuthorId(
            reviewDTO.getApartmentId(), reviewDTO.getAuthorId());
        if (hasReviewed) {
            throw new IllegalArgumentException("You have already reviewed this apartment");
        }

        // 6. Create review
        Review review = Review.builder()
            .content(reviewDTO.getContent())
            .score(validateScore(reviewDTO.getScore()))
            .createdAt(LocalDateTime.now())
            .author(author)
            .apartment(apartment)
            .build();

        Review savedReview = reviewRepository.save(review);

        // 7. Upload photo if provided
        if (file != null && !file.isEmpty()) {
            photoService.uploadPhotoForReview(savedReview.getId(), file);
        }

        // Return mapped DTO
        return reviewMapper.toDTO(savedReview);
    }

    @Transactional
    public ReviewDTO reviewUser(ReviewDTO reviewDTO) {
        // 1. Check required fields
        if (reviewDTO.getTargetUserId() == null || reviewDTO.getAuthorId() == null) {
            throw new IllegalArgumentException("Target user ID and author ID are required");
        }
        
        // 2. Validate users exist
        User author = userRepository.findById(reviewDTO.getAuthorId())
            .orElseThrow(() -> new RuntimeException("Author not found"));
        User targetUser = userRepository.findById(reviewDTO.getTargetUserId())
            .orElseThrow(() -> new RuntimeException("Target user not found"));

        // 3. Validate that users have different roles
        if (author.getRoles().equals(targetUser.getRoles())) {
            throw new IllegalArgumentException("Users with the same role cannot review each other");
        }
        
        // 4. Validate they've interacted through a completed rental
        boolean hasInteracted = reviewRepository.haveUsersInteracted(
            reviewDTO.getAuthorId(), reviewDTO.getTargetUserId());
        if (!hasInteracted) {
            throw new IllegalArgumentException("Users have not interacted through rentals");
        }
        
        // 5. Check for duplicate user reviews
        boolean hasReviewed = reviewRepository.existsByTargetUserIdAndAuthorId(
            reviewDTO.getTargetUserId(), reviewDTO.getAuthorId());
        if (hasReviewed) {
            throw new IllegalArgumentException("You have already reviewed this user");
        }

        // 6. Create review
        Review review = Review.builder()
            .content(reviewDTO.getContent())
            .score(validateScore(reviewDTO.getScore()))
            .createdAt(LocalDateTime.now())
            .author(author)
            .targetUser(targetUser)
            .build();

        Review savedReview = reviewRepository.save(review);

        // Return mapped DTO
        return reviewMapper.toDTO(savedReview);
    }

    public Map<String, Object> getApartmentReviews(Long apartmentId) {
        List<Review> reviews = reviewRepository.findByApartmentId(apartmentId);
        
        Double averageRating = reviewRepository.getAverageRatingForApartment(apartmentId);
        if (averageRating == null) {
            averageRating = 0.0;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews.stream().map(reviewMapper::toDTO).toList());
        result.put("averageRating", averageRating);
        result.put("reviewCount", reviews.size());
        return result;
    }

    public Map<String, Object> getUserReviews(Long userId) {
        List<Review> reviews = reviewRepository.findByTargetUserId(userId);
        
        Double averageRating = reviewRepository.getAverageRatingForUser(userId);
        if (averageRating == null) {
            averageRating = 0.0;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews.stream().map(reviewMapper::toDTO).toList());
        result.put("averageRating", averageRating);
        result.put("reviewCount", reviews.size());
        return result;
    }

    private int validateScore(int score) {
        if (score < 1 || score > 5) {
            throw new IllegalArgumentException("Rating score must be between 1 and 5");
        }
        return score;
    }
    @Transactional
    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }
    
    public long getReviewCount() {
        return reviewRepository.count();
    }

    @Transactional
    public ReviewDTO updateReview(ReviewDTO reviewDTO, MultipartFile file) throws IOException {
        // 1. Find existing review
        Review existingReview = reviewRepository.findById(reviewDTO.getId())
            .orElseThrow(() -> new RuntimeException("Review not found"));
        
        // 2. Verify that the update is by the original author
        if (!existingReview.getAuthor().getId().equals(reviewDTO.getAuthorId())) {
            throw new IllegalArgumentException("Only the original author can update the review");
        }
        
        // 3. Update review using mapper
        // Note: If updateEntityFromDto isn't available, fall back to manual updates
        // reviewMapper.updateEntityFromDto(reviewDTO, existingReview);
        existingReview.setContent(reviewDTO.getContent());
        existingReview.setScore(validateScore(reviewDTO.getScore()));
        
        // 4. Save changes
        Review savedReview = reviewRepository.save(existingReview);
        
        // 5. Update photo if provided
        if (file != null && !file.isEmpty()) {
            try {
                photoService.uploadPhotoForReview(savedReview.getId(), file);
            } catch (IOException e) {
                throw new IOException("Failed to update review photo: " + e.getMessage());
            }
        }
        
        // Return mapped DTO
        return reviewMapper.toDTO(savedReview);
    }
}