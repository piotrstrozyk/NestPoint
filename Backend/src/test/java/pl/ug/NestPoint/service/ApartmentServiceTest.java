package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.ApartmentDTO;
import pl.ug.NestPoint.mapper.ApartmentMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.dto.DateRangeDTO;
import pl.ug.NestPoint.domain.Rental;


import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;
import java.util.ArrayList;




import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ApartmentService Tests")
class ApartmentServiceTest {

    @Mock
    private ApartmentRepository apartmentRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ApartmentMapper apartmentMapper;
    
    @Mock
    private PhotoService photoService;
    
    @Mock
    private GeocodingService geocodingService;
    
    @InjectMocks
    private ApartmentService apartmentService;
    
    private Apartment testApartment;
    private ApartmentDTO testApartmentDTO;
    private User testOwner;
    
    @BeforeEach
    void setUp() {
        Set<Role> ownerRoles = new HashSet<>();
        ownerRoles.add(Role.OWNER); 
        
        testOwner = User.builder()
                .id(1L)
                .username("owner")
                .roles(ownerRoles)
                .build();
        
        // Create a mock apartment instead of a real one
        testApartment = mock(Apartment.class);
        
        // Set up common behavior for the mock
        when(testApartment.getId()).thenReturn(1L);
        when(testApartment.getTitle()).thenReturn("Test Apartment");
        when(testApartment.getRentalPrice()).thenReturn(1000.0);
        when(testApartment.getPropertyType()).thenReturn(PropertyType.APARTMENT);
        when(testApartment.getOwner()).thenReturn(testOwner);
        
        testApartmentDTO = new ApartmentDTO();
        testApartmentDTO.setTitle("Test Apartment");
        testApartmentDTO.setRentalPrice(1000.0);
        testApartmentDTO.setOwnerId(1L);
    }

    
    @Test
    @DisplayName("Should create apartment successfully")
    void shouldCreateApartmentSuccessfully() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testOwner));
        when(apartmentMapper.toEntity(testApartmentDTO)).thenReturn(testApartment);
        when(apartmentRepository.save(any(Apartment.class))).thenReturn(testApartment);
        
        // When
        Apartment result = apartmentService.createApartment(testApartmentDTO);
        
        // Then
        assertNotNull(result);
        assertEquals("Test Apartment", result.getTitle());
        verify(userRepository).findById(1L);
        verify(apartmentRepository).save(any(Apartment.class));
    }
    
    @Test
    @DisplayName("Should find available apartments on date")
    void shouldFindAvailableApartmentsOnDate() {
        // Given
        LocalDate testDate = LocalDate.now().plusDays(7);
        List<Apartment> availableApartments = Arrays.asList(testApartment);
        when(apartmentRepository.findAvailableOnDate(testDate)).thenReturn(availableApartments);
        
        // When
        List<Apartment> result = apartmentService.findAvailableOnDate(testDate);
        
        // Then
        assertEquals(1, result.size());
        assertEquals(testApartment, result.get(0));
        verify(apartmentRepository).findAvailableOnDate(testDate);
    }
    
    @Test
    @DisplayName("Should throw exception when owner not found")
    void shouldThrowExceptionWhenOwnerNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        testApartmentDTO.setOwnerId(999L);
        when(apartmentMapper.toEntity(testApartmentDTO)).thenReturn(testApartment);
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> apartmentService.createApartment(testApartmentDTO)
        );
        
        assertEquals("Owner not found", exception.getMessage());
        verify(apartmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update apartment successfully")
    void shouldUpdateApartmentSuccessfully() {
        // Given
        Apartment updatedApartment = new Apartment();
        updatedApartment.setTitle("Updated Title");
        updatedApartment.setDescription("Updated Description");
        updatedApartment.setRentalPrice(1500.0);
        updatedApartment.setOwner(testOwner);
        
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(apartmentRepository.save(any(Apartment.class))).thenReturn(testApartment);
        when(userRepository.findById(testOwner.getId())).thenReturn(Optional.of(testOwner));
        
        // When
        Apartment result = apartmentService.updateApartment(1L, updatedApartment);
        
        // Then
        assertNotNull(result);
        verify(apartmentRepository).findById(1L);
        verify(apartmentRepository).save(any(Apartment.class));
    }
    
    @Test
    @DisplayName("Should delete apartment")
    void shouldDeleteApartment() {
        // When
        apartmentService.deleteApartment(1L);
        
        // Then
        verify(apartmentRepository).deleteById(1L);
    }
    
    @Test
    @DisplayName("Should get apartment by ID")
    void shouldGetApartmentById() {
        // Given
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        
        // When
        Apartment result = apartmentService.getApartmentById(1L);
        
        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Apartment", result.getTitle());
        verify(apartmentRepository).findById(1L);
    }
    
    @Test
    @DisplayName("Should throw exception when apartment not found")
    void shouldThrowExceptionWhenApartmentNotFound() {
        // Given
        when(apartmentRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> apartmentService.getApartmentById(999L)
        );
        
        assertEquals("Apartment not found", exception.getMessage());
    }
    
    @Test
    @DisplayName("Should get all apartments")
    void shouldGetAllApartments() {
        // Given
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findAll()).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.getAllApartments();
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findAll();
    }
    
    @Test
    @DisplayName("Should find available apartments between dates")
    void shouldFindAvailableApartmentsBetweenDates() {
        // Given
        LocalDate startDate = LocalDate.now().plusDays(7);
        LocalDate endDate = LocalDate.now().plusDays(14);
        List<Apartment> availableApartments = Arrays.asList(testApartment);
        when(apartmentRepository.findAvailableBetweenDates(startDate, endDate)).thenReturn(availableApartments);
        
        // When
        List<Apartment> result = apartmentService.findAvailableBetweenDates(startDate, endDate);
        
        // Then
        assertEquals(1, result.size());
        assertEquals(testApartment, result.get(0));
        verify(apartmentRepository).findAvailableBetweenDates(startDate, endDate);
    }
    
    @Test
    @DisplayName("Should find occupied apartments on date")
    void shouldFindOccupiedApartmentsOnDate() {
        // Given
        LocalDate testDate = LocalDate.now().plusDays(7);
        List<Apartment> occupiedApartments = Arrays.asList(testApartment);
        when(apartmentRepository.findOccupiedOnDate(testDate)).thenReturn(occupiedApartments);
        
        // When
        List<Apartment> result = apartmentService.findOccupiedOnDate(testDate);
        
        // Then
        assertEquals(1, result.size());
        assertEquals(testApartment, result.get(0));
        verify(apartmentRepository).findOccupiedOnDate(testDate);
    }
    
    
    @Test
    @DisplayName("Should get available date ranges with no occupied periods")
    void shouldGetAvailableDateRangesWithNoOccupiedPeriods() {
        // Given
        List<Rental> emptyRentals = new ArrayList<>();
        when(testApartment.getRentals()).thenReturn(emptyRentals);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        
        // When
        List<DateRangeDTO> result = apartmentService.getAvailableDateRanges(1L, 3);
        
        // Then
        assertEquals(1, result.size());
        assertEquals(LocalDate.now(), result.get(0).getStartDate());
        assertEquals(LocalDate.now().plusMonths(3), result.get(0).getEndDate());
    }

    @Test
    @DisplayName("Should get occupied date ranges")
    void shouldGetOccupiedDateRanges() {
        // Given
        Rental rental = mock(Rental.class);
        when(rental.getStartDate()).thenReturn(LocalDate.now().plusDays(1));
        when(rental.getEndDate()).thenReturn(LocalDate.now().plusDays(5));
        when(rental.getStatus()).thenReturn(RentalStatus.ACTIVE);
        
        List<Rental> rentals = new ArrayList<>();
        rentals.add(rental);
        
        when(testApartment.getRentals()).thenReturn(rentals);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        
        // When
        List<DateRangeDTO> result = apartmentService.getOccupiedDateRanges(1L);
        
        // Then
        assertEquals(1, result.size());
        assertEquals(rental.getStartDate(), result.get(0).getStartDate());
        assertEquals(rental.getEndDate(), result.get(0).getEndDate());
    }
    
    @Test
    @DisplayName("Should find apartments by owner name")
    void shouldFindByOwnerName() {
        // Given
        String ownerName = "owner";
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByOwnerName(ownerName)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByOwnerName(ownerName);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByOwnerName(ownerName);
    }
    
    @Test
    @DisplayName("Should find apartments by address")
    void shouldFindByAddressContaining() {
        // Given
        String address = "Warsaw";
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByAddressContaining(address)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByAddressContaining(address);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByAddressContaining(address);
    }
    
    @Test
    @DisplayName("Should find apartments by minimum size")
    void shouldFindBySizeGreaterThan() {
        // Given
        int minSize = 50;
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findBySizeGreaterThan(minSize)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findBySizeGreaterThan(minSize);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findBySizeGreaterThan(minSize);
    }
    
    @Test
    @DisplayName("Should find apartments by price range")
    void shouldFindByRentalPriceBetween() {
        // Given
        double minPrice = 800.0;
        double maxPrice = 1200.0;
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByRentalPriceBetween(minPrice, maxPrice)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByRentalPriceBetween(minPrice, maxPrice);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByRentalPriceBetween(minPrice, maxPrice);
    }
    
    @Test
    @DisplayName("Should find luxury apartments")
    void shouldFindLuxuryApartments() {
        // Given
        double threshold = 1500.0;
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findLuxuryApartments(threshold)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findLuxuryApartments(threshold);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findLuxuryApartments(threshold);
    }
    
    @Test
    @DisplayName("Should find budget apartments")
    void shouldFindBudgetApartments() {
        // Given
        double threshold = 800.0;
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findBudgetApartments(threshold)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findBudgetApartments(threshold);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findBudgetApartments(threshold);
    }
    
    @Test
    @DisplayName("Should find average rental price by city")
    void shouldFindAverageRentalPriceGroupedByCity() {
        // Given
        List<Object[]> averagePrices = new ArrayList<>();
        Object[] cityPriceArray = new Object[] {"Warsaw", 1000.0};
        averagePrices.add(cityPriceArray);
        
        when(apartmentRepository.findAverageRentalPriceGroupedByCity()).thenReturn(averagePrices);
        
        // When
        List<Object[]> result = apartmentService.findAverageRentalPriceGroupedByCity();
        
        // Then
        assertEquals(1, result.size());
        assertEquals("Warsaw", result.get(0)[0]);
        assertEquals(1000.0, result.get(0)[1]);
        verify(apartmentRepository).findAverageRentalPriceGroupedByCity();
    }
    
    @Test
    @DisplayName("Should find average rental price by owner")
    void shouldFindAverageRentalPriceGroupedByOwner() {
        // Given
        List<Object[]> averagePrices = new ArrayList<>();
        averagePrices.add(new Object[] {"owner", 1000.0});
        when(apartmentRepository.findAverageRentalPriceGroupedByOwner()).thenReturn(averagePrices);
        
        // When
        List<Object[]> result = apartmentService.findAverageRentalPriceGroupedByOwner();
        
        // Then
        assertEquals(1, result.size());
        assertEquals("owner", result.get(0)[0]);
        assertEquals(1000.0, result.get(0)[1]);
        verify(apartmentRepository).findAverageRentalPriceGroupedByOwner();
    }
    
    @Test
    @DisplayName("Should find by amenities")
    void shouldFindByAmenities() {
        // Given
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByAmenities(true, true, true, AccessibilityType.PRIVATE, true)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByAmenities(true, true, true, AccessibilityType.PRIVATE, true);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByAmenities(true, true, true, AccessibilityType.PRIVATE, true);
    }
    
    @Test
    @DisplayName("Should find by property type")
    void shouldFindByPropertyType() {
        // Given
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByPropertyType(PropertyType.APARTMENT)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByPropertyType(PropertyType.APARTMENT);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByPropertyType(PropertyType.APARTMENT);
    }
    
    @Test
    @DisplayName("Should find by accessibility features")
    void shouldFindByAccessibilityFeatures() {
        // Given
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentRepository.findByAccessibilityFeatures(AccessibilityType.SHARED, AccessibilityType.PRIVATE, true)).thenReturn(apartments);
        
        // When
        List<Apartment> result = apartmentService.findByAccessibilityFeatures(AccessibilityType.SHARED, AccessibilityType.PRIVATE, true);
        
        // Then
        assertEquals(1, result.size());
        verify(apartmentRepository).findByAccessibilityFeatures(AccessibilityType.SHARED, AccessibilityType.PRIVATE, true);
    }
    
    @Test
    @DisplayName("Should get apartment count")
    void shouldGetApartmentCount() {
        // Given
        when(apartmentRepository.count()).thenReturn(10L);
        
        // When
        long result = apartmentService.getApartmentCount();
        
        // Then
        assertEquals(10L, result);
        verify(apartmentRepository).count();
    }
    
    @Test
    @DisplayName("Should throw exception when updating apartment with user who is not an owner")
    void shouldThrowExceptionWhenUpdatingApartmentWithNonOwner() {
        // Given
        User notOwner = User.builder()
                .id(2L)
                .username("notowner")
                .roles(Collections.singleton(Role.TENANT))
                .build();
                
        Apartment updatedApartment = new Apartment();
        updatedApartment.setOwner(notOwner);
        
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(2L)).thenReturn(Optional.of(notOwner));
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> apartmentService.updateApartment(1L, updatedApartment)
        );
        
        assertEquals("Apartment can only be owned by a user with OWNER role", exception.getMessage());
    }
}