package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;
import jakarta.validation.constraints.*;

import pl.ug.NestPoint.domain.enums.Role;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auction_id")
    private Auction auction;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bidder_id")
    private User bidder;
    
    @DecimalMin(value = "0.0", message = "Bid amount must be positive")
    private double amount;
    
    private LocalDateTime bidTime;
    
    private boolean isAutoBid;

    @Column(nullable = false)
    @Builder.Default
    private boolean dropped = false;
    
    @DecimalMin(value = "0.0", message = "Maximum auto bid amount must be positive")
    private double maxAutoBidAmount;
    
    @PrePersist
    @PreUpdate
    private void validateBid() {
        if (auction != null) {
            double minimumBid = auction.getCurrentHighestBid() + auction.getMinimumBidIncrement();
            if (amount < minimumBid) {
                throw new IllegalStateException("Bid amount must be at least " + minimumBid);
            }
            
            if (!auction.isActive()) {
                throw new IllegalStateException("Cannot place bid on inactive auction");
            }
            
            if (bidder != null && !bidder.getRoles().contains(Role.TENANT)) {
                throw new IllegalStateException("Only tenants can place bids");
            }
        }
    }
}