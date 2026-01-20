package pl.ug.NestPoint.dto;

import lombok.Data;
import pl.ug.NestPoint.domain.Address;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;

import java.util.List;

@Data
public class ApartmentDTO {
    private Long id;
    private String title;
    private String description;
    private Address address;
    private int size;
    private double rentalPrice; // Price per night
    private int numberOfRooms;
    private int numberOfBeds;
    private boolean furnished;
    private boolean currentlyOccupied; // Calculated property
    private Long ownerId;
    
    // Essential amenities
    private AccessibilityType kitchen;
    private boolean wifi;
    private boolean petsAllowed;
    private boolean parkingSpace;
    
    // Optional amenities
    private AccessibilityType yardAccess;
    private AccessibilityType poolAccess;
    private boolean disabilityFriendly;
    private double poolFee;
    
    // Property type
    private PropertyType propertyType;
    
    // Available dates can be shown in the UI
    private List<DateRangeDTO> availableDateRanges;
    private List<DateRangeDTO> occupiedDateRanges;

    private List<String> photoUrls;
}