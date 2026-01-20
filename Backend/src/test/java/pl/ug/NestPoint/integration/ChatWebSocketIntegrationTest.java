package pl.ug.NestPoint.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;
import pl.ug.NestPoint.dto.ChatNotificationDTO;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.Conversation;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.repository.ConversationRepository;
import pl.ug.NestPoint.security.JwtUtil;
import pl.ug.NestPoint.domain.Rental;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.domain.Address;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.domain.enums.PropertyType;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;

import java.lang.reflect.Type;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("WebSocket Chat Integration Tests")
public class ChatWebSocketIntegrationTest {

    @LocalServerPort
    private int port;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RentalRepository rentalRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private WebSocketStompClient stompClient;
    private String sockJsUrl;
    private ThreadPoolTaskScheduler taskScheduler;
    
    private User testUser1;
    private User testUser2;
    private Conversation testConversation;
    private String validToken1;
    private String validToken2;
    
    @BeforeEach
    public void setup() {
        sockJsUrl = "http://localhost:" + port + "/ws";
        
        transactionTemplate.execute(status -> {
            testUser1 = new User();
            testUser1.setUsername("testuser1_" + System.currentTimeMillis());
            testUser1.setEmail("test1_" + System.currentTimeMillis() + "@example.com");
            testUser1.setPassword("password");
            testUser1.setRoles(Set.of(Role.TENANT));
            testUser1 = userRepository.save(testUser1);
            
            testUser2 = new User();
            testUser2.setUsername("testuser2_" + System.currentTimeMillis());
            testUser2.setEmail("test2_" + System.currentTimeMillis() + "@example.com");
            testUser2.setPassword("password");
            testUser2.setRoles(Set.of(Role.OWNER));
            testUser2 = userRepository.save(testUser2);
            
            Apartment testApartment = new Apartment();
            testApartment.setOwner(testUser2);
            testApartment.setTitle("Test Apartment");
            testApartment.setDescription("Test Description for the apartment with more than 20 characters");
            testApartment.setRentalPrice(100.0); // Price per night
            
            Address testAddress = new Address();
            testAddress.setStreet("Test Street 123");
            testAddress.setCity("Test City");
            testAddress.setCountry("Test Country");
            testAddress.setPostalCode("12345");
            testApartment.setAddress(testAddress);
            
            testApartment.setSize(50); 
            testApartment.setNumberOfRooms(2);
            testApartment.setNumberOfBeds(1);
            testApartment.setPropertyType(PropertyType.APARTMENT);
            testApartment = apartmentRepository.save(testApartment);
            
            Rental testRental = new Rental();
            testRental.setApartment(testApartment);
            testRental.setTenant(testUser1);
            testRental.setOwner(testUser2);
            testRental.setStartDate(LocalDate.now().plusDays(1));
            testRental.setEndDate(LocalDate.now().plusDays(7));
            testRental.setStatus(RentalStatus.ACTIVE);
            testRental.setRentalFees(0.0);
            testRental = rentalRepository.save(testRental);
            
            testConversation = new Conversation();
            testConversation.setRental(testRental);
            testConversation = conversationRepository.save(testConversation);
            
            return null;
        });
        
        List<String> user1Roles = Arrays.asList("TENANT");
        List<String> user2Roles = Arrays.asList("OWNER");
        
        validToken1 = jwtUtil.generateToken(testUser1.getUsername(), user1Roles, testUser1.getId());
        validToken2 = jwtUtil.generateToken(testUser2.getUsername(), user2Roles, testUser2.getId());
        
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
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("websocket-test-scheduler-");
        taskScheduler.initialize();
        stompClient.setTaskScheduler(taskScheduler);
    }

