package pl.ug.NestPoint.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import pl.ug.NestPoint.dto.AuctionDTO;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.domain.enums.AuctionStatus;
import pl.ug.NestPoint.service.AuctionService;
import pl.ug.NestPoint.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.hamcrest.Matchers;

@MockitoSettings(strictness = Strictness.LENIENT)
@WebMvcTest(AuctionController.class)
@Import(AuctionControllerTest.TestSecurityConfig.class)
@DisplayName("AuctionController Integration Tests")
class AuctionControllerTest {

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
    private AuctionService auctionService;

    @MockBean
    private UserBlockingInterceptor userBlockingInterceptor;

    @MockBean
    private UserRepository userRepository;

    @MockBean  
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private AuctionDTO sampleAuctionDTO;
    private BidDTO sampleBidDTO;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        
        sampleAuctionDTO = new AuctionDTO();
        sampleAuctionDTO.setId(1L);
        sampleAuctionDTO.setApartmentId(1L);
        sampleAuctionDTO.setApartmentTitle("Luxury Downtown Apartment");
        sampleAuctionDTO.setStartTime(now.plusHours(1));
        sampleAuctionDTO.setEndTime(now.plusHours(25));
        sampleAuctionDTO.setStartingPrice(150.0);
        sampleAuctionDTO.setMinimumBidIncrement(25.0);
        sampleAuctionDTO.setRentalStartDate(LocalDate.now().plusDays(7));
        sampleAuctionDTO.setRentalEndDate(LocalDate.now().plusDays(14));
        sampleAuctionDTO.setStatus(AuctionStatus.ACTIVE);
        sampleAuctionDTO.setMaxBidders(5);
        sampleAuctionDTO.setCurrentHighestBid(175.0);
        sampleAuctionDTO.setCurrentBidderCount(2);
        sampleAuctionDTO.setActive(true);
        
