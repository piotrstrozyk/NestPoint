package pl.ug.NestPoint.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BidDTO {
    private Long id;
    private Long auctionId;
    private Long bidderId;
    private String bidderUsername;
    private double amount;
    private LocalDateTime bidTime;
    private boolean isAutoBid;
    private double maxAutoBidAmount;
}