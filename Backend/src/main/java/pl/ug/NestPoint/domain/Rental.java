package pl.ug.NestPoint.domain;

import pl.ug.NestPoint.domain.enums.Role;

import jakarta.persistence.*;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rental {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private User tenant; 
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @Future(message = "End date must be in the future")
    private LocalDate endDate;

    @AssertTrue(message = "End date must be after start date")
    private boolean isEndDateValid() {
        return endDate == null || startDate == null || endDate.isAfter(startDate);
    }

    private double totalCost;

    @Enumerated(EnumType.STRING)
    private RentalStatus status;

    @OneToOne(mappedBy = "rental", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    @Column(name = "is_auction", nullable = false)
    private boolean isAuction = false;

    @Column(name = "auction_payment_confirmed")
    private Boolean auctionPaymentConfirmed = false;

    @Column(name = "auction_payment_deadline")
    private LocalDateTime auctionPaymentDeadline;

    @Column(name = "auction_fine_issued")
    private Boolean auctionFineIssued = false;

    @Column(name = "auction_fine_amount")
    private Double auctionFineAmount;

    public boolean needsAuctionPayment() {
        return isAuction && !auctionPaymentConfirmed && auctionPaymentDeadline != null;
    }
    
    public boolean isAuctionPaymentOverdue() {
        return needsAuctionPayment() && LocalDateTime.now().isAfter(auctionPaymentDeadline);
    }

    private Double rentalFees;

    private void validateUsers() {
        // Check tenant has TENANT role
        if (tenant != null) {
            if (tenant.getRoles() == null || !tenant.getRoles().contains(Role.TENANT)) {
                throw new IllegalStateException("Rental can only be associated with a user with TENANT role");
            }
        }
        
        // Check if apartment owner has OWNER role
        if (apartment != null && apartment.getOwner() != null) {
            User owner = apartment.getOwner();
            if (owner.getRoles() == null || !owner.getRoles().contains(Role.OWNER)) {
                throw new IllegalStateException("Apartment owner must have OWNER role");
            }
        }
        
        // Check dates are valid
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalStateException("End date cannot be before start date");
        }
        
        // Check tenant is not the owner of the apartment
        if (tenant != null && apartment != null && apartment.getOwner() != null && 
            tenant.getId() != null && tenant.getId().equals(apartment.getOwner().getId())) {
            throw new IllegalStateException("Owner cannot rent their own apartment");
        }
    }


    private void calculateTotalCost() {
        if (isAuction) {
            return;
        }
        
        if (apartment != null && startDate != null && endDate != null) {
            // Calculate nights as the difference between dates (not adding 1)
            long nights = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
            
            // Base price is rental price per night multiplied by number of nights
            double baseCost = apartment.getRentalPrice() * nights;
            
            // Add any additional rental fees
            double totalFees = (rentalFees != null) ? rentalFees : 0.0;
            
            this.totalCost = baseCost + totalFees;
        }
    }

    //fo r JPA lifecycle events
    // These methods will be called before the entity is persisted or updated in the database
    @PrePersist
    @PreUpdate
    private void validateAndCalculate() {
        validateUsers();
        calculateTotalCost();
    }
}