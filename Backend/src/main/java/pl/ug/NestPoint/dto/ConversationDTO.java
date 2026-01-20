package pl.ug.NestPoint.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConversationDTO {
    private Long id;
    private Long rentalId;
    private String apartmentTitle;
    private UserSummaryDTO tenant;
    private UserSummaryDTO owner;
    private LocalDateTime createdAt;
    private boolean isActive;
    private MessageDTO lastMessage;
    private long unreadCount;
}