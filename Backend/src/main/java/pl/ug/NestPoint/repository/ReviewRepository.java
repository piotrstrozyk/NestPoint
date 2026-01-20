package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Review;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Basic finder methods (combining functionality from both previous repositories)
    List<Review> findByApartmentId(Long apartmentId);
    List<Review> findByTargetUserId(Long userId);
    List<Review> findByAuthorId(Long authorId);
    
    // Calculate average ratings
    @Query("SELECT AVG(r.score) FROM Review r WHERE r.apartment.id = :apartmentId")
    Double getAverageRatingForApartment(@Param("apartmentId") Long apartmentId);
    
    @Query("SELECT AVG(r.score) FROM Review r WHERE r.targetUser.id = :userId")
    Double getAverageRatingForUser(@Param("userId") Long userId);
    
    // Count reviews
    @Query("SELECT COUNT(r) FROM Review r WHERE r.apartment.id = :apartmentId")
    Long countReviewsForApartment(@Param("apartmentId") Long apartmentId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.targetUser.id = :userId")
    Long countReviewsForUser(@Param("userId") Long userId);
    
    // Find related reviews (either author or target is the specified user)
    @Query("SELECT r FROM Review r WHERE r.targetUser.id = :userId OR r.author.id = :userId")
    List<Review> findAllUserRelatedReviews(@Param("userId") Long userId);
    
    // Validation queries
    @Query("SELECT COUNT(r) > 0 FROM Rental r WHERE r.apartment.id = :apartmentId AND r.tenant.id = :tenantId AND r.status = 'COMPLETED'")
    boolean hasUserRentedApartment(
        @Param("apartmentId") Long apartmentId, 
        @Param("tenantId") Long tenantId);
    
    @Query("SELECT COUNT(r) > 0 FROM Rental r WHERE " +
           "(r.tenant.id = :userId1 AND r.owner.id = :userId2) OR " +
           "(r.tenant.id = :userId2 AND r.owner.id = :userId1)")
    boolean haveUsersInteracted(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    boolean existsByApartmentIdAndAuthorId(Long apartmentId, Long authorId);
    boolean existsByTargetUserIdAndAuthorId(Long targetUserId, Long authorId);
}