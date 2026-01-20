package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.ug.NestPoint.domain.Photo;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByApartmentId(Long apartmentId);
    List<Photo> findByReviewId(Long reviewId);
}