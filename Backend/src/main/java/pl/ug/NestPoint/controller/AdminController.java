package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.dto.ApartmentDTO;
import pl.ug.NestPoint.dto.RentalDTO;
import pl.ug.NestPoint.dto.ReviewDTO;
import pl.ug.NestPoint.mapper.ApartmentMapper;
import pl.ug.NestPoint.mapper.RentalMapper;
import pl.ug.NestPoint.mapper.ReviewMapper;
import pl.ug.NestPoint.service.ApartmentService;
import pl.ug.NestPoint.service.RentalService;
import pl.ug.NestPoint.service.ReviewService;
import pl.ug.NestPoint.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    
    private final UserService userService;
    private final ApartmentService apartmentService;
    private final RentalService rentalService;
    private final ReviewService reviewService;
    private final ApartmentMapper apartmentMapper;
    private final RentalMapper rentalMapper;
    private final ReviewMapper reviewMapper;

    // User management
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    // Apartment management
    @GetMapping("/apartments")
    public ResponseEntity<List<ApartmentDTO>> getAllApartments() {
        List<Apartment> apartments = apartmentService.getAllApartments();
        return ResponseEntity.ok(apartments.stream()
                .map(apartmentMapper::toDTO)
                .toList());
    }
    
    @GetMapping("/apartments/{id}")
    public ResponseEntity<ApartmentDTO> getApartmentById(@PathVariable Long id) {
        Apartment apartment = apartmentService.getApartmentById(id);
        return ResponseEntity.ok(apartmentMapper.toDTO(apartment));
    }
    
    @DeleteMapping("/apartments/{id}")
    public ResponseEntity<Void> deleteApartment(@PathVariable Long id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.noContent().build();
    }
    
    // Rental management
    @GetMapping("/rentals")
    public ResponseEntity<Page<RentalDTO>> getAllRentals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        
        Pageable pageable = PageRequest.of(
            page, size, 
            direction.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending()
        );
        
        Page<Rental> rentals = rentalService.searchRentals(null, page, size, sortBy, direction);
        return ResponseEntity.ok(rentals.map(rentalMapper::toDTO));
    }
    
    @GetMapping("/rentals/{id}")
    public ResponseEntity<RentalDTO> getRentalById(@PathVariable Long id) {
        Rental rental = rentalService.getRentalById(id);
        if (rental == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rentalMapper.toDTO(rental));
    }
    
    @DeleteMapping("/rentals/{id}")
    public ResponseEntity<Void> deleteRental(@PathVariable Long id) {
        rentalService.deleteRental(id);
        return ResponseEntity.noContent().build();
    }
    
    // Review management
    @GetMapping("/reviews/apartment/{apartmentId}")
    public ResponseEntity<Map<String, Object>> getApartmentReviews(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(reviewService.getApartmentReviews(apartmentId));
    }
    
    @GetMapping("/reviews/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }
    
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
    
    // System statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        Map<String, Object> stats = Map.of(
            "userCount", userService.getUserCount(),
            "apartmentCount", apartmentService.getApartmentCount(),
            "activeRentalCount", rentalService.getActiveRentalCount(),
            "reviewCount", reviewService.getReviewCount()
        );
        return ResponseEntity.ok(stats);
    }
}