package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String content;
    
    @Min(value = 1, message = "Score must be at least 1")
    @Max(value = 5, message = "Score must be at most 5")
    @Column(nullable = false)
    private int score;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // Who created the review
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
    // Review targets (only one of these should be set)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = true)
    private Apartment apartment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = true)
    private User targetUser;
    
    // Related photos
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Photo> photos = new ArrayList<>();
    
    // Helper methods for managing relationships
    public void addPhoto(Photo photo) {
        photos.add(photo);
        photo.setReview(this);
    }
    
    public void removePhoto(Photo photo) {
        photos.remove(photo);
        photo.setReview(null);
    }
    
    // Validation to ensure a review targets either an apartment or a user, but not both
    @PrePersist
    @PreUpdate
    private void validateReviewTarget() {
        if ((apartment == null && targetUser == null) || (apartment != null && targetUser != null)) {
            throw new IllegalStateException("Review must be associated with either an apartment or a user, but not both");
        }
    }
}