package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class RentalSearchCriteria {
    private String address;
    private Boolean occupied;
    private String ownerName;
    private String tenantName;
    private String rentalStatus;
}