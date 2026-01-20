package pl.ug.NestPoint.service;

import lombok.RequiredArgsConstructor;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;


import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.ApartmentDTO;
import pl.ug.NestPoint.dto.DateRangeDTO;
import pl.ug.NestPoint.mapper.ApartmentMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class ApartmentService {
    private final ApartmentRepository apartmentRepository;
    private final PhotoService photoService;
    private final ApartmentMapper apartmentMapper;
    private final UserRepository userRepository;
    private final GeocodingService geocodingService;


    // Core CRUD operations
    @Transactional
    public Apartment createApartment(ApartmentDTO apartmentDTO) {
        Apartment apartment = apartmentMapper.toEntity(apartmentDTO);
        setDefaultAccessibilityValues(apartment);
        validateAndSetOwner(apartmentDTO.getOwnerId(), apartment);
        
        // Geocode the address if it exists
        if (apartment.getAddress() != null) {
            geocodingService.geocodeAddress(apartment.getAddress());
        }
        
        return apartmentRepository.save(apartment);
    }

    public Apartment updateApartment(Long id, Apartment updatedApartment) {
        Apartment existingApartment = getApartmentById(id);
        validateAndSetOwner(updatedApartment.getOwner().getId(), existingApartment);
        updateApartmentFields(existingApartment, updatedApartment);
        
        // Re-geocode if the address changed
        if (existingApartment.getAddress() != null) {
            geocodingService.geocodeAddress(existingApartment.getAddress());
        }
        
        return apartmentRepository.save(existingApartment);
    }

    public void deleteApartment(Long id) {
        apartmentRepository.deleteById(id);
    }

    public Apartment getApartmentById(Long id) {
        return apartmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Apartment not found"));
    }

    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }

    // Date-based availability methods
    public List<Apartment> findAvailableOnDate(LocalDate date) {
        return apartmentRepository.findAvailableOnDate(date);
    }
    
    public List<Apartment> findAvailableBetweenDates(LocalDate startDate, LocalDate endDate) {
        return apartmentRepository.findAvailableBetweenDates(startDate, endDate);
    }
    
    public List<Apartment> findOccupiedOnDate(LocalDate date) {
        return apartmentRepository.findOccupiedOnDate(date);
    }

    public List<Apartment> findByAuctionStatus(
        Boolean hasActiveAuction,
        Boolean hasUpcomingAuction, 
        Boolean hasCompletedAuction,
        boolean includeAuctionDetails) {
    
    List<Apartment> apartments;
    
    if (Boolean.TRUE.equals(hasActiveAuction)) {
        apartments = apartmentRepository.findWithActiveAuctions();
    } else if (Boolean.TRUE.equals(hasUpcomingAuction)) {
        apartments = apartmentRepository.findWithUpcomingAuctions();
    } else if (Boolean.TRUE.equals(hasCompletedAuction)) {
        apartments = apartmentRepository.findWithCompletedAuctions();
    } else {
        // Default to all apartments with any auction
        apartments = apartmentRepository.findWithAnyAuction();
    }
    
    // If includeAuctionDetails is true, we need to fetch auction data
    if (includeAuctionDetails) {
        for (Apartment apartment : apartments) {
            if (apartment.getAuctions() != null) {
                Hibernate.initialize(apartment.getAuctions());
            }
        }
    }
    
    return apartments;
    }
    
    // Get occupied and available date ranges for an apartment
    public List<DateRangeDTO> getOccupiedDateRanges(Long apartmentId) {
        Apartment apartment = getApartmentById(apartmentId);
        
        List<DateRangeDTO> occupiedDates = new ArrayList<>();
        
        if (apartment.getRentals() != null) {
            apartment.getRentals().stream()
                .filter(rental -> rental.getStatus() != RentalStatus.CANCELLED)
                .forEach(rental -> {
                    occupiedDates.add(new DateRangeDTO(
                        rental.getStartDate(),
                        rental.getEndDate()
                    ));
                });
        }
        
        // Sort by start date
        occupiedDates.sort(Comparator.comparing(DateRangeDTO::getStartDate));
        
        return occupiedDates;
    }
    
    public List<DateRangeDTO> getAvailableDateRanges(Long apartmentId, int monthsAhead) {
        Apartment apartment = getApartmentById(apartmentId);
        List<DateRangeDTO> occupiedRanges = getOccupiedDateRanges(apartmentId);
        
        // If no occupations, the entire period is available
        if (occupiedRanges.isEmpty()) {
            return List.of(new DateRangeDTO(
                LocalDate.now(),
                LocalDate.now().plusMonths(monthsAhead)
            ));
        }
        
        // Build available ranges around occupied ranges
        List<DateRangeDTO> availableRanges = new ArrayList<>();
        LocalDate currentDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusMonths(monthsAhead);
        
        // Sort occupied ranges
        occupiedRanges.sort(Comparator.comparing(DateRangeDTO::getStartDate));
        
        // Process each occupied range
        for (DateRangeDTO occupiedRange : occupiedRanges) {
            // If there's a gap between current date and the next occupied period
            if (currentDate.isBefore(occupiedRange.getStartDate())) {
                availableRanges.add(new DateRangeDTO(
                    currentDate,
                    occupiedRange.getStartDate().minusDays(1)
                ));
            }
            
            // Update current date to the day after this occupied period
            currentDate = occupiedRange.getEndDate().plusDays(1);
        }
        
        // Add final available period if needed
        if (currentDate.isBefore(endDate)) {
            availableRanges.add(new DateRangeDTO(
                currentDate,
                endDate
            ));
        }
        
        return availableRanges;
    }

    // Helper methods
    private void setDefaultAccessibilityValues(Apartment apartment) {
    }

    private void validateAndSetOwner(Long userId, Apartment apartment) {
        User owner = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Explicitly check for OWNER role before setting
        if (owner.getRoles() == null || !owner.getRoles().contains(Role.OWNER)) {
            throw new IllegalStateException("Apartment can only be owned by a user with OWNER role");
        }
        
        apartment.setOwner(owner);
    }

    private void updateApartmentFields(Apartment existing, Apartment updated) {
        // Update fields but don't set occupied property
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());        
        existing.setAddress(updated.getAddress());
        existing.setSize(updated.getSize());
        existing.setRentalPrice(updated.getRentalPrice());
        existing.setNumberOfRooms(updated.getNumberOfRooms());
        existing.setNumberOfBeds(updated.getNumberOfBeds());
        existing.setFurnished(updated.isFurnished());
        existing.setKitchen(updated.getKitchen());
        existing.setWifi(updated.isWifi());
        existing.setPetsAllowed(updated.isPetsAllowed());
        existing.setParkingSpace(updated.isParkingSpace());
        existing.setYardAccess(updated.getYardAccess());
        existing.setPoolAccess(updated.getPoolAccess());
        existing.setDisabilityFriendly(updated.isDisabilityFriendly());
        existing.setPropertyType(updated.getPropertyType());
        existing.setPoolFee(updated.getPoolFee());
    }



    public List<Apartment> findByOwnerName(String ownerName) {
        return apartmentRepository.findByOwnerName(ownerName);
    }

    public List<Apartment> findByAddressContaining(String address) {
        return apartmentRepository.findByAddressContaining(address);
    }

    public List<Apartment> findBySizeGreaterThan(int size) {
        return apartmentRepository.findBySizeGreaterThan(size);
    }

    public List<Apartment> findByRentalPriceBetween(double minPrice, double maxPrice) {
        return apartmentRepository.findByRentalPriceBetween(minPrice, maxPrice);
    }

    public List<Apartment> findLuxuryApartments(double luxuryThreshold) {
        return apartmentRepository.findLuxuryApartments(luxuryThreshold);
    }

    public List<Apartment> findBudgetApartments(double luxuryThreshold) {
        return apartmentRepository.findBudgetApartments(luxuryThreshold);
    }

    public List<Object[]> findAverageRentalPriceGroupedByCity() {
        return apartmentRepository.findAverageRentalPriceGroupedByCity();
    }

    public List<Object[]> findAverageRentalPriceGroupedByOwner() {
        return apartmentRepository.findAverageRentalPriceGroupedByOwner();
    }

    public List<Apartment> findByAmenities(
            boolean needsWifi, 
            boolean needsParking, 
            boolean allowsPets, 
            AccessibilityType kitchenType,
            boolean needsDisabilityAccess) {
        return apartmentRepository.findByAmenities(
            needsWifi, 
            needsDisabilityAccess, 
            needsParking,
            kitchenType,
            allowsPets
            
        );
    }

    public List<Apartment> findByPropertyType(PropertyType propertyType) {
        return apartmentRepository.findByPropertyType(propertyType);
    }

    public List<Apartment> findByAccessibilityFeatures(
            AccessibilityType poolAccess,
            AccessibilityType yardAccess,
            boolean disabilityFriendly) {
        return apartmentRepository.findByAccessibilityFeatures(
            poolAccess,
            yardAccess,
            disabilityFriendly
        );
    }

    public long getApartmentCount() {
        return apartmentRepository.count();
    }
}