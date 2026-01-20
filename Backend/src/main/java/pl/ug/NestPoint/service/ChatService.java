package pl.ug.NestPoint.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.dto.ConversationDTO;
import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.mapper.ConversationMapper;
import pl.ug.NestPoint.mapper.MessageMapper;
import pl.ug.NestPoint.repository.ConversationRepository;
import pl.ug.NestPoint.repository.MessageRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.dto.ChatNotificationDTO;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ConversationDTO getOrCreateConversation(Long rentalId, Long userId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new IllegalArgumentException("Rental not found"));
        
        // Verify user is either owner or tenant of this rental
        if (!rental.getTenant().getId().equals(userId) && !rental.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("User is not authorized to access this conversation");
        }
        
        // Get or create conversation
        Conversation conversation = conversationRepository.findByRentalId(rentalId)
                .orElseGet(() -> {
                    Conversation newConversation = new Conversation();
                    newConversation.setRental(rental);
                    newConversation.setActive(true);
                    return conversationRepository.save(newConversation);
                });
        
        ConversationDTO dto = conversationMapper.toDTO(conversation);
        
        // Add the last message if it exists
        if (!conversation.getMessages().isEmpty()) {
            Message lastMessage = conversation.getMessages().stream()
                    .max(java.util.Comparator.comparing(Message::getTimestamp))
                    .orElse(null);
            
            if (lastMessage != null) {
                MessageDTO lastMessageDto = messageMapper.toDTO(lastMessage);
                lastMessageDto.setCurrentUserSender(lastMessage.getSender().getId().equals(userId));
                dto.setLastMessage(lastMessageDto);
            }
        }
        
        // Count unread messages
        dto.setUnreadCount(messageRepository.countUnreadMessagesInConversation(conversation.getId(), userId));
        
        return dto;
    }
    
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        
        return conversations.stream().map(conversation -> {
            ConversationDTO dto = conversationMapper.toDTO(conversation);
            
            // Add the last message if it exists
            if (!conversation.getMessages().isEmpty()) {
                Message lastMessage = conversation.getMessages().stream()
                        .max(java.util.Comparator.comparing(Message::getTimestamp))
                        .orElse(null);
                
                if (lastMessage != null) {
                    MessageDTO lastMessageDto = messageMapper.toDTO(lastMessage);
                    lastMessageDto.setCurrentUserSender(lastMessage.getSender().getId().equals(userId));
                    dto.setLastMessage(lastMessageDto);
                }
            }
            
            // Count unread messages
            dto.setUnreadCount(messageRepository.countUnreadMessagesInConversation(conversation.getId(), userId));
            
            return dto;
        }).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<MessageDTO> getConversationMessages(Long conversationId, Long userId, Pageable pageable) {
        // Find conversation directly 
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        // Direct check against rental tenant/owner IDs
        Rental rental = conversation.getRental();
        if (rental == null) {
            throw new IllegalArgumentException("Conversation has no associated rental");
        }
        
        if (!userId.equals(rental.getTenant().getId()) && !userId.equals(rental.getOwner().getId())) {
            throw new IllegalArgumentException("User is not authorized to access this conversation");
        }
        
        Page<Message> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, pageable);
        
        return messages.map(message -> {
            MessageDTO dto = messageMapper.toDTO(message);
            dto.setCurrentUserSender(message.getSender().getId().equals(userId));
            return dto;
        });
    }
    
    @Transactional
    public MessageDTO sendMessage(MessageDTO messageDTO, Long userId) {
        Long conversationId = messageDTO.getConversationId();
        
        log.info("PROCESSING MESSAGE: conversation={}, sender={}, content='{}'", 
            conversationId, userId, messageDTO.getContent());
            
        // Find conversation directly using repository
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        // Direct check against rental tenant/owner IDs
        Rental rental = conversation.getRental();
        if (!userId.equals(rental.getTenant().getId()) && !userId.equals(rental.getOwner().getId())) {
            throw new IllegalArgumentException("User is not authorized to access this conversation");
        }
        
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Message message = messageMapper.toEntity(messageDTO);
        message.setSender(sender);
        message.setConversation(conversation);
        message = messageRepository.save(message);
        
        log.info("Message saved to database with ID: {}", message.getId());
        
        MessageDTO resultDTO = messageMapper.toDTO(message);
        resultDTO.setCurrentUserSender(true);
        
        // **CRITICAL FIX**: Send to conversation topic that both users can subscribe to
        MessageDTO broadcastDTO = messageMapper.toDTO(message);
        
        try {
            // Send to conversation topic - both users should subscribe to this
            log.info("Broadcasting to conversation topic: /topic/chat/{}", conversationId);
            messagingTemplate.convertAndSend(
                "/topic/chat/" + conversationId,
                broadcastDTO
            );
            
            Long receiverId = rental.getTenant().getId().equals(userId) 
                    ? rental.getOwner().getId() 
                    : rental.getTenant().getId();
            
            // Create lightweight notification for queue
            ChatNotificationDTO notification = createChatNotification(message, rental);
                    
            log.info("Sending individual notification to user: {}", receiverId);
            messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                "/queue/chat",
                notification  // ← Clean notification object instead of full message
            );
            
            log.info("Message broadcasting completed successfully");
        } catch (Exception e) {
            log.error("FAILED to broadcast message: {}", e.getMessage(), e);
        }
        
        return resultDTO;
    }
    
    @Transactional
    public void markMessagesAsRead(Long conversationId, Long userId) {
        // Find conversation directly
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        // Direct check against rental tenant/owner IDs
        Rental rental = conversation.getRental();
        if (rental == null) {
            throw new IllegalArgumentException("Conversation has no associated rental");
        }
        
        if (!userId.equals(rental.getTenant().getId()) && !userId.equals(rental.getOwner().getId())) {
            throw new IllegalArgumentException("User is not authorized to access this conversation");
        }
        
        messageRepository.markAllAsReadInConversation(conversationId, userId);
    }
    
    private ChatNotificationDTO createChatNotification(Message message, Rental rental) {
        String preview = message.getContent().length() > 20 
            ? message.getContent().substring(0, 20) + "..." 
            : message.getContent();
            
        return ChatNotificationDTO.builder()
            .type("NEW_MESSAGE")
            .conversationId(message.getConversation().getId())
            .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
            .preview(preview)
            .apartmentTitle(rental.getApartment().getTitle())
            .timestamp(message.getTimestamp())
            .build();
    }
}