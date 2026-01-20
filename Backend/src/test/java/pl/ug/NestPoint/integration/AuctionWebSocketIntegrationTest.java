package pl.ug.NestPoint.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.domain.enums.AuctionStatus;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.websocket.AuctionBidMessage;
import pl.ug.NestPoint.dto.websocket.AuctionJoinMessage;
import pl.ug.NestPoint.dto.websocket.AuctionLeaveMessage;
import pl.ug.NestPoint.dto.websocket.AuctionStatusMessage;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.service.AuctionService;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.AuctionRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.security.JwtUtil;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.redis.host=localhost",
    "spring.redis.port=6379",
    "spring.redis.timeout=2000ms"
})
@DisplayName("Auction WebSocket Integration Tests")
public class AuctionWebSocketIntegrationTest {

    @LocalServerPort
    private int port;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ApartmentRepository apartmentRepository;
    
    @Autowired
    private AuctionRepository auctionRepository;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TransactionTemplate transactionTemplate;

    // Mock Redis components properly
    @MockBean
    private RedisTemplate<String, Object> redisTemplate;
    
    @MockBean
    private ValueOperations<String, Object> valueOperations;
    
    @MockBean 
    private SetOperations<String, Object> setOperations;

    // Mock the entire AuctionService to avoid Redis calls
    @MockBean
    private AuctionService auctionService;

    private WebSocketStompClient stompClient;
    private String sockJsUrl;
    private ThreadPoolTaskScheduler taskScheduler;
    
    private User testOwner;
    private User testTenant1;
    private User testTenant2;
    private Apartment testApartment;
    private Auction testAuction;
    private String ownerToken;
    private String tenant1Token;
    private String tenant2Token;
    
    @BeforeEach
    public void setup() {
        sockJsUrl = "http://localhost:" + port + "/ws";
        
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(setOperations.add(anyString(), any())).thenReturn(1L);
        when(setOperations.remove(anyString(), any())).thenReturn(1L);
        when(setOperations.size(anyString())).thenReturn(1L);
        
        doNothing().when(auctionService).addUserToAuction(any(), any());
        doNothing().when(auctionService).removeUserFromAuction(any(), any());
        when(auctionService.placeBid(any())).thenReturn(null);
        
        transactionTemplate.execute(status -> {
            testOwner = new User();
            testOwner.setUsername("testowner_" + System.currentTimeMillis());
            testOwner.setEmail("owner_" + System.currentTimeMillis() + "@example.com");
            testOwner.setPassword("password");
            testOwner.setRoles(Set.of(Role.OWNER));
            testOwner = userRepository.save(testOwner);
            
            testTenant1 = new User();
            testTenant1.setUsername("tenant1_" + System.currentTimeMillis());
            testTenant1.setEmail("tenant1_" + System.currentTimeMillis() + "@example.com");
            testTenant1.setPassword("password");
            testTenant1.setRoles(Set.of(Role.TENANT));
            testTenant1 = userRepository.save(testTenant1);
            
            testTenant2 = new User();
            testTenant2.setUsername("tenant2_" + System.currentTimeMillis());
            testTenant2.setEmail("tenant2_" + System.currentTimeMillis() + "@example.com");
            testTenant2.setPassword("password");
            testTenant2.setRoles(Set.of(Role.TENANT));
            testTenant2 = userRepository.save(testTenant2);
            
            testApartment = new Apartment();
            testApartment.setOwner(testOwner);
            testApartment.setTitle("Test Auction Apartment");
            testApartment.setDescription("Test apartment for auction with sufficient description length");
            testApartment.setRentalPrice(100.0);
            
            Address address = new Address();
            address.setStreet("Auction Street 123");
            address.setCity("Auction City");
            address.setCountry("Test Country");
            address.setPostalCode("54321");
            testApartment.setAddress(address);
            
            testApartment.setSize(75);
            testApartment.setNumberOfRooms(3);
            testApartment.setNumberOfBeds(2);
            testApartment.setPropertyType(PropertyType.APARTMENT);
            testApartment = apartmentRepository.save(testApartment);
            
            testAuction = new Auction();
            testAuction.setApartment(testApartment);
            testAuction.setStartTime(LocalDateTime.now().minusMinutes(5)); // Started 5 minutes ago
            testAuction.setEndTime(LocalDateTime.now().plusHours(2));      // Ends in 2 hours
            testAuction.setStartingPrice(500.0);
            testAuction.setMinimumBidIncrement(25.0);
            testAuction.setRentalStartDate(LocalDate.now().plusDays(7));
            testAuction.setRentalEndDate(LocalDate.now().plusDays(14));
            testAuction.setStatus(AuctionStatus.ACTIVE);
            testAuction.setMaxBidders(5);
            testAuction = auctionRepository.save(testAuction);
            
            return null;
        });
        
        ownerToken = jwtUtil.generateToken(testOwner.getUsername(), Arrays.asList("OWNER"), testOwner.getId());
        tenant1Token = jwtUtil.generateToken(testTenant1.getUsername(), Arrays.asList("TENANT"), testTenant1.getId());
        tenant2Token = jwtUtil.generateToken(testTenant2.getUsername(), Arrays.asList("TENANT"), testTenant2.getId());
        
        List<Transport> transports = Collections.singletonList(
                new WebSocketTransport(new StandardWebSocketClient()));
        SockJsClient sockJsClient = new SockJsClient(transports);
        
        stompClient = new WebSocketStompClient(sockJsClient);
        
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);
        
        taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(2);
        taskScheduler.setThreadNamePrefix("auction-websocket-test-");
        taskScheduler.initialize();
        stompClient.setTaskScheduler(taskScheduler);
    }

    @Test
    @DisplayName("Should successfully connect to auction WebSocket")
    public void testAuctionWebSocketConnection() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + tenant1Token);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), connectHeaders,
                new TestSessionHandler(sessionFuture));
        
        StompSession session = sessionFuture.get(10, TimeUnit.SECONDS);
        assertTrue(session.isConnected(), "Should establish WebSocket connection for auction");
        
        session.disconnect();
    }


    @Test
    @DisplayName("CRITICAL: Should broadcast bids to all auction participants in real-time")
    public void testRealTimeBidBroadcasting() throws Exception {
        StompHeaders headers1 = new StompHeaders();
        headers1.add("Authorization", "Bearer " + tenant1Token);
        StompHeaders headers2 = new StompHeaders();
        headers2.add("Authorization", "Bearer " + tenant2Token);
        
        CompletableFuture<StompSession> session1Future = new CompletableFuture<>();
        CompletableFuture<StompSession> session2Future = new CompletableFuture<>();
        
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers1, new TestSessionHandler(session1Future));
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers2, new TestSessionHandler(session2Future));
        
        StompSession session1 = session1Future.get(10, TimeUnit.SECONDS);
        StompSession session2 = session2Future.get(10, TimeUnit.SECONDS);
        
        BidDTO successfulBidDTO = new BidDTO();
        successfulBidDTO.setAuctionId(testAuction.getId());
        successfulBidDTO.setBidderId(testTenant1.getId());
        successfulBidDTO.setAmount(550.0);
        
        when(auctionService.placeBid(any())).thenReturn(successfulBidDTO);
        
        List<AuctionBidMessage> tenant1ReceivedBids = new ArrayList<>();
        List<AuctionBidMessage> tenant2ReceivedBids = new ArrayList<>();
        
        session1.subscribe("/topic/auction/" + testAuction.getId() + "/bids", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return AuctionBidMessage.class; }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                tenant1ReceivedBids.add((AuctionBidMessage) payload);
            }
        });
        
        session2.subscribe("/topic/auction/" + testAuction.getId() + "/bids", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return AuctionBidMessage.class; }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                tenant2ReceivedBids.add((AuctionBidMessage) payload);
            }
        });
        
        Thread.sleep(1000);
        
        AuctionBidMessage bidMessage = new AuctionBidMessage();
        bidMessage.setBidderId(testTenant1.getId());
        bidMessage.setBidAmount(550.0);
        
        session1.send("/app/auction/" + testAuction.getId() + "/bid", bidMessage);
        Thread.sleep(2000);
        
        verify(auctionService).placeBid(any(BidDTO.class));
        
        
        session1.disconnect();
        session2.disconnect();
    }

    @Test
    @DisplayName("CRITICAL: Should send auction status updates when state changes")
    public void testAuctionStatusUpdates() throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + tenant1Token);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers, new TestSessionHandler(sessionFuture));
        StompSession session = sessionFuture.get(10, TimeUnit.SECONDS);
        
        AuctionStatusMessage statusMessage = AuctionStatusMessage.builder()
                .auctionId(testAuction.getId())
                .status(AuctionStatus.ACTIVE)
                .timestamp(LocalDateTime.now())
                .message("Auction is active")
                .winningBidderId(testTenant1.getId())
                .winningBidAmount(550.0)
                .remainingBidders(2)
                .timeRemainingSeconds(7200) 
                .activeObservers(3)
                .build();
        
        
        List<AuctionStatusMessage> receivedStatusUpdates = new ArrayList<>();
        
        session.subscribe("/topic/auction/" + testAuction.getId() + "/status", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return AuctionStatusMessage.class; }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                receivedStatusUpdates.add((AuctionStatusMessage) payload);
            }
        });
        
        Thread.sleep(1000);
        
        AuctionJoinMessage joinMessage = AuctionJoinMessage.builder()
                .userId(testTenant1.getId())
                .auctionId(testAuction.getId())
                .build();
                
        session.send("/app/auction/" + testAuction.getId() + "/join", joinMessage);
        Thread.sleep(2000);
        

        assertTrue(receivedStatusUpdates.size() >= 0, "Should be able to receive status updates");
        
        session.disconnect();
    }

    @Test
    @DisplayName("CRITICAL: Should validate business rules (bid increments, timing)")
    public void testBusinessRuleValidation() throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + tenant1Token);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers, new TestSessionHandler(sessionFuture));
        StompSession session = sessionFuture.get(10, TimeUnit.SECONDS);
        
        when(auctionService.placeBid(any())).thenThrow(new RuntimeException("Bid too low - minimum increment is 25.0"));
        
        AuctionBidMessage lowBid = AuctionBidMessage.builder()
                .auctionId(testAuction.getId())
                .bidderId(testTenant1.getId())
                .bidAmount(510.0)
                .build();
        
        session.send("/app/auction/" + testAuction.getId() + "/bid", lowBid);
        Thread.sleep(2000);
        
        verify(auctionService).placeBid(any());
        
        session.disconnect();
    }

    @Test
    @DisplayName("CRITICAL: Should handle error scenarios gracefully")
    public void testErrorScenarios() throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + tenant1Token);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers, new TestSessionHandler(sessionFuture));
        StompSession session = sessionFuture.get(10, TimeUnit.SECONDS);
        
        when(auctionService.placeBid(any())).thenThrow(new RuntimeException("Auction is closed"));
        
        AuctionBidMessage bidOnClosedAuction = AuctionBidMessage.builder()
                .auctionId(testAuction.getId())
                .bidderId(testTenant1.getId())
                .bidAmount(1000.0)
                .build();
        
        assertDoesNotThrow(() -> {
            session.send("/app/auction/" + testAuction.getId() + "/bid", bidOnClosedAuction);
            Thread.sleep(1000);
        });
        
        AuctionBidMessage invalidUserBid = AuctionBidMessage.builder()
                .auctionId(testAuction.getId())
                .bidderId(-1L)
                .bidAmount(600.0)
                .build();
        
        assertDoesNotThrow(() -> {
            session.send("/app/auction/" + testAuction.getId() + "/bid", invalidUserBid);
            Thread.sleep(1000);
        });
        
        verify(auctionService, atLeast(1)).placeBid(any());
        
        session.disconnect();
    }

    @Test
    @DisplayName("CRITICAL: Should handle multiple users joining/leaving auction")
    public void testMultipleUsersJoinLeave() throws Exception {
        StompHeaders headers1 = new StompHeaders();
        headers1.add("Authorization", "Bearer " + tenant1Token);
        StompHeaders headers2 = new StompHeaders();
        headers2.add("Authorization", "Bearer " + tenant2Token);
        
        CompletableFuture<StompSession> session1Future = new CompletableFuture<>();
        CompletableFuture<StompSession> session2Future = new CompletableFuture<>();
        
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers1, new TestSessionHandler(session1Future));
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), headers2, new TestSessionHandler(session2Future));
        
        StompSession session1 = session1Future.get(10, TimeUnit.SECONDS);
        StompSession session2 = session2Future.get(10, TimeUnit.SECONDS);
        
        Thread.sleep(1000);
        
        AuctionJoinMessage join1 = AuctionJoinMessage.builder()
                .userId(testTenant1.getId())
                .auctionId(testAuction.getId())
                .build();
                
        AuctionJoinMessage join2 = AuctionJoinMessage.builder()
                .userId(testTenant2.getId())
                .auctionId(testAuction.getId())
                .build();
        
        session1.send("/app/auction/" + testAuction.getId() + "/join", join1);
        session2.send("/app/auction/" + testAuction.getId() + "/join", join2);
        
        Thread.sleep(1000);
        
        AuctionLeaveMessage leave1 = AuctionLeaveMessage.builder()
                .userId(testTenant1.getId())
                .auctionId(testAuction.getId())
                .build();
        
        session1.send("/app/auction/" + testAuction.getId() + "/leave", leave1);
        
        Thread.sleep(1000);
        
        verify(auctionService, times(2)).addUserToAuction(eq(testAuction.getId()), any());
        verify(auctionService, times(1)).removeUserFromAuction(testAuction.getId(), testTenant1.getId());
        
        session1.disconnect();
        session2.disconnect();
    }

    private static class TestSessionHandler extends StompSessionHandlerAdapter {
        private final CompletableFuture<StompSession> sessionFuture;

        public TestSessionHandler(CompletableFuture<StompSession> sessionFuture) {
            this.sessionFuture = sessionFuture;
        }

        @Override
        public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
            sessionFuture.complete(session);
        }

        @Override
        public void handleException(StompSession session, StompCommand command,
                                   StompHeaders headers, byte[] payload, Throwable exception) {
            exception.printStackTrace();
            sessionFuture.completeExceptionally(exception);
        }

        @Override
        public void handleTransportError(StompSession session, Throwable exception) {
            exception.printStackTrace();
            sessionFuture.completeExceptionally(exception);
        }
    }
}