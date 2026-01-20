package pl.ug.NestPoint.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PaymentDTO {
    private Long id;
    private double amount;
    private LocalDate paymentDate;
    private double rentalFees; 
    private Long rentalId;
}