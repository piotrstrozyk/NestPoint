package pl.ug.NestPoint.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ReviewDTO {
    private Long id;             // Adding the missing ID field
    private String content;      // Comment content
    private int score;           // Rating score (1-5)
    private Long authorId;       // Who's creating the review
    // These are mutually exclusive - either we're reviewing an apartment or a user
    private Long apartmentId;    // For apartment reviews
    private Long targetUserId;   // For user reviews
}