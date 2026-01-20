package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pl.ug.NestPoint.domain.Photo;
import pl.ug.NestPoint.service.PhotoService;

import java.io.IOException;

@RestController
@RequestMapping("/photos")
@RequiredArgsConstructor
public class PhotoController {
    private final PhotoService photoService;

    @PostMapping("/apartment/{apartmentId}")
    public ResponseEntity<Photo> uploadPhotoForApartment(@PathVariable Long apartmentId,
                                                         @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(photoService.uploadPhotoForApartment(apartmentId, file));
    }

    @PostMapping("/review/{reviewId}")
    public ResponseEntity<Photo> uploadPhotoForReview(@PathVariable Long reviewId,
                                                       @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(photoService.uploadPhotoForReview(reviewId, file));
    }
    
    @GetMapping("/{photoId}")
    public ResponseEntity<Photo> getPhoto(@PathVariable Long photoId) {
        return ResponseEntity.ok(photoService.getPhoto(photoId));
    }
    
    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long photoId) {
        photoService.deletePhoto(photoId);
        return ResponseEntity.noContent().build();
    }
}