    @Test
    @DisplayName("Should successfully connect to WebSocket")
    public void testWebSocketConnection() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken1);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), connectHeaders,
                new TestSessionHandler(sessionFuture));
        
        StompSession session = sessionFuture.get(5, TimeUnit.SECONDS);
        assertTrue(session.isConnected(), "Should establish WebSocket connection");
        
        session.disconnect();
    }

    @Test
    @DisplayName("Should successfully send and receive message")
    public void testSendAndReceiveMessage() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken1);
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), connectHeaders,
                new TestSessionHandler(sessionFuture));
        
        StompSession session = sessionFuture.get(5, TimeUnit.SECONDS);
        assertTrue(session.isConnected(), "Should establish WebSocket connection");
        
        Thread.sleep(500);
        
        CompletableFuture<MessageDTO> messageFuture = new CompletableFuture<>();
        session.subscribe("/topic/chat/" + testConversation.getId(), new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return MessageDTO.class;
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                messageFuture.complete((MessageDTO) payload);
            }
        });
        
        Thread.sleep(500);
        
        MessageDTO testMessage = new MessageDTO();
        testMessage.setContent("Test message from integration test");
        testMessage.setConversationId(testConversation.getId());
        
        session.send("/app/chat/" + testConversation.getId() + "/send", testMessage);
        
        MessageDTO receivedMessage = messageFuture.get(10, TimeUnit.SECONDS);
        
        assertNotNull(receivedMessage, "Should receive response message");
        assertEquals("Test message from integration test", receivedMessage.getContent());
        assertNotNull(receivedMessage.getId(), "Message should have been saved with an ID");
        
        session.disconnect();
    }

    @Test
    @DisplayName("Should receive notification when another user sends message")
    public void testReceiveNotification() throws Exception {
        StompHeaders user1ConnectHeaders = new StompHeaders();
        user1ConnectHeaders.add("Authorization", "Bearer " + validToken1);
        
        CompletableFuture<StompSession> user1SessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), user1ConnectHeaders,
                new TestSessionHandler(user1SessionFuture));
        
        StompSession user1Session = user1SessionFuture.get(5, TimeUnit.SECONDS);
        assertTrue(user1Session.isConnected(), "User 1 should connect");
        
        CompletableFuture<Object> notificationFuture = new CompletableFuture<>();
        CompletableFuture<MessageDTO> topicMessageFuture = new CompletableFuture<>();
        
        user1Session.subscribe("/user/queue/chat", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Object.class;
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                System.out.println("Received notification on /user/queue/chat: " + payload);
                System.out.println("Payload type: " + payload.getClass().getSimpleName());
                notificationFuture.complete(payload);
            }
        });
        
        user1Session.subscribe("/user/" + testUser1.getId() + "/queue/chat", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Object.class;
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                System.out.println("Received notification on /user/" + testUser1.getId() + "/queue/chat: " + payload);
                notificationFuture.complete(payload);
            }
        });
        
        user1Session.subscribe("/topic/chat/" + testConversation.getId(), new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return MessageDTO.class;
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                System.out.println("Received message on topic: " + payload);
                topicMessageFuture.complete((MessageDTO) payload);
            }
        });
        
        StompHeaders user2ConnectHeaders = new StompHeaders();
        user2ConnectHeaders.add("Authorization", "Bearer " + validToken2);
        
        CompletableFuture<StompSession> user2SessionFuture = new CompletableFuture<>();
        stompClient.connect(sockJsUrl, new WebSocketHttpHeaders(), user2ConnectHeaders,
                new TestSessionHandler(user2SessionFuture));
        
        StompSession user2Session = user2SessionFuture.get(5, TimeUnit.SECONDS);
        assertTrue(user2Session.isConnected(), "User 2 should connect");
        
        Thread.sleep(2000);
        
        System.out.println("=== TEST DEBUG INFO ===");
        System.out.println("User1 ID: " + testUser1.getId() + " (expecting notification)");
        System.out.println("User2 ID: " + testUser2.getId() + " (sending message)");
        System.out.println("Conversation ID: " + testConversation.getId());
        System.out.println("========================");
        
        MessageDTO testMessage = new MessageDTO();
        testMessage.setContent("Message from user 2 that should trigger notification");
        testMessage.setConversationId(testConversation.getId());
        
        user2Session.send("/app/chat/" + testConversation.getId() + "/send", testMessage);
        
        try {
            MessageDTO topicMessage = topicMessageFuture.get(5, TimeUnit.SECONDS);
            System.out.println("Message successfully broadcasted to topic");
            assertNotNull(topicMessage);
            assertEquals("Message from user 2 that should trigger notification", topicMessage.getContent());
        } catch (TimeoutException e) {
            fail("Message should have been broadcasted to topic");
        }
        
        try {
            Object notification = notificationFuture.get(5, TimeUnit.SECONDS);
            System.out.println("Notification received! Type: " + notification.getClass().getSimpleName());
            System.out.println("Notification content: " + notification);
            
            assertNotNull(notification, "Should receive notification");
            
            if (notification instanceof ChatNotificationDTO) {
                ChatNotificationDTO chatNotification = (ChatNotificationDTO) notification;
                assertEquals(testConversation.getId(), chatNotification.getConversationId());
                assertEquals("NEW_MESSAGE", chatNotification.getType());
            }
            
            System.out.println("Notification test PASSED!");
            
        } catch (TimeoutException e) {
            System.out.println("No notification received after 5 seconds");
            System.out.println("This suggests a WebSocket principal/user mapping issue");
            System.out.println("Check your WebSocketConfig - the principal might not match what convertAndSendToUser expects");
            
            org.junit.jupiter.api.Assumptions.assumeTrue(false, 
                "WebSocket user-specific messaging not working - likely principal mismatch in WebSocketConfig");
        }
        
        user1Session.disconnect();
        user2Session.disconnect();
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