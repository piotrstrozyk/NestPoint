package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.Conversation;
import pl.ug.NestPoint.domain.Rental;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.Address;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.RentalDTO;
import pl.ug.NestPoint.dto.RentalSearchCriteria;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.ConversationRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
@DisplayName("RentalService Tests")
class RentalServiceTest {

    @Mock
    private RentalRepository rentalRepository;
    
    @Mock
    private ApartmentRepository apartmentRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ConversationRepository conversationRepository;
    
    @InjectMocks
    private RentalService rentalService;
    
    private Rental testRental;
    private RentalDTO testRentalDTO;
    private Apartment testApartment;
    private User testOwner;
    private User testTenant;
    private LocalDate startDate;
    private LocalDate endDate;
    private Pageable pageable;
    
    @BeforeEach
    void setUp() {
        startDate = LocalDate.now().plusDays(1);
        endDate = LocalDate.now().plusDays(5);
        pageable = PageRequest.of(0, 10, Sort.by("id").ascending());
        
        testOwner = new User();
        testOwner.setId(1L);
        testOwner.setUsername("owner");
        testOwner.setEmail("owner@test.com");
        testOwner.setRoles(Set.of(Role.OWNER));
        
        testTenant = new User();
        testTenant.setId(2L);
        testTenant.setUsername("tenant");
        testTenant.setEmail("tenant@test.com");
        testTenant.setRoles(Set.of(Role.TENANT));
        
        testApartment = new Apartment();
        testApartment.setId(1L);
        testApartment.setTitle("Test Apartment");
        testApartment.setDescription("A nice test apartment with all amenities");
        testApartment.setRentalPrice(100.0);
        testApartment.setOwner(testOwner);
        testApartment.setSize(50);
        testApartment.setNumberOfRooms(2);
        testApartment.setNumberOfBeds(1);
        testApartment.setPropertyType(PropertyType.APARTMENT);
        
        Address address = new Address();
        address.setStreet("Test Street 123");
        address.setCity("Warsaw");
        address.setCountry("Poland");
        address.setPostalCode("00-001");
        testApartment.setAddress(address);
        
        testRental = new Rental();
        testRental.setId(1L);
        testRental.setApartment(testApartment);
        testRental.setOwner(testOwner);
        testRental.setTenant(testTenant);
        testRental.setStartDate(startDate);
        testRental.setEndDate(endDate);
        testRental.setStatus(RentalStatus.PENDING);
        testRental.setRentalFees(50.0);
        
        testRentalDTO = new RentalDTO();
        testRentalDTO.setApartmentId(1L);
        testRentalDTO.setTenantId(2L);
        testRentalDTO.setStartDate(startDate);
        testRentalDTO.setEndDate(endDate);
        testRentalDTO.setRentalFees(50.0);
        testRentalDTO.setStatus("PENDING");
    }
    
    
    @Test
    @DisplayName("Should get rental by ID when exists")
    void shouldGetRentalById() {
        // Given
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        
        // When
        Rental result = rentalService.getRentalById(1L);
        
        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Apartment", result.getApartment().getTitle());
        assertEquals(testOwner.getId(), result.getOwner().getId());
        verify(rentalRepository).findById(1L);
    }
    
    @Test
    @DisplayName("Should return null when rental not found")
    void shouldReturnNullWhenRentalNotFound() {
        // Given
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When
        Rental result = rentalService.getRentalById(999L);
        
        // Then
        assertNull(result);
        verify(rentalRepository).findById(999L);
    }
    
    
    @Test
    @DisplayName("Should create rental with correct cost calculation")
    void shouldCreateRentalWithCorrectCostCalculation() {
        // Given
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(2L)).thenReturn(Optional.of(testTenant));
        when(conversationRepository.findByRentalId(anyLong())).thenReturn(Optional.empty());
        
        testApartment.setRentals(new ArrayList<>());
        
        when(rentalRepository.saveAndFlush(any(Rental.class))).thenAnswer(invocation -> {
            Rental savedRental = invocation.getArgument(0);
            savedRental.setId(1L); 
            return savedRental;
        });
        
