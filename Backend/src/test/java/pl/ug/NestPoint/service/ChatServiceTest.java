package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.dto.ChatNotificationDTO;
import pl.ug.NestPoint.dto.ConversationDTO;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.dto.UserDTO;
import pl.ug.NestPoint.mapper.ConversationMapper;
import pl.ug.NestPoint.mapper.MessageMapper;
import pl.ug.NestPoint.repository.ConversationRepository;
import pl.ug.NestPoint.repository.MessageRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Chat Service Tests")
public class ChatServiceTest {

    @Mock
    private ConversationRepository conversationRepository;
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private RentalRepository rentalRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ConversationMapper conversationMapper;
    
    @Mock
    private MessageMapper messageMapper;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @InjectMocks
    private ChatService chatService;
    
    private User tenant;
    private User owner;
    private Apartment apartment;
    private Rental rental;
    private Conversation conversation;
    private Message message;
    private ConversationDTO conversationDTO;
    private MessageDTO messageDTO;
    private LocalDateTime now;
    
    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        
        tenant = new User();
        tenant.setId(1L);
        tenant.setFirstName("John");
        tenant.setLastName("Tenant");
        
        owner = new User();
        owner.setId(2L);
        owner.setFirstName("Mary");
        owner.setLastName("Owner");
        
        apartment = new Apartment();
        apartment.setId(1L);
        apartment.setTitle("Test Apartment");
        apartment.setOwner(owner);
        
        rental = new Rental();
        rental.setId(1L);
        rental.setApartment(apartment);
        rental.setTenant(tenant);
        rental.setOwner(owner);
        
        conversation = new Conversation();
        conversation.setId(1L);
        conversation.setRental(rental);
        conversation.setActive(true);
        conversation.setMessages(new ArrayList<>());
        
        message = new Message();
        message.setId(1L);
        message.setContent("Hello, is the apartment still available?");
        message.setSender(tenant);
        message.setConversation(conversation);
        message.setTimestamp(now);
        message.setRead(false);
        
        conversation.getMessages().add(message);
        
        messageDTO = new MessageDTO();
        messageDTO.setId(1L);
        messageDTO.setConversationId(1L);
        messageDTO.setSenderId(1L);
        messageDTO.setSenderName("John Tenant");
        messageDTO.setContent("Hello, is the apartment still available?");
        messageDTO.setTimestamp(now);
        messageDTO.setRead(false);
        
        conversationDTO = new ConversationDTO();
        conversationDTO.setId(1L);
        conversationDTO.setRentalId(1L);
        conversationDTO.setApartmentTitle("Test Apartment");
        conversationDTO.setActive(true);
        conversationDTO.setCreatedAt(now);
        
