package pl.ug.NestPoint.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

import pl.ug.NestPoint.domain.Address;

@Data
public class RentalDTO {
    private Long id;
    private Long apartmentId;
    private Long tenantId;
    private Long ownerId;
    private LocalDate startDate;
    private LocalDate endDate;
    private long nights; // Number of nights
    private double pricePerNight; // Price per night
    private double totalCost; // Total cost (nights × pricePerNight + rentalFees)
    private String status;
    private Address address;
    private boolean apartmentOccupied;
    private double rentalFees; // Additional fees
    private Boolean isAuction;
    private Boolean auctionPaymentConfirmed;
    private LocalDateTime auctionPaymentDeadline;
    private Boolean auctionFineIssued;
    private Double auctionFineAmount;
}