        // When
        Rental result = rentalService.createRental(testRentalDTO);
        
        // Then
        assertNotNull(result);
        assertEquals(testApartment.getId(), result.getApartment().getId());
        assertEquals(testTenant.getId(), result.getTenant().getId());
        assertEquals(testOwner.getId(), result.getOwner().getId());
        assertEquals(startDate, result.getStartDate());
        assertEquals(endDate, result.getEndDate());
        assertEquals(50.0, result.getRentalFees());
        assertEquals(RentalStatus.PENDING, result.getStatus());
        
        assertTrue(result.getStartDate().isBefore(result.getEndDate()));
        assertEquals(100.0, result.getApartment().getRentalPrice()); // Test apartment price is set correctly
        
        verify(apartmentRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(rentalRepository).saveAndFlush(any(Rental.class));
        verify(conversationRepository).save(any(Conversation.class));
    }
    
    @Test
    @DisplayName("Should throw exception when apartment not found")
    void shouldThrowExceptionWhenApartmentNotFound() {
        // Given
        when(apartmentRepository.findById(999L)).thenReturn(Optional.empty());
        testRentalDTO.setApartmentId(999L);
        
        // When & Then
        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class,
            () -> rentalService.createRental(testRentalDTO)
        );
        
        assertEquals("Apartment not found", exception.getMessage());
        verify(rentalRepository, never()).saveAndFlush(any());
    }
    
    @Test
    @DisplayName("Should throw exception when tenant not found")
    void shouldThrowExceptionWhenTenantNotFound() {
        // Given
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        testRentalDTO.setTenantId(999L);
        
        // When & Then
        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class,
            () -> rentalService.createRental(testRentalDTO)
        );
        
        assertEquals("Tenant not found", exception.getMessage());
        verify(rentalRepository, never()).saveAndFlush(any());
    }
    
    @Test
    @DisplayName("Should throw exception when user lacks TENANT role")
    void shouldThrowExceptionWhenUserLacksTenantRole() {
        // Given
        User nonTenant = new User();
        nonTenant.setId(3L);
        nonTenant.setUsername("notTenant");
        nonTenant.setRoles(Set.of(Role.OWNER));
        
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(3L)).thenReturn(Optional.of(nonTenant));
        testRentalDTO.setTenantId(3L);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> rentalService.createRental(testRentalDTO)
        );
        
        assertEquals("User must have TENANT role to create a rental", exception.getMessage());
        verify(rentalRepository, never()).saveAndFlush(any());
    }
    
    @Test
    @DisplayName("Should throw exception when apartment has overlapping rental")
    void shouldThrowExceptionWhenApartmentHasOverlappingRental() {
        // Given
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(2L)).thenReturn(Optional.of(testTenant));
        
        Rental existingRental = new Rental();
        existingRental.setId(2L);
        existingRental.setStartDate(startDate.minusDays(1)); // Overlaps!
        existingRental.setEndDate(startDate.plusDays(2));    // Overlaps!
        existingRental.setStatus(RentalStatus.ACTIVE);
        
        List<Rental> existingRentals = new ArrayList<>();
        existingRentals.add(existingRental);
        testApartment.setRentals(existingRentals);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> rentalService.createRental(testRentalDTO)
        );
        
        assertEquals("Apartment is already booked for these dates", exception.getMessage());
        verify(rentalRepository, never()).saveAndFlush(any());
    }
    
    @Test
    @DisplayName("Should update rental status from PENDING to ACTIVE")
    void shouldUpdateRentalStatusFromPendingToActive() {
        // Given
        testRental.setStatus(RentalStatus.PENDING);
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenReturn(testRental);
        
        // When
        Rental result = rentalService.updateRentalStatus(1L, "ACTIVE", null);
        
        // Then
        assertNotNull(result);
        assertEquals(RentalStatus.ACTIVE, result.getStatus());
        verify(rentalRepository).save(testRental);
    }
    
    @Test
    @DisplayName("Should throw exception for invalid status transition")
    void shouldThrowExceptionForInvalidStatusTransition() {
        // Given
        testRental.setStatus(RentalStatus.PENDING);
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> rentalService.updateRentalStatus(1L, "COMPLETED", null)
        );
        
        assertEquals("Invalid status transition from PENDING", exception.getMessage());
        verify(rentalRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should cancel rental with reason")
    void shouldCancelRentalWithReason() {
        // Given
        testRental.setStatus(RentalStatus.PENDING);
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenReturn(testRental);
        
        // When
        Rental result = rentalService.cancelRental(1L, "Tenant changed mind");
        
        // Then
        assertNotNull(result);
        assertEquals(RentalStatus.CANCELLED, result.getStatus());
        verify(rentalRepository).save(testRental);
    }

    
    @Test
    @DisplayName("Should search rentals by address")
    void shouldSearchRentalsByAddress() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(List.of(testRental));
        RentalSearchCriteria criteria = new RentalSearchCriteria();
        criteria.setAddress("Warsaw");
        
        when(rentalRepository.findByApartmentAddressContaining(eq("Warsaw"), any(Pageable.class)))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.searchRentals(criteria, 0, 10, "id", "asc");
        
        // Then
        assertEquals(1, result.getTotalElements());
        assertEquals("Warsaw", result.getContent().get(0).getApartment().getAddress().getCity());
        verify(rentalRepository).findByApartmentAddressContaining(eq("Warsaw"), any(Pageable.class));
    }
    
    @Test
    @DisplayName("Should search rentals by status")
    void shouldSearchRentalsByStatus() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(List.of(testRental));
        RentalSearchCriteria criteria = new RentalSearchCriteria();
        criteria.setRentalStatus("PENDING");
        
        when(rentalRepository.findByStatus(eq(RentalStatus.PENDING), any(Pageable.class)))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.searchRentals(criteria, 0, 10, "id", "asc");
        
        // Then
        assertEquals(1, result.getTotalElements());
        assertEquals(RentalStatus.PENDING, result.getContent().get(0).getStatus());
        verify(rentalRepository).findByStatus(eq(RentalStatus.PENDING), any(Pageable.class));
    }
    
    @Test
    @DisplayName("Should find all rentals when no search criteria")
    void shouldFindAllRentalsWhenNoSearchCriteria() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(List.of(testRental));
        RentalSearchCriteria emptyCriteria = new RentalSearchCriteria();
        
        when(rentalRepository.findAll(any(Pageable.class))).thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.searchRentals(emptyCriteria, 0, 10, "id", "asc");
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findAll(any(Pageable.class));
    }
    
    @Test
    @DisplayName("Should find rentals by date range")
    void shouldFindRentalsByDateRange() {
        // Given
        LocalDate searchStart = LocalDate.now();
        LocalDate searchEnd = LocalDate.now().plusDays(10);
        List<Rental> mockRentals = List.of(testRental);
        
        when(rentalRepository.findByDateBetween(searchStart, searchEnd)).thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByDateRange(searchStart, searchEnd);
        
        // Then
        assertEquals(1, result.size());
        Rental foundRental = result.get(0);
        assertTrue(foundRental.getStartDate().isAfter(searchStart) || foundRental.getStartDate().isEqual(searchStart));
        assertTrue(foundRental.getEndDate().isBefore(searchEnd) || foundRental.getEndDate().isEqual(searchEnd));
        verify(rentalRepository).findByDateBetween(searchStart, searchEnd);
    }
    
    @Test
    @DisplayName("Should use default dates when null parameters provided")
    void shouldUseDefaultDatesWhenNullParametersProvided() {
        // Given
        List<Rental> mockRentals = List.of(testRental);
        when(rentalRepository.findByDateBetween(any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByDateRange(null, null);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByDateBetween(any(LocalDate.class), any(LocalDate.class));
    }
    
    @Test
    @DisplayName("Should update pending rentals to active when start date reached")
    void shouldUpdatePendingRentalsToActiveWhenStartDateReached() {
        // Given
        LocalDate today = LocalDate.now();
        Rental pendingRental = new Rental();
        pendingRental.setId(1L);
        pendingRental.setStatus(RentalStatus.PENDING);
        pendingRental.setStartDate(today.minusDays(1)); // Started yesterday
        
        List<Rental> pendingRentals = List.of(pendingRental);
        
        when(rentalRepository.findByStatusAndStartDateLessThanEqual(RentalStatus.PENDING, today))
            .thenReturn(pendingRentals);
        when(rentalRepository.findByStatusAndEndDateLessThan(RentalStatus.ACTIVE, today))
            .thenReturn(Collections.emptyList());
        
        // When
        rentalService.updateRentalStatuses();
        
        // Then
        assertEquals(RentalStatus.ACTIVE, pendingRental.getStatus());
        verify(rentalRepository).save(pendingRental);
    }
    
    @Test
    @DisplayName("Should update active rentals to completed when end date passed")
    void shouldUpdateActiveRentalsToCompletedWhenEndDatePassed() {
        // Given
        LocalDate today = LocalDate.now();
        Rental activeRental = new Rental();
        activeRental.setId(2L);
        activeRental.setStatus(RentalStatus.ACTIVE);
        activeRental.setEndDate(today.minusDays(1)); // Ended yesterday
        
        List<Rental> activeRentals = List.of(activeRental);
        
        when(rentalRepository.findByStatusAndStartDateLessThanEqual(RentalStatus.PENDING, today))
            .thenReturn(Collections.emptyList());
        when(rentalRepository.findByStatusAndEndDateLessThan(RentalStatus.ACTIVE, today))
            .thenReturn(activeRentals);
        
        // When
        rentalService.updateRentalStatuses();
        
        // Then
        assertEquals(RentalStatus.COMPLETED, activeRental.getStatus());
        verify(rentalRepository).save(activeRental);
    }
    
    @Test
    @DisplayName("Should delete rental when exists")
    void shouldDeleteRentalWhenExists() {
        // Given
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        
        // When
        rentalService.deleteRental(1L);
        
        // Then
        verify(rentalRepository).findById(1L);
        verify(rentalRepository).deleteById(1L);
    }
    
    @Test
    @DisplayName("Should throw exception when trying to delete non-existent rental")
    void shouldThrowExceptionWhenTryingToDeleteNonExistentRental() {
        // Given
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> rentalService.deleteRental(999L)
        );
        
        assertEquals("Rental not found", exception.getMessage());
        verify(rentalRepository, never()).deleteById(any());
    }
    
    @Test
    @DisplayName("Should get active rental count")
    void shouldGetActiveRentalCount() {
        // Given
        when(rentalRepository.countByStatus(RentalStatus.ACTIVE)).thenReturn(5L);
        
        // When
        long result = rentalService.getActiveRentalCount();
        
        // Then
        assertEquals(5L, result);
        verify(rentalRepository).countByStatus(RentalStatus.ACTIVE);
    }
    
    @Test
    @DisplayName("Should find average rental cost grouped by city")
    void shouldFindAverageRentalCostGroupedByCity() {
        // Given
        List<Object[]> mockResults = Arrays.asList(
            new Object[]{"Warsaw", 1200.0},
            new Object[]{"Krakow", 800.0}
        );
        when(rentalRepository.findAverageRentalCostGroupedByCity()).thenReturn(mockResults);
        
        // When
        List<Object[]> result = rentalService.findAverageRentalCostGroupedByCity();
        
        // Then
        assertEquals(2, result.size());
        assertEquals("Warsaw", result.get(0)[0]);
        assertEquals(1200.0, result.get(0)[1]);
        assertEquals("Krakow", result.get(1)[0]);
        assertEquals(800.0, result.get(1)[1]);
        verify(rentalRepository).findAverageRentalCostGroupedByCity();
    }

    @Test
    @DisplayName("Should get all rentals successfully")
    void shouldGetAllRentalsSuccessfully() {
        // Given
        List<Rental> rentals = Arrays.asList(testRental);
        when(rentalRepository.findAll()).thenReturn(rentals);
        
        // When
        List<Rental> result = rentalService.getAllRentals();
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testRental.getId(), result.get(0).getId());
        verify(rentalRepository).findAll();
    }

    @Test
    @DisplayName("Should find rentals by user name as tenant")
    void shouldFindRentalsByUserNameAsTenant() {
        // Given
        when(rentalRepository.findByOwnerName("tenant", Role.OWNER, pageable))
            .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(rentalRepository.findByTenantName("tenant", Role.TENANT, pageable))
            .thenReturn(new PageImpl<>(Arrays.asList(testRental)));
        
        // When
        Page<Rental> result = rentalService.findByUserName("tenant", pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByOwnerName("tenant", Role.OWNER, pageable);
        verify(rentalRepository).findByTenantName("tenant", Role.TENANT, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by apartment address")
    void shouldFindRentalsByApartmentAddress() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findByApartmentAddressContaining("Warsaw", pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findByApartmentAddressContaining("Warsaw", pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByApartmentAddressContaining("Warsaw", pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by tenant name")
    void shouldFindRentalsByTenantName() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findByTenantName("tenant", Role.TENANT, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findByTenantName("tenant", pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByTenantName("tenant", Role.TENANT, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by owner name")
    void shouldFindRentalsByOwnerName() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findByOwnerName("owner", Role.OWNER, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findByOwnerName("owner", pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByOwnerName("owner", Role.OWNER, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by date range with pageable")
    void shouldFindRentalsByDateRangeWithPageable() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findByDateRange(startDate, endDate, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findByDateRange(startDate, endDate, pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByDateRange(startDate, endDate, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by occupied status")
    void shouldFindRentalsByOccupiedStatus() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findByOccupied(true, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findByOccupied(true, pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findByOccupied(true, pageable);
    }
    
    @Test
    @DisplayName("Should find luxury rentals")
    void shouldFindLuxuryRentals() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findLuxuryRentals(2000.0, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findLuxuryRentals(pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findLuxuryRentals(2000.0, pageable);
    }
    
    @Test
    @DisplayName("Should find budget rentals")
    void shouldFindBudgetRentals() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findBudgetRentals(2000.0, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findBudgetRentals(pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findBudgetRentals(2000.0, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by total cost greater than")
    void shouldFindRentalsByTotalCostGreaterThan() {
        // Given
        Page<Rental> mockPage = new PageImpl<>(Arrays.asList(testRental));
        when(rentalRepository.findRentalsByTotalCostGreaterThan(500.0, pageable))
            .thenReturn(mockPage);
        
        // When
        Page<Rental> result = rentalService.findRentalsByTotalCostGreaterThan(500.0, pageable);
        
        // Then
        assertEquals(1, result.getTotalElements());
        verify(rentalRepository).findRentalsByTotalCostGreaterThan(500.0, pageable);
    }
    
    @Test
    @DisplayName("Should find rentals by apartment ID and date range")
    void shouldFindRentalsByApartmentIdAndDateRange() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByApartmentIdAndDateBetween(1L, startDate, endDate))
            .thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByApartmentIdAndDateRange(1L, startDate, endDate);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByApartmentIdAndDateBetween(1L, startDate, endDate);
    }
    
    @Test
    @DisplayName("Should find rentals by apartment ID with null dates")
    void shouldFindRentalsByApartmentIdWithNullDates() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByApartmentIdAndDateBetween(eq(1L), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByApartmentIdAndDateRange(1L, null, null);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByApartmentIdAndDateBetween(eq(1L), any(LocalDate.class), any(LocalDate.class));
    }
    
    @Test
    @DisplayName("Should find rentals by user ID and date range")
    void shouldFindRentalsByUserIdAndDateRange() {
        // Given
        List<Rental> ownerRentals = Arrays.asList(testRental);
        List<Rental> tenantRentals = Arrays.asList();
        when(rentalRepository.findByOwnerIdAndDateBetween(1L, startDate, endDate))
            .thenReturn(ownerRentals);
        when(rentalRepository.findByTenantIdAndDateBetween(1L, startDate, endDate))
            .thenReturn(tenantRentals);
        
        // When
        List<Rental> result = rentalService.findByUserIdAndDateRange(1L, startDate, endDate);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByOwnerIdAndDateBetween(1L, startDate, endDate);
        verify(rentalRepository).findByTenantIdAndDateBetween(1L, startDate, endDate);
    }
    
    @Test
    @DisplayName("Should find rentals by tenant ID and status")
    void shouldFindRentalsByTenantIdAndStatus() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByTenantIdAndStatus(2L, RentalStatus.PENDING))
            .thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByTenantIdAndStatus(2L, "PENDING");
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByTenantIdAndStatus(2L, RentalStatus.PENDING);
    }
    
    @Test
    @DisplayName("Should find rentals by owner ID and status")
    void shouldFindRentalsByOwnerIdAndStatus() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByOwnerIdAndStatus(1L, RentalStatus.PENDING))
            .thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByOwnerIdAndStatus(1L, "PENDING");
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByOwnerIdAndStatus(1L, RentalStatus.PENDING);
    }
    
    @Test
    @DisplayName("Should find rentals by tenant ID")
    void shouldFindRentalsByTenantId() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByTenantId(2L)).thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByTenantId(2L);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByTenantId(2L);
    }
    
    @Test
    @DisplayName("Should find rentals by owner ID")
    void shouldFindRentalsByOwnerId() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByOwnerId(1L)).thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByOwnerId(1L);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByOwnerId(1L);
    }
    
    @Test
    @DisplayName("Should update rental successfully with valid data")
    void shouldUpdateRentalSuccessfully() {
        // Given
        RentalDTO updateDTO = new RentalDTO();
        updateDTO.setStartDate(startDate.plusDays(1));
        updateDTO.setEndDate(endDate.plusDays(1));
        updateDTO.setRentalFees(75.0);
        updateDTO.setStatus("ACTIVE");
        updateDTO.setApartmentId(1L);
        
        testApartment.setRentals(new ArrayList<>());
        
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(rentalRepository.saveAndFlush(any(Rental.class))).thenAnswer(invocation -> {
            Rental savedRental = invocation.getArgument(0);
            return savedRental;
        });
        
        // When
        Rental result = rentalService.updateRental(1L, updateDTO);
        
        // Then
        assertNotNull(result);
        assertEquals(startDate.plusDays(1), result.getStartDate());
        assertEquals(endDate.plusDays(1), result.getEndDate());
        assertEquals(475.0, result.getTotalCost());
        assertEquals(RentalStatus.ACTIVE, result.getStatus());
        verify(rentalRepository).findById(1L);
        verify(apartmentRepository).findById(1L);
        verify(rentalRepository).saveAndFlush(testRental);
    }
    
    @Test
    @DisplayName("Should partially update rental with null fields")
    void shouldPartiallyUpdateRentalWithNullFields() {
        // Given 
        RentalDTO partialUpdateDTO = new RentalDTO();
        partialUpdateDTO.setRentalFees(99.0);
        partialUpdateDTO.setApartmentId(1L);
        partialUpdateDTO.setStartDate(testRental.getStartDate());
        partialUpdateDTO.setEndDate(testRental.getEndDate());
        
        LocalDate originalStartDate = testRental.getStartDate();
        LocalDate originalEndDate = testRental.getEndDate();
        RentalStatus originalStatus = testRental.getStatus();
        
        testApartment.setRentals(new ArrayList<>());
        
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(testApartment));
        when(rentalRepository.saveAndFlush(any(Rental.class))).thenAnswer(invocation -> {
            Rental savedRental = invocation.getArgument(0);
            return savedRental;
        });
        
        // When
        Rental result = rentalService.updateRental(1L, partialUpdateDTO);
        
        // Then
        assertNotNull(result);
        assertEquals(499.0, result.getTotalCost());
        assertEquals(originalStartDate, result.getStartDate());
        assertEquals(originalEndDate, result.getEndDate());
        assertEquals(originalStatus, result.getStatus());
        verify(apartmentRepository).findById(1L);
        verify(rentalRepository).saveAndFlush(testRental);
    }
    @Test
    @DisplayName("Should validate date range when updating rental")
    void shouldValidateDateRangeWhenUpdatingRental() {
        // Given
        RentalDTO invalidUpdateDTO = new RentalDTO();
        invalidUpdateDTO.setApartmentId(999L);
        
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(apartmentRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> rentalService.updateRental(1L, invalidUpdateDTO)
        );
        
        assertTrue(exception.getMessage().contains("Apartment not found"));
        verify(rentalRepository, never()).saveAndFlush(any());
    }
    
    @Test
    @DisplayName("Should create rental from auction successfully")
    void shouldCreateRentalFromAuctionSuccessfully() {
        // Given
        Rental auctionRental = new Rental();
        auctionRental.setApartment(testApartment);
        auctionRental.setTenant(testTenant);
        auctionRental.setStartDate(startDate);
        auctionRental.setEndDate(endDate);
        auctionRental.setRentalFees(100.0);
        
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental savedRental = invocation.getArgument(0);
            savedRental.setId(1L); 
            savedRental.setStatus(RentalStatus.PENDING);
            savedRental.setOwner(testApartment.getOwner()); 
            return savedRental;
        });
        
        when(conversationRepository.findByRentalId(anyLong())).thenReturn(Optional.empty());
        
        // When
        Rental result = rentalService.createRentalFromAuction(auctionRental);
        
        // Then
        assertNotNull(result);
        assertEquals(RentalStatus.PENDING, result.getStatus());
        assertEquals(testOwner, result.getOwner()); 
        verify(rentalRepository).save(auctionRental);
        verify(conversationRepository).save(any(Conversation.class));
    }
        
    @Test
    @DisplayName("Should throw exception when updating non-existent rental")
    void shouldThrowExceptionWhenUpdatingNonExistentRental() {
        // Given
        RentalDTO updateDTO = new RentalDTO();
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then 
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class, 
            () -> rentalService.updateRental(999L, updateDTO)
        );
        
        assertTrue(exception.getMessage().contains("Rental not found"));
        verify(rentalRepository).findById(999L);
        verify(rentalRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should find rentals by apartment ID")
    void shouldFindRentalsByApartmentId() {
        // Given
        List<Rental> mockRentals = Arrays.asList(testRental);
        when(rentalRepository.findByApartmentId(1L)).thenReturn(mockRentals);
        
        // When
        List<Rental> result = rentalService.findByApartmentId(1L);
        
        // Then
        assertEquals(1, result.size());
        verify(rentalRepository).findByApartmentId(1L);
    }
    
    @Test
    @DisplayName("Should validate all status transitions correctly")
    void shouldValidateAllStatusTransitionsCorrectly() {
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        testRental.setStatus(RentalStatus.PENDING);
        when(rentalRepository.save(any(Rental.class))).thenReturn(testRental);
        
        Rental result1 = rentalService.updateRentalStatus(1L, "ACTIVE", null);
        assertEquals(RentalStatus.ACTIVE, result1.getStatus());
        
        testRental.setStatus(RentalStatus.ACTIVE);
        Rental result2 = rentalService.updateRentalStatus(1L, "COMPLETED", null);
        assertEquals(RentalStatus.COMPLETED, result2.getStatus());
        
        testRental.setStatus(RentalStatus.PENDING);
        Rental result3 = rentalService.updateRentalStatus(1L, "CANCELLED", "User cancelled");
        assertEquals(RentalStatus.CANCELLED, result3.getStatus());
    }
    
    @Test
    @DisplayName("Should handle rental status update with cancellation reason")
    void shouldHandleRentalStatusUpdateWithCancellationReason() {
        // Given
        testRental.setStatus(RentalStatus.ACTIVE);
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenReturn(testRental);
        
        // When
        Rental result = rentalService.updateRentalStatus(1L, "CANCELLED", "Emergency cancellation");
        
        // Then
        assertNotNull(result);
        assertEquals(RentalStatus.CANCELLED, result.getStatus());
        verify(rentalRepository).save(testRental);
    }
}