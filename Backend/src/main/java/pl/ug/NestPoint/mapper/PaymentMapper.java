package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.ug.NestPoint.domain.Payment;
import pl.ug.NestPoint.dto.PaymentDTO;

@Mapper(componentModel = "spring")
public interface PaymentMapper {
    @Mapping(source = "rental.id", target = "rentalId")
    PaymentDTO toDTO(Payment payment);

    @Mapping(source = "rentalId", target = "rental.id")
    Payment toEntity(PaymentDTO paymentDTO);
}