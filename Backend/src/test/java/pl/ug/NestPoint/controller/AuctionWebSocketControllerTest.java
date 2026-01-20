package pl.ug.NestPoint.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.dto.websocket.AuctionBidMessage;
import pl.ug.NestPoint.dto.websocket.AuctionJoinMessage;
import pl.ug.NestPoint.dto.websocket.AuctionLeaveMessage;
import pl.ug.NestPoint.service.AuctionService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Auction WebSocket Controller Unit Tests")
public class AuctionWebSocketControllerTest {
    
    @Mock
    private AuctionService auctionService;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @InjectMocks
    private AuctionWebSocketController controller;
    
    private AuctionBidMessage bidMessage;
    private AuctionJoinMessage joinMessage;
    private AuctionLeaveMessage leaveMessage;
    private Long auctionId;
    
    @BeforeEach
    void setUp() {
        auctionId = 1L;
        
        // Setup bid message
        bidMessage = new AuctionBidMessage();
        bidMessage.setBidderId(10L);
        bidMessage.setBidAmount(1500.0);
        
        // Setup join message
        joinMessage = new AuctionJoinMessage();
        joinMessage.setUserId(10L);
        
        // Setup leave message
        leaveMessage = new AuctionLeaveMessage();
        leaveMessage.setUserId(10L);
    }
    
    @Test
    @DisplayName("Should place bid when received through WebSocket")
    void shouldPlaceBid() {
        // When
        controller.placeBid(auctionId, bidMessage);
        
        // Then
        ArgumentCaptor<BidDTO> bidCaptor = ArgumentCaptor.forClass(BidDTO.class);
        verify(auctionService).placeBid(bidCaptor.capture());
        
        BidDTO capturedBid = bidCaptor.getValue();
        assertEquals(auctionId, capturedBid.getAuctionId());
        assertEquals(10L, capturedBid.getBidderId());
        assertEquals(1500.0, capturedBid.getAmount());
    }
    
    @Test
    @DisplayName("Should add user to auction when join message received")
    void shouldJoinAuction() {
        // When
        controller.joinAuction(auctionId, joinMessage);
        
        // Then
        verify(auctionService).addUserToAuction(auctionId, 10L);
    }
    
    @Test
    @DisplayName("Should remove user from auction when leave message received")
    void shouldLeaveAuction() {
        // When
        controller.leaveAuction(auctionId, leaveMessage);
        
        // Then
        verify(auctionService).removeUserFromAuction(auctionId, 10L);
    }
    
    @Test
    @DisplayName("Should handle multiple bids for same auction")
    void shouldHandleMultipleBids() {
        // Given
        AuctionBidMessage firstBid = new AuctionBidMessage();
        firstBid.setBidderId(10L);
        firstBid.setBidAmount(1500.0);
        
        AuctionBidMessage secondBid = new AuctionBidMessage();
        secondBid.setBidderId(20L);
        secondBid.setBidAmount(1600.0);
        
        // When
        controller.placeBid(auctionId, firstBid);
        controller.placeBid(auctionId, secondBid);
        
        // Then
        verify(auctionService, times(2)).placeBid(any(BidDTO.class));
        
        ArgumentCaptor<BidDTO> bidCaptor = ArgumentCaptor.forClass(BidDTO.class);
        verify(auctionService, times(2)).placeBid(bidCaptor.capture());
        
        var capturedBids = bidCaptor.getAllValues();
        assertEquals(1500.0, capturedBids.get(0).getAmount());
        assertEquals(1600.0, capturedBids.get(1).getAmount());
        assertEquals(10L, capturedBids.get(0).getBidderId());
        assertEquals(20L, capturedBids.get(1).getBidderId());
    }
    
    @Test
    @DisplayName("Should handle user joining and leaving auction")
    void shouldHandleJoinAndLeave() {
        // When
        controller.joinAuction(auctionId, joinMessage);
        controller.leaveAuction(auctionId, leaveMessage);
        
        // Then
        verify(auctionService).addUserToAuction(auctionId, 10L);
        verify(auctionService).removeUserFromAuction(auctionId, 10L);
    }
    
    @Test
    @DisplayName("Should handle different auction IDs correctly")
    void shouldHandleDifferentAuctionIds() {
        // Given
        Long auctionId1 = 1L;
        Long auctionId2 = 2L;
        
        AuctionJoinMessage join1 = new AuctionJoinMessage();
        join1.setUserId(10L);
        
        AuctionJoinMessage join2 = new AuctionJoinMessage();
        join2.setUserId(20L);
        
        // When
        controller.joinAuction(auctionId1, join1);
        controller.joinAuction(auctionId2, join2);
        
        // Then
        verify(auctionService).addUserToAuction(auctionId1, 10L);
        verify(auctionService).addUserToAuction(auctionId2, 20L);
    }
    
    @Test
    @DisplayName("Should create BidDTO with correct values from bid message")
    void shouldCreateBidDTOCorrectly() {
        // Given
        AuctionBidMessage complexBidMessage = new AuctionBidMessage();
        complexBidMessage.setBidderId(999L);
        complexBidMessage.setBidAmount(25000.50);
        
        Long complexAuctionId = 12345L;
        
        // When
        controller.placeBid(complexAuctionId, complexBidMessage);
        
        // Then
        ArgumentCaptor<BidDTO> bidCaptor = ArgumentCaptor.forClass(BidDTO.class);
        verify(auctionService).placeBid(bidCaptor.capture());
        
        BidDTO result = bidCaptor.getValue();
        assertEquals(complexAuctionId, result.getAuctionId());
        assertEquals(999L, result.getBidderId());
        assertEquals(25000.50, result.getAmount());
    }
    
    @Test
    @DisplayName("Should not fail when service methods are called")
    void shouldNotFailWhenServiceMethodsAreCalled() {
        // Given - mock return values instead of doNothing() for non-void methods
        when(auctionService.placeBid(any(BidDTO.class))).thenReturn(null); // or appropriate return type
        doNothing().when(auctionService).addUserToAuction(any(), any());
        doNothing().when(auctionService).removeUserFromAuction(any(), any());
        
        // When & Then - should not throw exceptions
        controller.placeBid(auctionId, bidMessage);
        controller.joinAuction(auctionId, joinMessage);
        controller.leaveAuction(auctionId, leaveMessage);
        
        // Verify all methods were called
        verify(auctionService).placeBid(any(BidDTO.class));
        verify(auctionService).addUserToAuction(auctionId, 10L);
        verify(auctionService).removeUserFromAuction(auctionId, 10L);
    }
}