package pl.ug.NestPoint.mapper;

import org.mapstruct.*;
import pl.ug.NestPoint.domain.Conversation;
import pl.ug.NestPoint.dto.ConversationDTO;

@Mapper(componentModel = "spring", uses = {MessageMapper.class, UserMapper.class})
public interface ConversationMapper {
    @Mapping(source = "rental.id", target = "rentalId")
    @Mapping(source = "rental.apartment.title", target = "apartmentTitle")
    @Mapping(source = "rental.tenant", target = "tenant")
    @Mapping(source = "rental.owner", target = "owner")
    @Mapping(target = "lastMessage", ignore = true)
    @Mapping(target = "unreadCount", ignore = true)
    ConversationDTO toDTO(Conversation conversation);
}