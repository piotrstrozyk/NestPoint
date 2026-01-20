package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.Review;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.ReviewDTO;
import pl.ug.NestPoint.mapper.ReviewMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.repository.ReviewRepository;
import pl.ug.NestPoint.repository.UserRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

import org.junit.jupiter.api.Assertions;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Review Service Tests")
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    
    @Mock
    private RentalRepository rentalRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ApartmentRepository apartmentRepository;
    
    @Mock
    private PhotoService photoService;
    
    @Mock
    private ReviewMapper reviewMapper;
    
    @Mock
    private MultipartFile mockFile;
    
    @InjectMocks
    private ReviewService reviewService;
    
    private ReviewDTO reviewDTO;
    private Review review;
    private User tenant;
    private User owner;
    private Apartment apartment;
    
    @BeforeEach
    void setUp() {
        Set<Role> tenantRoles = new HashSet<>();
        tenantRoles.add(Role.TENANT);
        tenant = new User();
        tenant.setId(1L);
        tenant.setUsername("tenant");
        tenant.setRoles(tenantRoles);
        
        Set<Role> ownerRoles = new HashSet<>();
        ownerRoles.add(Role.OWNER);
        owner = new User();
        owner.setId(2L);
        owner.setUsername("owner");
        owner.setRoles(ownerRoles);
        
        apartment = new Apartment();
        apartment.setId(1L);
        apartment.setTitle("Test Apartment");
        apartment.setOwner(owner);
        
        reviewDTO = new ReviewDTO();
        reviewDTO.setContent("Great place to stay!");
        reviewDTO.setScore(5);
        reviewDTO.setAuthorId(1L);
        reviewDTO.setApartmentId(1L);
        
        review = Review.builder()
                .id(1L)
                .content("Great place to stay!")
                .score(5)
                .createdAt(LocalDateTime.now())
                .author(tenant)
                .apartment(apartment)
                .build();
    }

    @Test
    @DisplayName("Should create apartment review successfully")
    void shouldCreateApartmentReview() throws IOException {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByApartmentIdAndAuthorId(1L, 1L)).thenReturn(false);
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(review);
        Mockito.when(reviewMapper.toDTO(review)).thenReturn(reviewDTO);
        Mockito.when(mockFile.isEmpty()).thenReturn(false);
        
        // Act
        ReviewDTO result = reviewService.reviewApartment(reviewDTO, mockFile);
        
        // Assert
        Assertions.assertEquals(reviewDTO, result);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
        Mockito.verify(photoService).uploadPhotoForReview(1L, mockFile);
    }
    
    @Test
    @DisplayName("Should create apartment review without photo")
    void shouldCreateApartmentReviewWithoutPhoto() throws IOException {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByApartmentIdAndAuthorId(1L, 1L)).thenReturn(false);
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(review);
        Mockito.when(reviewMapper.toDTO(review)).thenReturn(reviewDTO);
        
        // Act
        ReviewDTO result = reviewService.reviewApartment(reviewDTO, null);
        
        // Assert
        Assertions.assertEquals(reviewDTO, result);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
        Mockito.verify(photoService, Mockito.never()).uploadPhotoForReview(Mockito.anyLong(), Mockito.any());
    }
    
    @Test
    @DisplayName("Should throw exception when apartment ID is missing")
    void shouldThrowExceptionWhenApartmentIdIsMissing() {
        // Arrange
        reviewDTO.setApartmentId(null);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when author ID is missing")
    void shouldThrowExceptionWhenAuthorIdIsMissing() {
        // Arrange
        reviewDTO.setAuthorId(null);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when apartment not found")
    void shouldThrowExceptionWhenApartmentNotFound() {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Assertions.assertThrows(RuntimeException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when user not found")
    void shouldThrowExceptionWhenUserNotFound() {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Assertions.assertThrows(RuntimeException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when user is not a tenant")
    void shouldThrowExceptionWhenUserIsNotTenant() {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(owner)); // Owner trying to review
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when user has not rented apartment")
    void shouldThrowExceptionWhenUserHasNotRentedApartment() {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(false);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when user has already reviewed apartment")
    void shouldThrowExceptionWhenUserHasAlreadyReviewedApartment() {
        // Arrange
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByApartmentIdAndAuthorId(1L, 1L)).thenReturn(true);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should create user review successfully")
    void shouldCreateUserReview() {
        // Arrange
        reviewDTO.setApartmentId(null);
        reviewDTO.setTargetUserId(2L);
        
        Review userReview = Review.builder()
                .id(2L)
                .content("Great host!")
                .score(5)
                .createdAt(LocalDateTime.now())
                .author(tenant)
                .targetUser(owner)
                .build();
        
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        Mockito.when(reviewRepository.haveUsersInteracted(1L, 2L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByTargetUserIdAndAuthorId(2L, 1L)).thenReturn(false);
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(userReview);
        Mockito.when(reviewMapper.toDTO(userReview)).thenReturn(reviewDTO);
        
        // Act
        ReviewDTO result = reviewService.reviewUser(reviewDTO);
        
        // Assert
        Assertions.assertEquals(reviewDTO, result);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
    }
    
    @Test
    @DisplayName("Should throw exception when target user ID is missing")
    void shouldThrowExceptionWhenTargetUserIdIsMissing() {
        // Arrange
        reviewDTO.setApartmentId(null);
        reviewDTO.setTargetUserId(null);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewUser(reviewDTO);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when users have same role")
    void shouldThrowExceptionWhenUsersHaveSameRole() {
        // Arrange
        User anotherTenant = new User();
        anotherTenant.setId(3L);
        Set<Role> tenantRoles = new HashSet<>();
        tenantRoles.add(Role.TENANT);
        anotherTenant.setRoles(tenantRoles);
        
        reviewDTO.setApartmentId(null);
        reviewDTO.setTargetUserId(3L);
        
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(userRepository.findById(3L)).thenReturn(Optional.of(anotherTenant));
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewUser(reviewDTO);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when users have not interacted")
    void shouldThrowExceptionWhenUsersHaveNotInteracted() {
        // Arrange
        reviewDTO.setApartmentId(null);
        reviewDTO.setTargetUserId(2L);
        
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        Mockito.when(reviewRepository.haveUsersInteracted(1L, 2L)).thenReturn(false);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewUser(reviewDTO);
        });
    }
    
    @Test
    @DisplayName("Should throw exception when user has already reviewed target user")
    void shouldThrowExceptionWhenUserHasAlreadyReviewedTargetUser() {
        // Arrange
        reviewDTO.setApartmentId(null);
        reviewDTO.setTargetUserId(2L);
        
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        Mockito.when(reviewRepository.haveUsersInteracted(1L, 2L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByTargetUserIdAndAuthorId(2L, 1L)).thenReturn(true);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewUser(reviewDTO);
        });
    }
    
    @Test
    @DisplayName("Should get apartment reviews")
    void shouldGetApartmentReviews() {
        // Arrange
        List<Review> reviews = Collections.singletonList(review);
        List<ReviewDTO> reviewDTOs = Collections.singletonList(reviewDTO);
        
        Mockito.when(reviewRepository.findByApartmentId(1L)).thenReturn(reviews);
        Mockito.when(reviewRepository.getAverageRatingForApartment(1L)).thenReturn(4.5);
        Mockito.when(reviewMapper.toDTO(review)).thenReturn(reviewDTO);
        
        // Act
        Map<String, Object> result = reviewService.getApartmentReviews(1L);
        
        // Assert
        Assertions.assertEquals(reviewDTOs, result.get("reviews"));
        Assertions.assertEquals(4.5, result.get("averageRating"));
        Assertions.assertEquals(1, result.get("reviewCount"));
    }
    
    @Test
    @DisplayName("Should handle empty apartment reviews")
    void shouldHandleEmptyApartmentReviews() {
        // Arrange
        List<Review> reviews = Collections.emptyList();
        
        Mockito.when(reviewRepository.findByApartmentId(1L)).thenReturn(reviews);
        Mockito.when(reviewRepository.getAverageRatingForApartment(1L)).thenReturn(null);
        
        // Act
        Map<String, Object> result = reviewService.getApartmentReviews(1L);
        
        // Assert
        Assertions.assertEquals(Collections.emptyList(), result.get("reviews"));
        Assertions.assertEquals(0.0, result.get("averageRating"));
        Assertions.assertEquals(0, result.get("reviewCount"));
    }
    
    @Test
    @DisplayName("Should get user reviews")
    void shouldGetUserReviews() {
        // Arrange
        Review userReview = Review.builder()
                .id(2L)
                .content("Great host!")
                .score(5)
                .createdAt(LocalDateTime.now())
                .author(tenant)
                .targetUser(owner)
                .build();
        
        ReviewDTO userReviewDTO = new ReviewDTO();
        userReviewDTO.setContent("Great host!");
        userReviewDTO.setScore(5);
        userReviewDTO.setAuthorId(1L);
        userReviewDTO.setTargetUserId(2L);
        
        List<Review> reviews = Collections.singletonList(userReview);
        List<ReviewDTO> reviewDTOs = Collections.singletonList(userReviewDTO);
        
        Mockito.when(reviewRepository.findByTargetUserId(2L)).thenReturn(reviews);
        Mockito.when(reviewRepository.getAverageRatingForUser(2L)).thenReturn(4.8);
        Mockito.when(reviewMapper.toDTO(userReview)).thenReturn(userReviewDTO);
        
        // Act
        Map<String, Object> result = reviewService.getUserReviews(2L);
        
        // Assert
        Assertions.assertEquals(reviewDTOs, result.get("reviews"));
        Assertions.assertEquals(4.8, result.get("averageRating"));
        Assertions.assertEquals(1, result.get("reviewCount"));
    }
    
    @Test
    @DisplayName("Should handle empty user reviews")
    void shouldHandleEmptyUserReviews() {
        // Arrange
        List<Review> reviews = Collections.emptyList();
        
        Mockito.when(reviewRepository.findByTargetUserId(2L)).thenReturn(reviews);
        Mockito.when(reviewRepository.getAverageRatingForUser(2L)).thenReturn(null);
        
        // Act
        Map<String, Object> result = reviewService.getUserReviews(2L);
        
        // Assert
        Assertions.assertEquals(Collections.emptyList(), result.get("reviews"));
        Assertions.assertEquals(0.0, result.get("averageRating"));
        Assertions.assertEquals(0, result.get("reviewCount"));
    }
    
    @Test
    @DisplayName("Should throw exception when rating score is invalid")
    void shouldThrowExceptionWhenRatingScoreIsInvalid() {
        // Arrange
        reviewDTO.setScore(6); // Invalid score (>5)
        
        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        Mockito.when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(true);
        Mockito.when(reviewRepository.existsByApartmentIdAndAuthorId(1L, 1L)).thenReturn(false);
        
        // Act & Assert
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.reviewApartment(reviewDTO, null);
        });
    }
    
    @Test
    @DisplayName("Should delete review")
    void shouldDeleteReview() {
        // Act
        reviewService.deleteReview(1L);
        
        // Assert
        Mockito.verify(reviewRepository).deleteById(1L);
    }
    
    @Test
    @DisplayName("Should get review count")
    void shouldGetReviewCount() {
        // Arrange
        Mockito.when(reviewRepository.count()).thenReturn(10L);
        
        // Act
        long count = reviewService.getReviewCount();
        
        // Assert
        Assertions.assertEquals(10L, count);
    }

    @Test
    @DisplayName("Should update review successfully with photo")
    void shouldUpdateReviewSuccessfullyWithPhoto() throws IOException {
        // Arrange
        Long reviewId = 1L;
        Long authorId = tenant.getId();
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(reviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(4);
        updateDTO.setAuthorId(authorId);
        
        Review existingReview = review; // from setup
        Review updatedReview = Review.builder()
                .id(reviewId)
                .content("Updated content!")
                .score(4)
                .createdAt(existingReview.getCreatedAt())
                .author(tenant)
                .apartment(apartment)
                .build();
        
        Mockito.when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(updatedReview);
        Mockito.when(reviewMapper.toDTO(updatedReview)).thenReturn(updateDTO);
        Mockito.when(mockFile.isEmpty()).thenReturn(false);
        
        // Act
        ReviewDTO result = reviewService.updateReview(updateDTO, mockFile);
        
        // Assert
        Assertions.assertEquals(updateDTO, result);
        Mockito.verify(reviewRepository).findById(reviewId);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
        Mockito.verify(photoService).uploadPhotoForReview(reviewId, mockFile);
        
        // Verify content and score were updated
        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        Mockito.verify(reviewRepository).save(reviewCaptor.capture());
        Review capturedReview = reviewCaptor.getValue();
        Assertions.assertEquals("Updated content!", capturedReview.getContent());
        Assertions.assertEquals(4, capturedReview.getScore());
    }
    
    @Test
    @DisplayName("Should update review successfully without photo")
    void shouldUpdateReviewSuccessfullyWithoutPhoto() throws IOException {
        // Arrange
        Long reviewId = 1L;
        Long authorId = tenant.getId();
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(reviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(4);
        updateDTO.setAuthorId(authorId);
        
        Review existingReview = review; // from setup
        Review updatedReview = Review.builder()
                .id(reviewId)
                .content("Updated content!")
                .score(4)
                .createdAt(existingReview.getCreatedAt())
                .author(tenant)
                .apartment(apartment)
                .build();
        
        Mockito.when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(updatedReview);
        Mockito.when(reviewMapper.toDTO(updatedReview)).thenReturn(updateDTO);
        
        // Act
        ReviewDTO result = reviewService.updateReview(updateDTO, null);
        
        // Assert
        Assertions.assertEquals(updateDTO, result);
        Mockito.verify(reviewRepository).findById(reviewId);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
        Mockito.verify(photoService, Mockito.never()).uploadPhotoForReview(Mockito.anyLong(), Mockito.any());
    }
    
    @Test
    @DisplayName("Should throw exception when review not found during update")
    void shouldThrowExceptionWhenReviewNotFoundDuringUpdate() {
        // Arrange
        Long nonExistentReviewId = 999L;
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(nonExistentReviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(4);
        updateDTO.setAuthorId(tenant.getId());
        
        Mockito.when(reviewRepository.findById(nonExistentReviewId)).thenReturn(Optional.empty());
        
        // Act & Assert
        RuntimeException exception = Assertions.assertThrows(RuntimeException.class, () -> {
            reviewService.updateReview(updateDTO, null);
        });
        
        Assertions.assertEquals("Review not found", exception.getMessage());
        Mockito.verify(reviewRepository).findById(nonExistentReviewId);
        Mockito.verify(reviewRepository, Mockito.never()).save(Mockito.any());
    }
    
    @Test
    @DisplayName("Should throw exception when update by non-original author")
    void shouldThrowExceptionWhenUpdateByNonOriginalAuthor() {
        // Arrange
        Long reviewId = 1L;
        Long differentUserId = 999L;
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(reviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(4);
        updateDTO.setAuthorId(differentUserId);
        
        Mockito.when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        
        // Act & Assert
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.updateReview(updateDTO, null);
        });
        
        Assertions.assertEquals("Only the original author can update the review", exception.getMessage());
        Mockito.verify(reviewRepository).findById(reviewId);
        Mockito.verify(reviewRepository, Mockito.never()).save(Mockito.any());
    }
    
    @Test
    @DisplayName("Should throw exception when updating with invalid score")
    void shouldThrowExceptionWhenUpdatingWithInvalidScore() {
        // Arrange
        Long reviewId = 1L;
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(reviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(6);
        updateDTO.setAuthorId(tenant.getId());
        
        Mockito.when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        
        // Act & Assert
        IllegalArgumentException exception = Assertions.assertThrows(IllegalArgumentException.class, () -> {
            reviewService.updateReview(updateDTO, null);
        });
        
        Assertions.assertEquals("Rating score must be between 1 and 5", exception.getMessage());
        Mockito.verify(reviewRepository).findById(reviewId);
        Mockito.verify(reviewRepository, Mockito.never()).save(Mockito.any());
    }
    
    @Test
    @DisplayName("Should handle IOException during photo update")
    void shouldHandleIOExceptionDuringPhotoUpdate() throws IOException {
        // Arrange
        Long reviewId = 1L;
        
        ReviewDTO updateDTO = new ReviewDTO();
        updateDTO.setId(reviewId);
        updateDTO.setContent("Updated content!");
        updateDTO.setScore(4);
        updateDTO.setAuthorId(tenant.getId());
        
        Mockito.when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        Mockito.when(reviewRepository.save(Mockito.any(Review.class))).thenReturn(review);
        Mockito.when(mockFile.isEmpty()).thenReturn(false);
        Mockito.doThrow(new IOException("Upload failed")).when(photoService)
               .uploadPhotoForReview(Mockito.anyLong(), Mockito.any());
        
        // Act & Assert
        IOException exception = Assertions.assertThrows(IOException.class, () -> {
            reviewService.updateReview(updateDTO, mockFile);
        });
        
        Assertions.assertTrue(exception.getMessage().contains("Failed to update review photo"));
        Mockito.verify(reviewRepository).findById(reviewId);
        Mockito.verify(reviewRepository).save(Mockito.any(Review.class));
        Mockito.verify(photoService).uploadPhotoForReview(Mockito.anyLong(), Mockito.any());
    }
}