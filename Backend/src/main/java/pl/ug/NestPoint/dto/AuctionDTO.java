package pl.ug.NestPoint.dto;

import lombok.Data;
import pl.ug.NestPoint.domain.enums.AuctionStatus;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Data
public class AuctionDTO {
    private Long id;
    private Long apartmentId;
    private String apartmentTitle;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private double startingPrice;
    private double minimumBidIncrement;
    private LocalDate rentalStartDate;
    private LocalDate rentalEndDate;
    private AuctionStatus status;
    private int maxBidders;
    private double currentHighestBid;
    private int currentBidderCount;
    private List<BidDTO> bids;
    private Long resultingRentalId;
    private boolean active;
}