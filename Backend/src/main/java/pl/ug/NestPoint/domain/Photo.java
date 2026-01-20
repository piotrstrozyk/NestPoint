package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filePath; // URL or path to the photo

    @Column(nullable = false)
    private long fileSize; // File size in bytes

    @Column(nullable = false)
    private String fileType; // MIME type (e.g., "image/jpeg")

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = true) // Nullable because photos can belong to comments
    private Apartment apartment;

    // Update the existing Photo class to reference Review instead of Comment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;
}