package pl.ug.NestPoint.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionBidMessage {
    private Long auctionId;
    private Long bidderId;
    private String bidderUsername;
    private double bidAmount;
    private LocalDateTime bidTime;
    private boolean isWinningBid;
}