package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.dto.UserDTO;
import pl.ug.NestPoint.dto.RegistrationRequest;

@Mapper(componentModel = "spring", uses = {ApartmentMapper.class, RentalMapper.class})
public interface UserMapper {
    
    UserDTO toDTO(User user);
    
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "ownedApartments", ignore = true)
    @Mapping(target = "rentals", ignore = true)
    User toEntity(UserDTO userDTO);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "ownedApartments", ignore = true)
    @Mapping(target = "rentals", ignore = true)
    UserDTO fromRegistrationRequest(RegistrationRequest request);
}