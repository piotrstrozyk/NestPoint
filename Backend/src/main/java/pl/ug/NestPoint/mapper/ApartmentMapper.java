package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.dto.ApartmentDTO;

import java.time.LocalDate;

@Mapper(componentModel = "spring")
public interface ApartmentMapper {
    @Mapping(source = "owner.id", target = "ownerId")
    @Mapping(source = "poolFee", target = "poolFee")
    @Mapping(source = "apartment", target = "currentlyOccupied", qualifiedByName = "isCurrentlyOccupied")
    ApartmentDTO toDTO(Apartment apartment);

    @Mapping(source = "ownerId", target = "owner.id")
    @Mapping(source = "poolFee", target = "poolFee")
    @Mapping(target = "photos", ignore = true)
    @Mapping(target = "rentals", ignore = true)
    @Mapping(target = "owner", ignore = true)
    Apartment toEntity(ApartmentDTO apartmentDTO);
    
    @Named("isCurrentlyOccupied")
    default boolean isCurrentlyOccupied(Apartment apartment) {
        return apartment.isCurrentlyOccupied();
    }

    
}