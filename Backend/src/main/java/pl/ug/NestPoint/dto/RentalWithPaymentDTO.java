package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class RentalWithPaymentDTO {
    private RentalDTO rental;
    private PaymentRequestDTO payment;
}