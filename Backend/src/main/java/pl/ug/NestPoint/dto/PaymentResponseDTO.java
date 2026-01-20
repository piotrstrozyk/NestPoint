package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class PaymentResponseDTO {
    private boolean success;
    private String message;
}