        conversationDTO.setLastMessage(messageDTO);
        conversationDTO.setUnreadCount(0);
    }

    @Test
    @DisplayName("Should get or create conversation")
    void shouldGetOrCreateConversation() {
        // Arrange
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(rental));
        when(conversationRepository.findByRentalId(1L)).thenReturn(Optional.of(conversation));
        when(conversationMapper.toDTO(conversation)).thenReturn(conversationDTO);
        when(messageRepository.countUnreadMessagesInConversation(1L, 1L)).thenReturn(0L);
        when(messageMapper.toDTO(message)).thenReturn(messageDTO);
        // Act
        ConversationDTO result = chatService.getOrCreateConversation(1L, 1L);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Apartment", result.getApartmentTitle());
        assertTrue(result.isActive());
        assertEquals(now, result.getCreatedAt());
        assertEquals(0L, result.getUnreadCount());
        assertEquals(messageDTO, result.getLastMessage());
        
        verify(conversationRepository).findByRentalId(1L);
        verify(conversationRepository, never()).save(any(Conversation.class));
    }
    
    @Test
    @DisplayName("Should create new conversation when it doesn't exist")
    void shouldCreateNewConversation() {
        // Arrange
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(rental));
        when(conversationRepository.findByRentalId(1L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(conversationMapper.toDTO(conversation)).thenReturn(conversationDTO);
        when(messageMapper.toDTO(message)).thenReturn(messageDTO);
        
        // Act
        ConversationDTO result = chatService.getOrCreateConversation(1L, 1L);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Apartment", result.getApartmentTitle());
        verify(conversationRepository).findByRentalId(1L);
        verify(conversationRepository).save(any(Conversation.class));
    }
    
    @Test
    @DisplayName("Should throw exception when getting conversation with invalid user")
    void shouldThrowExceptionWhenGettingConversationWithInvalidUser() {
        // Arrange
        User otherUser = new User();
        otherUser.setId(3L);
        
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(rental));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.getOrCreateConversation(1L, 3L);
        });
    }
    
    @Test
    @DisplayName("Should get user conversations")
    void shouldGetUserConversations() {
        // Arrange
        List<Conversation> conversations = Collections.singletonList(conversation);
        
        when(conversationRepository.findByUserId(1L)).thenReturn(conversations);
        when(conversationMapper.toDTO(conversation)).thenReturn(conversationDTO);
        when(messageRepository.countUnreadMessagesInConversation(1L, 1L)).thenReturn(0L);
        when(messageMapper.toDTO(message)).thenReturn(messageDTO);
        
        // Act
        List<ConversationDTO> results = chatService.getUserConversations(1L);
        
        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
        assertEquals("Test Apartment", results.get(0).getApartmentTitle());
        verify(conversationRepository).findByUserId(1L);
    }
    
    @Test
    @DisplayName("Should get conversation messages")
    void shouldGetConversationMessages() {
        // Arrange
        Page<Message> messagePage = new PageImpl<>(Collections.singletonList(message));
        Pageable pageable = PageRequest.of(0, 20);
        
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationIdOrderByTimestampDesc(1L, pageable)).thenReturn(messagePage);
        when(messageMapper.toDTO(message)).thenReturn(messageDTO);
        
        // Act
        Page<MessageDTO> results = chatService.getConversationMessages(1L, 1L, pageable);
        
        // Assert
        assertNotNull(results);
        assertEquals(1, results.getTotalElements());
        assertEquals("Hello, is the apartment still available?", results.getContent().get(0).getContent());
        verify(messageRepository).findByConversationIdOrderByTimestampDesc(1L, pageable);
    }
    
    @Test
    @DisplayName("Should throw exception when getting messages from invalid user")
    void shouldThrowExceptionWhenGettingMessagesFromInvalidUser() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.getConversationMessages(1L, 3L, pageable);
        });
    }
    
    @Test
    @DisplayName("Should send message")
    void shouldSendMessage() {
        // Arrange
        messageDTO.setContent("New test message");
        Message newMessage = new Message();
        newMessage.setId(2L);
        newMessage.setContent("New test message");
        newMessage.setSender(tenant);
        newMessage.setConversation(conversation);
        newMessage.setTimestamp(now);
        
        MessageDTO savedMessageDTO = new MessageDTO();
        savedMessageDTO.setId(2L);
        savedMessageDTO.setConversationId(1L);
        savedMessageDTO.setSenderId(1L);
        savedMessageDTO.setContent("New test message");
        
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(tenant));
        when(messageMapper.toEntity(messageDTO)).thenReturn(newMessage);
        when(messageRepository.save(any(Message.class))).thenReturn(newMessage);
        when(messageMapper.toDTO(newMessage)).thenReturn(savedMessageDTO);
        
        // Act
        MessageDTO result = chatService.sendMessage(messageDTO, 1L);
        
        // Assert
        assertNotNull(result);
        assertEquals("New test message", result.getContent());
        assertTrue(result.isCurrentUserSender());
        
        // Verify WebSocket messages
        verify(messagingTemplate).convertAndSend(eq("/topic/chat/1"), any(MessageDTO.class));
        verify(messagingTemplate).convertAndSendToUser(
            eq("2"), 
            eq("/queue/chat"), 
            any(ChatNotificationDTO.class));
    }
    
    @Test
    @DisplayName("Should throw exception when sending message with invalid user")
    void shouldThrowExceptionWhenSendingMessageWithInvalidUser() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.sendMessage(messageDTO, 3L);
        });
    }
    
    @Test
    @DisplayName("Should mark messages as read")
    void shouldMarkMessagesAsRead() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        
        // Act
        chatService.markMessagesAsRead(1L, 1L);
        
        // Assert
        verify(messageRepository).markAllAsReadInConversation(1L, 1L);
    }
    
    @Test
    @DisplayName("Should throw exception when marking messages with invalid user")
    void shouldThrowExceptionWhenMarkingMessagesWithInvalidUser() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.markMessagesAsRead(1L, 3L);
        });
    }
}