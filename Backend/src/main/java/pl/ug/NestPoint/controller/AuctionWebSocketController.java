package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.dto.websocket.AuctionBidMessage;
import pl.ug.NestPoint.dto.websocket.AuctionJoinMessage;
import pl.ug.NestPoint.dto.websocket.AuctionLeaveMessage;
import pl.ug.NestPoint.service.AuctionService;

@Controller
@RequiredArgsConstructor
public class AuctionWebSocketController {

    private final AuctionService auctionService;

    @MessageMapping("/auction/{auctionId}/bid")
    public void placeBid(@DestinationVariable Long auctionId, @Payload AuctionBidMessage bidMessage) {
        BidDTO bidDTO = new BidDTO();
        bidDTO.setAuctionId(auctionId);
        bidDTO.setBidderId(bidMessage.getBidderId());
        bidDTO.setAmount(bidMessage.getBidAmount());
        
        auctionService.placeBid(bidDTO);
    }

    @MessageMapping("/auction/{auctionId}/join")
    public void joinAuction(@DestinationVariable Long auctionId, @Payload AuctionJoinMessage joinMessage) {
        auctionService.addUserToAuction(auctionId, joinMessage.getUserId());
    }

    @MessageMapping("/auction/{auctionId}/leave") 
    public void leaveAuction(@DestinationVariable Long auctionId, @Payload AuctionLeaveMessage leaveMessage) {
        auctionService.removeUserFromAuction(auctionId, leaveMessage.getUserId());
    }
}