package pl.ug.NestPoint.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.ug.NestPoint.domain.enums.AuctionStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionStatusMessage {
    private Long auctionId;
    private AuctionStatus status;
    private LocalDateTime timestamp;
    private String message;
    private Long winningBidderId;
    private double winningBidAmount;
    private int remainingBidders;
    private long timeRemainingSeconds;
    private int activeObservers; 
}