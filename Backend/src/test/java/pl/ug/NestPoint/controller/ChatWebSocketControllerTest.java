package pl.ug.NestPoint.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.service.ChatService;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Chat WebSocket Controller Unit Tests")
public class ChatWebSocketControllerTest {
    
    @Mock
    private ChatService chatService;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Mock
    private SimpMessageHeaderAccessor headerAccessor;
    
    @InjectMocks
    private ChatWebSocketController controller;
    
    private Map<String, Object> sessionAttributes;
    private MessageDTO messageDTO;
    
    @BeforeEach
    void setUp() {
        // Setup session attributes with user ID
        sessionAttributes = new HashMap<>();
        sessionAttributes.put("userId", 1L);
        when(headerAccessor.getSessionAttributes()).thenReturn(sessionAttributes);
        
        // Setup message DTO
        messageDTO = new MessageDTO();
        messageDTO.setContent("Test message");
    }
    
    @Test
    @DisplayName("Should send message via service when received through WebSocket")
    void shouldSendMessage() {
        // When
        controller.sendMessage(1L, messageDTO, headerAccessor);
        
        // Then
        ArgumentCaptor<MessageDTO> messageCaptor = ArgumentCaptor.forClass(MessageDTO.class);
        verify(chatService).sendMessage(messageCaptor.capture(), eq(1L));
        
        MessageDTO capturedMessage = messageCaptor.getValue();
        assertEquals(1L, capturedMessage.getConversationId());
        assertEquals(1L, capturedMessage.getSenderId());
        assertEquals("Test message", capturedMessage.getContent());
    }
    
    @Test
    @DisplayName("Should mark messages as read when received through WebSocket")
    void shouldMarkMessagesAsRead() {
        // When
        controller.markAsRead(1L, headerAccessor);
        
        // Then
        verify(chatService).markMessagesAsRead(1L, 1L);
    }
    
    @Test
    @DisplayName("Should not process message when user ID is missing")
    void shouldNotProcessMessageWhenUserIdIsMissing() {
        // Given
        sessionAttributes.remove("userId");
        
        // When
        controller.sendMessage(1L, messageDTO, headerAccessor);
        
        // Then
        verify(chatService, never()).sendMessage(any(), any());
    }
}