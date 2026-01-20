package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.service.ChatService;
import pl.ug.NestPoint.dto.ChatNotificationDTO;


@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            @Payload MessageDTO messageDTO,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Get user from the JWT in WebSocket session
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        log.info("WebSocket message received: conversation={}, content='{}', userId={}", 
            conversationId, messageDTO.getContent(), userId);
        
        if (userId == null) {
            log.error("NO USER ID IN SESSION - Authentication config not working!");
            return;
        }
        
        // Set conversation ID from path variable
        messageDTO.setConversationId(conversationId);
        messageDTO.setSenderId(userId);
        
        // Process the message - THIS WILL NOW TRIGGER WEBSOCKET MESSAGES
        log.info("Processing message through ChatService...");
        chatService.sendMessage(messageDTO, userId);
    }

    @MessageMapping("/chat/{conversationId}/read")
    public void markAsRead(
            @DestinationVariable Long conversationId,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        if (userId != null) {
            chatService.markMessagesAsRead(conversationId, userId);
        }
    }
}