package pl.ug.NestPoint.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.*;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.mapper.RentalMapper;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.service.PaymentSimulationService;
import pl.ug.NestPoint.service.RentalService;

import java.time.LocalDate;
import java.util.*;

import org.hamcrest.Matchers;

@MockitoSettings(strictness = Strictness.LENIENT)
@WebMvcTest(RentalController.class)
@Import(RentalControllerTest.TestSecurityConfig.class)
@DisplayName("RentalController Tests")
public class RentalControllerTest {

    // Security configuration to disable security for tests
    @EnableWebSecurity
    public static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RentalService rentalService;

    @MockBean
    private UserRepository userRepository;


    @MockBean
    private UserBlockingInterceptor userBlockingInterceptor;

    @MockBean
    private RentalMapper rentalMapper;

    @MockBean
    private PaymentSimulationService paymentSimulationService;

    @Autowired
    private ObjectMapper objectMapper;

    private Rental testRental;
    private RentalDTO testRentalDTO;
    private User testOwner;
    private User testTenant;
    private Apartment testApartment;
    private LocalDate startDate;
    private LocalDate endDate;

    @BeforeEach
    void setUp() {
        // Setup dates
        startDate = LocalDate.now().plusDays(1);
        endDate = LocalDate.now().plusDays(5);

        // Setup owner
        Set<Role> ownerRoles = new HashSet<>();
        ownerRoles.add(Role.OWNER);
        testOwner = new User();
        testOwner.setId(1L);
        testOwner.setUsername("owner");
        testOwner.setRoles(ownerRoles);

        // Setup tenant
        Set<Role> tenantRoles = new HashSet<>();
        tenantRoles.add(Role.TENANT);
        testTenant = new User();
        testTenant.setId(2L);
        testTenant.setUsername("tenant");
        testTenant.setRoles(tenantRoles);

        // Setup apartment
        testApartment = new Apartment();
        testApartment.setId(1L);
        testApartment.setTitle("Test Apartment");
        testApartment.setRentalPrice(100.0);
        testApartment.setOwner(testOwner);

        // Setup rental
        testRental = new Rental();
        testRental.setId(1L);
        testRental.setApartment(testApartment);
        testRental.setOwner(testOwner);
        testRental.setTenant(testTenant);
        testRental.setStartDate(startDate);
        testRental.setEndDate(endDate);
        testRental.setStatus(RentalStatus.PENDING);
        testRental.setTotalCost(400.0);

        // Setup rental DTO
        testRentalDTO = new RentalDTO();
        testRentalDTO.setId(1L);
        testRentalDTO.setApartmentId(1L);
        testRentalDTO.setTenantId(2L);
        testRentalDTO.setStartDate(startDate);
        testRentalDTO.setEndDate(endDate);
        testRentalDTO.setRentalFees(50.0);
        testRentalDTO.setStatus("PENDING");
        testRentalDTO.setTotalCost(400.0);
        
        // Setup mapper behavior
        Mockito.when(rentalMapper.toDTO(ArgumentMatchers.any(Rental.class))).thenReturn(testRentalDTO);
    }

