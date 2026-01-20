package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.domain.enums.Role;
import jakarta.validation.constraints.*;


import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Apartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters")
    @Column(length = 2000)
    private String description;

    @Embedded
    private Address address;

    @Min(value = 10, message = "Size must be at least 10 square meters")
    @Max(value = 10000, message = "Size must be at most 10000 square meters")
    private int size;

    @DecimalMin(value = "100.0", message = "Rental price per night must be at least 100.0")
    @DecimalMax(value = "10000.0", message = "Rental price per night must be at most 10000.0")
    private double rentalPrice; // Price per night

    @Min(value = 1, message = "Number of rooms must be at least 1")
    @Max(value = 20, message = "Number of rooms must be at most 20")
    private int numberOfRooms;

    private boolean furnished;
    
    @Min(value = 1, message = "Number of beds must be at least 1")
    private int numberOfBeds;

    @OneToMany(mappedBy = "apartment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Auction> auctions = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private AccessibilityType kitchen;

    private boolean wifi;
    private boolean petsAllowed;
    private boolean parkingSpace;

    @Enumerated(EnumType.STRING)
    private AccessibilityType yardAccess;

    @Enumerated(EnumType.STRING)
    private AccessibilityType poolAccess;

    private boolean disabilityFriendly;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyType propertyType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;  

    @OneToMany(mappedBy = "apartment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Rental> rentals;

    @OneToMany(mappedBy = "apartment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Photo> photos;

    @DecimalMin(value = "0.0", message = "Pool fee must be at least 0.0")
    private double poolFee;

    @PrePersist
    @PreUpdate
    private void validateOwner() {
        if (owner != null) {
            // Use getRoles() to ensure we handle null roles properly
            if (owner.getRoles() == null || !owner.getRoles().contains(Role.OWNER)) {
                throw new IllegalStateException("Apartment can only be owned by a user with OWNER role");
            }
        }
    }
    
    @Transient
    public boolean isOccupiedOn(LocalDate date) {
        if (rentals == null || rentals.isEmpty()) {
            return false;
        }
        
        return rentals.stream()
            .filter(rental -> rental.getStatus() != RentalStatus.CANCELLED)
            .anyMatch(rental -> 
                !date.isBefore(rental.getStartDate()) && 
                !date.isAfter(rental.getEndDate()));
    }
    
    @Transient
    public boolean isOccupiedBetween(LocalDate startDate, LocalDate endDate) {
        if (rentals == null || rentals.isEmpty()) {
            return false;
        }
        
        return rentals.stream()
            .filter(rental -> rental.getStatus() != RentalStatus.CANCELLED)
            .anyMatch(rental -> 
                // Check if the existing rental overlaps with the requested period
                (rental.getStartDate().isBefore(endDate) || rental.getStartDate().isEqual(endDate)) && 
                (rental.getEndDate().isAfter(startDate) || rental.getEndDate().isEqual(startDate)));
    }
    
    @Transient
    public boolean isCurrentlyOccupied() {
        return isOccupiedOn(LocalDate.now());
    }

    @Transient
    public double calculateTotalPriceForPeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start and end dates cannot be null");
        }
        
        // Calculate the number of nights (end date - start date)
        long nights = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        if (nights < 0) {
            throw new IllegalArgumentException("End date must be after or equal to start date");
        }
        
        // Base price calculation
        double basePrice = rentalPrice * nights;
        
        // Add pool fee if pool access is available
        double fees = 0.0;
        if (poolAccess != null && poolAccess != AccessibilityType.NONE) {
            fees += poolFee;
        }
        
        return basePrice + fees;
    }
}