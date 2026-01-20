package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.dto.ConversationDTO;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.service.ChatService;
import pl.ug.NestPoint.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final UserService userService;
    
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(chatService.getUserConversations(user.getId()));
    }
    
    @GetMapping("/rental/{rentalId}/conversation")
    public ResponseEntity<ConversationDTO> getOrCreateConversation(
            @PathVariable Long rentalId,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(chatService.getOrCreateConversation(rentalId, user.getId()));
    }
    
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageDTO>> getConversationMessages(
            @PathVariable Long conversationId,
            Pageable pageable,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(chatService.getConversationMessages(conversationId, user.getId(), pageable));
    }
    
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody MessageDTO messageDTO,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        messageDTO.setConversationId(conversationId);
        messageDTO.setSenderId(user.getId());
        return ResponseEntity.ok(chatService.sendMessage(messageDTO, user.getId()));
    }
    
    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long conversationId,
            Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        chatService.markMessagesAsRead(conversationId, user.getId());
        return ResponseEntity.ok().build();
    }
}