    @Test
    @DisplayName("Should get all rentals")
    void shouldGetAllRentals() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.getAllRentals()).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)));

        Mockito.verify(rentalService).getAllRentals();
    }

    @Test
    @DisplayName("Should get rental by ID")
    void shouldGetRentalById() throws Exception {
        Mockito.when(rentalService.getRentalById(1L)).thenReturn(testRental);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.apartmentId", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.tenantId", Matchers.is(2)));

        Mockito.verify(rentalService).getRentalById(1L);
    }

    @Test
    @DisplayName("Should return 404 when rental not found")
    void shouldReturn404WhenRentalNotFound() throws Exception {
        Mockito.when(rentalService.getRentalById(999L)).thenReturn(null);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(rentalService).getRentalById(999L);
    }

    @Test
    @DisplayName("Should reject direct rental creation")
    void shouldRejectDirectRentalCreation() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/rentals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testRentalDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success", Matchers.is(false)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message", Matchers.containsString("Direct rental creation is not allowed")));
    }

    @Test
    @DisplayName("Should update rental")
    void shouldUpdateRental() throws Exception {
        Mockito.when(rentalService.updateRental(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.any(RentalDTO.class))
        ).thenReturn(testRental);

        mockMvc.perform(MockMvcRequestBuilders.put("/rentals/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testRentalDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(rentalService).updateRental(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.any(RentalDTO.class)
        );
    }

    @Test
    @DisplayName("Should delete rental")
    void shouldDeleteRental() throws Exception {
        Mockito.doNothing().when(rentalService).deleteRental(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/rentals/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(rentalService).deleteRental(1L);
    }

    @Test
    @DisplayName("Should search rentals with criteria")
    void shouldSearchRentalsWithCriteria() throws Exception {
        RentalSearchCriteria criteria = new RentalSearchCriteria();
        criteria.setAddress("Warsaw");
        
        Page<Rental> rentalPage = new PageImpl<>(
            Collections.singletonList(testRental),
            PageRequest.of(0, 10),
            1
        );
        
        Mockito.when(rentalService.searchRentals(
            ArgumentMatchers.any(RentalSearchCriteria.class), 
            ArgumentMatchers.eq(0), 
            ArgumentMatchers.eq(10), 
            ArgumentMatchers.eq("id"), 
            ArgumentMatchers.eq("ASC"))
        ).thenReturn(rentalPage);

        mockMvc.perform(MockMvcRequestBuilders.post("/rentals/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criteria))
                .param("page", "0")
                .param("size", "10")
                .param("sortBy", "id")
                .param("direction", "ASC"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(rentalService).searchRentals(
            ArgumentMatchers.any(RentalSearchCriteria.class), 
            ArgumentMatchers.eq(0), 
            ArgumentMatchers.eq(10), 
            ArgumentMatchers.eq("id"), 
            ArgumentMatchers.eq("ASC")
        );
    }

    @Test
    @DisplayName("Should get tenant rentals without status filter")
    void shouldGetTenantRentalsWithoutStatusFilter() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.findByTenantId(2L)).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/my-rentals/tenant/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(rentalService).findByTenantId(2L);
    }

    @Test
    @DisplayName("Should get tenant rentals with status filter")
    void shouldGetTenantRentalsWithStatusFilter() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.findByTenantIdAndStatus(
            ArgumentMatchers.eq(2L), 
            ArgumentMatchers.anyString())
        ).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/my-rentals/tenant/2")
                .param("status", "PENDING")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(rentalService).findByTenantIdAndStatus(2L, "PENDING");
    }

    @Test
    @DisplayName("Should get owner rentals without status filter")
    void shouldGetOwnerRentalsWithoutStatusFilter() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.findByOwnerId(1L)).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/my-rentals/owner/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(rentalService).findByOwnerId(1L);
    }

    @Test
    @DisplayName("Should get owner rentals with status filter")
    void shouldGetOwnerRentalsWithStatusFilter() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.findByOwnerIdAndStatus(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.anyString())
        ).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/my-rentals/owner/1")
                .param("status", "ACTIVE")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(rentalService).findByOwnerIdAndStatus(1L, "ACTIVE");
    }

    @Test
    @DisplayName("Should update rental status")
    void shouldUpdateRentalStatus() throws Exception {
        Mockito.when(rentalService.updateRentalStatus(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.anyString(), 
            ArgumentMatchers.anyString())
        ).thenReturn(testRental);

        mockMvc.perform(MockMvcRequestBuilders.patch("/rentals/1/status")
                .param("status", "ACTIVE")
                .param("reason", "Approved by owner"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(rentalService).updateRentalStatus(1L, "ACTIVE", "Approved by owner");
    }

    @Test
    @DisplayName("Should cancel rental")
    void shouldCancelRental() throws Exception {
        Mockito.when(rentalService.cancelRental(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.anyString())
        ).thenReturn(testRental);

        mockMvc.perform(MockMvcRequestBuilders.post("/rentals/1/cancel")
                .param("reason", "Change of plans"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(rentalService).cancelRental(1L, "Change of plans");
    }

    @Test
    @DisplayName("Should get rentals for calendar by apartment ID")
    void shouldGetRentalsForCalendarByApartmentId() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        
        // Updated mock to match actual controller call with null date parameters
        Mockito.when(rentalService.findByApartmentIdAndDateRange(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.isNull(), 
            ArgumentMatchers.isNull())
        ).thenReturn(rentals);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/calendar")
                .param("apartmentId", "1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status", Matchers.is("PENDING")))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].color", Matchers.is("#FFA500")));
    
        Mockito.verify(rentalService).findByApartmentIdAndDateRange(
            ArgumentMatchers.eq(1L), 
            ArgumentMatchers.isNull(), 
            ArgumentMatchers.isNull()
        );
    }
    
    @Test
    @DisplayName("Should get rentals for calendar by user ID")
    void shouldGetRentalsForCalendarByUserId() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        
        // Updated mock to match actual controller call with null date parameters
        Mockito.when(rentalService.findByUserIdAndDateRange(
            ArgumentMatchers.eq(2L), 
            ArgumentMatchers.isNull(), 
            ArgumentMatchers.isNull())
        ).thenReturn(rentals);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/calendar")
                .param("userId", "2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        Mockito.verify(rentalService).findByUserIdAndDateRange(
            ArgumentMatchers.eq(2L), 
            ArgumentMatchers.isNull(), 
            ArgumentMatchers.isNull()
        );
    }

    @Test
    @DisplayName("Should get all rentals for calendar with date range")
    void shouldGetAllRentalsForCalendarWithDateRange() throws Exception {
        List<Rental> rentals = Collections.singletonList(testRental);
        Mockito.when(rentalService.findByDateRange(
            ArgumentMatchers.any(LocalDate.class), 
            ArgumentMatchers.any(LocalDate.class))
        ).thenReturn(rentals);

        mockMvc.perform(MockMvcRequestBuilders.get("/rentals/calendar")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(rentalService).findByDateRange(
            ArgumentMatchers.any(LocalDate.class), 
            ArgumentMatchers.any(LocalDate.class)
        );
    }

    @Test
    @DisplayName("Should create rental with successful payment")
    void shouldCreateRentalWithSuccessfulPayment() throws Exception {
        // Set up successful payment
        Mockito.when(paymentSimulationService.processPayment(ArgumentMatchers.anyString())).thenReturn(true);
        Mockito.when(rentalService.createRental(ArgumentMatchers.any(RentalDTO.class))).thenReturn(testRental);
        
        // Create test objects
        PaymentRequestDTO paymentRequest = new PaymentRequestDTO();
        paymentRequest.setCardNumber("4111111111111111");
        
        RentalWithPaymentDTO rentalWithPayment = new RentalWithPaymentDTO();
        rentalWithPayment.setRental(testRentalDTO);
        rentalWithPayment.setPayment(paymentRequest);

        mockMvc.perform(MockMvcRequestBuilders.post("/rentals/create-with-payment")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rentalWithPayment)))
                .andExpect(MockMvcResultMatchers.status().isCreated());

        Mockito.verify(paymentSimulationService).processPayment(ArgumentMatchers.anyString());
        Mockito.verify(rentalService).createRental(ArgumentMatchers.any(RentalDTO.class));
    }

    @Test
    @DisplayName("Should reject rental with failed payment")
    void shouldRejectRentalWithFailedPayment() throws Exception {
        // Set up failed payment
        Mockito.when(paymentSimulationService.processPayment(ArgumentMatchers.anyString())).thenReturn(false);
        
        // Create test objects
        PaymentRequestDTO paymentRequest = new PaymentRequestDTO();
        paymentRequest.setCardNumber("0000000000000000");
        
        RentalWithPaymentDTO rentalWithPayment = new RentalWithPaymentDTO();
        rentalWithPayment.setRental(testRentalDTO);
        rentalWithPayment.setPayment(paymentRequest);

        mockMvc.perform(MockMvcRequestBuilders.post("/rentals/create-with-payment")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rentalWithPayment)))
                .andExpect(MockMvcResultMatchers.status().isPaymentRequired())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success", Matchers.is(false)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message", Matchers.containsString("Payment declined")));

        Mockito.verify(paymentSimulationService).processPayment(ArgumentMatchers.anyString());
        Mockito.verify(rentalService, Mockito.never()).createRental(ArgumentMatchers.any(RentalDTO.class));
    }

    @Test
    @DisplayName("Should reject rental with missing payment information")
    void shouldRejectRentalWithMissingPaymentInfo() throws Exception {
        RentalWithPaymentDTO rentalWithPayment = new RentalWithPaymentDTO();
        rentalWithPayment.setRental(testRentalDTO);
        // No payment info

        mockMvc.perform(MockMvcRequestBuilders.post("/rentals/create-with-payment")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rentalWithPayment)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success", Matchers.is(false)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message", Matchers.containsString("Payment information is required")));

        Mockito.verify(paymentSimulationService, Mockito.never()).processPayment(ArgumentMatchers.anyString());
        Mockito.verify(rentalService, Mockito.never()).createRental(ArgumentMatchers.any(RentalDTO.class));
    }
}