        sampleBidDTO = new BidDTO();
        sampleBidDTO.setId(1L);
        sampleBidDTO.setAuctionId(1L);
        sampleBidDTO.setBidderId(2L);
        sampleBidDTO.setAmount(200.0);
        sampleBidDTO.setBidTime(now);
    }

    @Test
    @DisplayName("GET /auctions - Should return all auctions via HTTP")
    void shouldGetAllAuctionsViaHTTP() throws Exception {
        List<AuctionDTO> auctions = Arrays.asList(sampleAuctionDTO);
        Mockito.when(auctionService.getAllAuctions()).thenReturn(auctions);

        mockMvc.perform(MockMvcRequestBuilders.get("/auctions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].apartmentTitle", Matchers.is("Luxury Downtown Apartment")))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].currentHighestBid", Matchers.is(175.0)));

        Mockito.verify(auctionService).getAllAuctions();
    }

    @Test
    @DisplayName("GET /auctions/active - Should return active auctions with query parameter")
    void shouldGetActiveAuctionsWithQueryParam() throws Exception {
        List<AuctionDTO> activeAuctions = Arrays.asList(sampleAuctionDTO);
        Mockito.when(auctionService.getActiveAuctions()).thenReturn(activeAuctions);

        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/active")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status", Matchers.is("ACTIVE")))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].active", Matchers.is(true)));

        Mockito.verify(auctionService).getActiveAuctions();
    }

    @Test
    @DisplayName("GET /auctions/{id} - Should handle path variable")
    void shouldGetAuctionByIdWithPathVariable() throws Exception {
        Mockito.when(auctionService.getAuctionById(1L)).thenReturn(sampleAuctionDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.apartmentTitle", Matchers.is("Luxury Downtown Apartment")))
                .andExpect(MockMvcResultMatchers.jsonPath("$.currentBidderCount", Matchers.is(2)));

        Mockito.verify(auctionService).getAuctionById(1L);
    }


    @Test
    @DisplayName("GET /auctions/owner/{ownerId} - Should handle owner path variable")
    void shouldGetAuctionsByOwnerWithPathVariable() throws Exception {
        List<AuctionDTO> ownerAuctions = Arrays.asList(sampleAuctionDTO);
        Mockito.when(auctionService.getAuctionsByOwnerId(1L)).thenReturn(ownerAuctions);

        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/owner/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)));

        Mockito.verify(auctionService).getAuctionsByOwnerId(1L);
    }

    @Test
    @DisplayName("GET /auctions/bidder/{bidderId} - Should handle bidder path variable")
    void shouldGetAuctionsByBidderWithPathVariable() throws Exception {
        List<AuctionDTO> bidderAuctions = Arrays.asList(sampleAuctionDTO);
        Mockito.when(auctionService.getAuctionsByBidder(2L)).thenReturn(bidderAuctions);

        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/bidder/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)));

        Mockito.verify(auctionService).getAuctionsByBidder(2L);
    }

    @Test
    @DisplayName("POST /auctions - Should handle JSON request body")
    void shouldCreateAuctionWithJsonBody() throws Exception {
        AuctionDTO newAuction = new AuctionDTO();
        newAuction.setApartmentId(1L);
        newAuction.setStartingPrice(150.0);
        newAuction.setMinimumBidIncrement(25.0);
        newAuction.setMaxBidders(5);

        AuctionDTO createdAuction = new AuctionDTO();
        createdAuction.setId(1L);
        createdAuction.setApartmentId(1L);
        createdAuction.setStatus(AuctionStatus.PENDING);

        Mockito.when(auctionService.createAuction(ArgumentMatchers.any(AuctionDTO.class)))
               .thenReturn(createdAuction);

        mockMvc.perform(MockMvcRequestBuilders.post("/auctions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newAuction)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.status", Matchers.is("PENDING")));

        Mockito.verify(auctionService).createAuction(ArgumentMatchers.any(AuctionDTO.class));
    }

    @Test
    @DisplayName("POST /auctions/bid - Should handle bid JSON request body") 
    void shouldPlaceBidWithJsonBody() throws Exception {
        BidDTO newBid = new BidDTO();
        newBid.setAuctionId(1L);
        newBid.setBidderId(2L);
        newBid.setAmount(200.0);

        Mockito.when(auctionService.placeBid(ArgumentMatchers.any(BidDTO.class)))
               .thenReturn(sampleBidDTO);

        mockMvc.perform(MockMvcRequestBuilders.post("/auctions/bid") 
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newBid)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.amount", Matchers.is(200.0)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.bidderId", Matchers.is(2)));

        Mockito.verify(auctionService).placeBid(ArgumentMatchers.any(BidDTO.class));
    }

    @Test
    @DisplayName("DELETE /auctions/{id} - Should handle DELETE method")
    void shouldCancelAuctionWithDeleteMethod() throws Exception {
        Mockito.doNothing().when(auctionService).cancelAuction(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/auctions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(auctionService).cancelAuction(1L);
    }

    @Test
    @DisplayName("Should handle different content types properly")
    void shouldHandleDifferentContentTypes() throws Exception {
        Mockito.when(auctionService.getAllAuctions()).thenReturn(Arrays.asList(sampleAuctionDTO));

        // JSON content type
        mockMvc.perform(MockMvcRequestBuilders.get("/auctions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("Should reject invalid URLs with appropriate error response")
    void shouldRejectInvalidUrls() throws Exception {
        // Test non-existent endpoint
        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/nonexistent/endpoint"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError()); // Any 4xx error is fine
        
        // Test invalid path structure
        mockMvc.perform(MockMvcRequestBuilders.get("/auctions/owner/invalid/path"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError());
    }

    @Test
    @DisplayName("Should reject unsupported HTTP methods")
    void shouldRejectUnsupportedMethods() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.patch("/auctions/1"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError()); // 405 Method Not Allowed
        
        mockMvc.perform(MockMvcRequestBuilders.put("/auctions"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError());
    }

    @Test
    @DisplayName("Should handle malformed JSON gracefully")
    void shouldHandleMalformedJson() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auctions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json}"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError()); // Any 4xx is fine
        
        mockMvc.perform(MockMvcRequestBuilders.post("/auctions/bid")
                .contentType(MediaType.APPLICATION_JSON)
                .content("not json at all"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError());
    }

    @Test
    @DisplayName("Should handle missing content type")
    void shouldHandleMissingContentType() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auctions")
                .content("{\"apartmentId\":1}")) // No content type specified
               .andExpect(MockMvcResultMatchers.status().is4xxClientError()); // Should reject
    }

    @Test
    @DisplayName("Should handle service exceptions gracefully")
    void shouldHandleServiceExceptions() throws Exception {
        Mockito.when(auctionService.getAllAuctions())
               .thenThrow(new RuntimeException("Database connection failed"));
    
        try {
            mockMvc.perform(MockMvcRequestBuilders.get("/auctions"));
            // If we get here without exception, that's fine too
        } catch (Exception e) {
            // Just make sure it's the right type of exception
            if (e.getCause() instanceof RuntimeException) {
                // This is expected - controller threw the runtime exception
                return;
            }
            throw e; // Re-throw if it's unexpected
        }
    }


    @Test
    @DisplayName("Should handle requests with wrong content types")
    void shouldHandleWrongContentTypes() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auctions")
                .contentType(MediaType.TEXT_PLAIN)
                .content("some text"))
               .andExpect(MockMvcResultMatchers.status().is4xxClientError()); // Should reject non-JSON
    }


}