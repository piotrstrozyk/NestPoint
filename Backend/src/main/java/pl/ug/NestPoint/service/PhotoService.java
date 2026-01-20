package pl.ug.NestPoint.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.Review;
import pl.ug.NestPoint.domain.Photo;
import pl.ug.NestPoint.repository.PhotoRepository;


import java.io.IOException;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoService {
    private final Cloudinary cloudinary;
    private final PhotoRepository photoRepository;

    private final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private final String[] ALLOWED_FILE_TYPES = {"image/jpeg", "image/png"};

    /**
     * Upload a photo for an apartment.
     */
    public Photo uploadPhotoForApartment(Long apartmentId, MultipartFile file) throws IOException {
        validateFile(file);

        // Upload to Cloudinary under the "apartments" folder
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "apartments/" + apartmentId // Store in a folder named after the apartment ID
        ));
        String filePath = uploadResult.get("secure_url").toString(); // Get the secure URL

        // Save photo metadata to the database
        Photo photo = Photo.builder()
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .apartment(Apartment.builder().id(apartmentId).build())
                .build();

        return photoRepository.save(photo);
    }

    /**
     * Upload a photo for a review.
     */
    public Photo uploadPhotoForReview(Long reviewId, MultipartFile file) throws IOException {
        validateFile(file);
    
        // Upload to Cloudinary under the "reviews" folder
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "reviews/" + reviewId // Store in a folder named after the review ID
        ));
        String filePath = uploadResult.get("secure_url").toString(); // Get the secure URL
    
        // Save photo metadata to the database
        Photo photo = Photo.builder()
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .review(Review.builder().id(reviewId).build())
                .build();
    
        return photoRepository.save(photo);
    }

    /**
     * Validate the uploaded file.
     */
    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the limit of 5 MB.");
        }

        String contentType = file.getContentType();
        boolean isValidType = false;
        for (String allowedType : ALLOWED_FILE_TYPES) {
            if (allowedType.equals(contentType)) {
                isValidType = true;
                break;
            }
        }

        if (!isValidType) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG and PNG are allowed.");
        }
    }
    /**
     * Get a photo by its ID.
     */
    public Photo getPhoto(Long photoId) {
        return photoRepository.findById(photoId)
                .orElseThrow(() -> new RuntimeException("Photo not found"));
    }
    
    /**
     * Delete a photo by its ID.
     */
    public void deletePhoto(Long photoId) {
        Photo photo = getPhoto(photoId);
        photoRepository.delete(photo);
        
        // Extract the public ID from the Cloudinary URL
        try {
            String publicId;
            String filePath = photo.getFilePath();
            
            // The URL format is: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[id].[extension]
            // We need to extract just the folder/id part
            
            int uploadPos = filePath.indexOf("/upload/");
            if (uploadPos > 0) {
                // Get everything after ".../upload/"
                String afterUpload = filePath.substring(uploadPos + 8);
                // Remove version number if present (after v and before /)
                if (afterUpload.startsWith("v")) {
                    afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
                }
                // Remove file extension
                publicId = afterUpload.substring(0, afterUpload.lastIndexOf("."));
                
                // Destroy the image in Cloudinary
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete photo from Cloudinary", e);
        }
    }
    
    /**
     * Get all photos for an apartment.
     */
    public List<Photo> getPhotosForApartment(Long apartmentId) {
        return photoRepository.findByApartmentId(apartmentId);
    }
    
    /**
     * Get all photos for a review.
     */
    public List<Photo> getPhotosForReview(Long reviewId) {
        return photoRepository.findByReviewId(reviewId);
    }

}