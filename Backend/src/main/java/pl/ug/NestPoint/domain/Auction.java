package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;
import jakarta.validation.constraints.*;
import pl.ug.NestPoint.domain.enums.AuctionStatus;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    @DecimalMin(value = "0.0", message = "Starting price must be at least 0.0")
    private double startingPrice;
    
    @DecimalMin(value = "0.0", message = "Minimum bid increment must be at least 0.0")
    private double minimumBidIncrement;
    
    @Column(nullable = false)
    private LocalDate rentalStartDate;
    
    @Column(nullable = false)
    private LocalDate rentalEndDate;
    
    @Enumerated(EnumType.STRING)
    private AuctionStatus status;
    
    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Bid> bids = new ArrayList<>();
    
    @OneToOne(cascade = CascadeType.ALL)
    private Rental resultingRental;
    
    @Column(nullable = false)
    @Builder.Default
    private int maxBidders = 10;

    @Transient
    public int getCurrentBidderCount() {
        if (bids == null) {
            return 0;
        }
        return (int) bids.stream()
                .filter(bid -> !bid.isDropped())  // Only count non-dropped bidders
                .map(Bid::getBidder)
                .distinct()
                .count();
    }
    
    @Transient
    public double getCurrentHighestBid() {
        if (bids == null || bids.isEmpty()) {
            return startingPrice;
        }
        return bids.stream()
                .filter(bid -> !bid.isDropped())  // Only consider non-dropped bids
                .mapToDouble(Bid::getAmount)
                .max()
                .orElse(startingPrice);
    }
    
    @Transient
    public Bid getWinningBid() {
        if (bids == null || bids.isEmpty()) {
            return null;
        }
        return bids.stream()
                .filter(bid -> !bid.isDropped())  // Only consider non-dropped bids
                .max(Comparator.comparing(Bid::getAmount)
                     .thenComparing(Bid::getBidTime, Comparator.reverseOrder()))  // If tie, earliest bid wins
                .orElse(null);
    }
    @Transient
    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == AuctionStatus.ACTIVE && 
               now.isAfter(startTime) && 
               now.isBefore(endTime);
    }
    
    
    @Transient
    public boolean canAcceptMoreBidders() {
        return getCurrentBidderCount() < maxBidders;
    }
    
    @PrePersist
    @PreUpdate
    private void validateAuction() {
        if (endTime.isBefore(startTime)) {
            throw new IllegalStateException("End time must be after start time");
        }
        
        if (rentalEndDate.isBefore(rentalStartDate)) {
            throw new IllegalStateException("Rental end date must be after rental start date");
        }
        
        // Skip occupancy check for COMPLETED or CANCELLED auctions
        if (status == AuctionStatus.COMPLETED || status == AuctionStatus.CANCELLED) {
            return;
        }
        
        // Only check for occupancy for PENDING or ACTIVE auctions
        if (apartment != null && apartment.isOccupiedBetween(rentalStartDate, rentalEndDate)) {
            throw new IllegalStateException("Apartment is already booked for the specified period");
        }
    }
}