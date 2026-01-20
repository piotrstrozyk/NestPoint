package pl.ug.NestPoint.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ChatNotificationDTO {
    private String type;              // "NEW_MESSAGE" or whatever we want!
    private Long conversationId;
    private String senderName;
    private String preview;           // First X chars of message
    private String apartmentTitle;
    private LocalDateTime timestamp;
}