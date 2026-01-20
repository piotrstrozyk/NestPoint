package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class RentalPaymentDTO {
    private RentalDTO rental;
    private PaymentRequestDTO payment;
}