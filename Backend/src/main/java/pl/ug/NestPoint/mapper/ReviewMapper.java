package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.ug.NestPoint.domain.Review;
import pl.ug.NestPoint.dto.ReviewDTO;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    // When creating a new review, ignore ID (it's generated)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "photos", ignore = true)
    @Mapping(source = "authorId", target = "author.id")
    @Mapping(source = "apartmentId", target = "apartment.id")
    @Mapping(source = "targetUserId", target = "targetUser.id")
    Review toEntity(ReviewDTO dto);
    
    // When converting to DTO, explicitly map the ID
    @Mapping(source = "id", target = "id")
    @Mapping(source = "author.id", target = "authorId")
    @Mapping(source = "apartment.id", target = "apartmentId")
    @Mapping(source = "targetUser.id", target = "targetUserId")
    ReviewDTO toDTO(Review entity);
    
    // Add a mapping method for updating existing reviews
    @Mapping(target = "id", ignore = true)  // Don't change the ID
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "photos", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "apartment", ignore = true)
    @Mapping(target = "targetUser", ignore = true)
    void updateEntityFromDto(ReviewDTO dto, @MappingTarget Review entity);
}