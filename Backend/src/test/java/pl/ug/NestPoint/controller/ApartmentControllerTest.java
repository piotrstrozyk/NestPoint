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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;


import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.Address;
import pl.ug.NestPoint.domain.Photo;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.ApartmentDTO;
import pl.ug.NestPoint.dto.DateRangeDTO;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.mapper.ApartmentMapper;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.service.ApartmentService;
import pl.ug.NestPoint.service.GeocodingService;
import pl.ug.NestPoint.service.PhotoService;
import pl.ug.NestPoint.service.UserService;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.*;

import org.hamcrest.Matchers;

@MockitoSettings(strictness = Strictness.LENIENT)
@WebMvcTest(ApartmentController.class)  
@Import(ApartmentControllerTest.TestSecurityConfig.class)
@ActiveProfiles("test")
@DisplayName("ApartmentController Tests")
class ApartmentControllerTest {

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
    private ApartmentService apartmentService;

    @MockBean
    private ApartmentMapper apartmentMapper;

    @MockBean
    private PhotoService photoService;

    @MockBean
    private GeocodingService geocodingService;
    
    @MockBean
    private UserBlockingInterceptor userBlockingInterceptor;

    @MockBean
    private UserRepository userRepository;

    @MockBean  
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private Apartment testApartment;
    private ApartmentDTO testApartmentDTO;
    private Address testAddress;
    private Photo testPhoto;

    @BeforeEach
    void setUp() {
        testAddress = new Address();
        testAddress.setCity("Warsaw");
        testAddress.setStreet("Test Street 1");
        testAddress.setLatitude(52.2297);
        testAddress.setLongitude(21.0122);

        testApartment = new Apartment();
        testApartment.setId(1L);
        testApartment.setTitle("Luxury Downtown Apartment");
        testApartment.setRentalPrice(1500.0);
        testApartment.setPropertyType(PropertyType.APARTMENT);
        testApartment.setAddress(testAddress);
        testApartment.setSize(75);
        testApartment.setNumberOfRooms(2);
        testApartment.setNumberOfBeds(1);
        testApartment.setFurnished(true);
        

        testApartmentDTO = new ApartmentDTO();
        testApartmentDTO.setId(1L);
        testApartmentDTO.setTitle("Luxury Downtown Apartment");
        testApartmentDTO.setRentalPrice(1500.0);
        testApartmentDTO.setPropertyType(PropertyType.APARTMENT);
        testApartmentDTO.setAddress(testAddress);
        testApartmentDTO.setSize(75);
        testApartmentDTO.setNumberOfRooms(2);
        testApartmentDTO.setNumberOfBeds(1);
        testApartmentDTO.setFurnished(true);
        testApartmentDTO.setWifi(true);
        testApartmentDTO.setPetsAllowed(false);
        testApartmentDTO.setParkingSpace(true);

        testPhoto = new Photo();
        testPhoto.setId(1L);
        testPhoto.setFilePath("https://cloudinary.com/photo1.jpg");
        testPhoto.setApartment(testApartment);

        // Setup mapper behavior
        Mockito.when(apartmentMapper.toDTO(ArgumentMatchers.any(Apartment.class))).thenReturn(testApartmentDTO);
    }

    @Test
    @DisplayName("GET /apartments - Should return all apartments via HTTP")
    void shouldGetAllApartmentsViaHTTP() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        Mockito.when(apartmentService.getAllApartments()).thenReturn(apartments);

        mockMvc.perform(MockMvcRequestBuilders.get("/apartments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].title", Matchers.is("Luxury Downtown Apartment")))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].rentalPrice", Matchers.is(1500.0)));

        Mockito.verify(apartmentService).getAllApartments();
        Mockito.verify(apartmentMapper).toDTO(testApartment);
    }

    @Test
    @DisplayName("GET /apartments/property-type/{type} - Should handle property type path variable")
    void shouldSearchByPropertyTypeParameter() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        Mockito.when(apartmentService.findByPropertyType(PropertyType.APARTMENT)).thenReturn(apartments);

        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/property-type/APARTMENT") 
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].propertyType", Matchers.is("APARTMENT")));

        Mockito.verify(apartmentService).findByPropertyType(PropertyType.APARTMENT);
        }

        @Test
        @DisplayName("POST /apartments - Should handle multipart form with files")
        void shouldCreateApartmentWithMultipartForm() throws Exception {
        String apartmentJson = """
                {
                "title": "New Apartment",
                "rentalPrice": 1200.0,
                "propertyType": "APARTMENT",
                "size": 50,
                "numberOfRooms": 1,
                "numberOfBeds": 1,
                "furnished": true,
                "wifi": true,
                "petsAllowed": false,
                "parkingSpace": true,
                "address": {
                        "city": "Gdansk",
                        "street": "New Street 1",
                        "latitude": 54.3520,
                        "longitude": 18.6466
                }
                }
                """;

        MockMultipartFile photoFile = new MockMultipartFile(
                "photos", 
                "test-image.jpg", 
                "image/jpeg", 
                "test image content".getBytes());

        when(apartmentService.createApartment(any(ApartmentDTO.class)))
                .thenReturn(testApartment);
        when(photoService.uploadPhotoForApartment(eq(1L), any()))
                .thenReturn(testPhoto);

        mockMvc.perform(multipart("/apartments")
                .file(photoFile)
                .param("details", apartmentJson)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Luxury Downtown Apartment")));

        verify(apartmentService).createApartment(any(ApartmentDTO.class));
        verify(photoService).uploadPhotoForApartment(eq(1L), any());
        }

        
        @Test
        @DisplayName("POST /apartments - Should return 500 for invalid JSON")
        void shouldReturn400ForInvalidJson() throws Exception {
            String invalidJson = "{ invalid json }";
        
            MockMultipartFile invalidFile = new MockMultipartFile(
                "details", 
                "apartment.json", 
                "application/json", 
                invalidJson.getBytes());
        
            mockMvc.perform(MockMvcRequestBuilders.multipart("/apartments")
                    .file(invalidFile)
                    .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(MockMvcResultMatchers.status().isInternalServerError());
        }

    @Test
    @DisplayName("PUT /apartments/{id} - Should handle JSON request body")
    void shouldUpdateApartmentWithJsonBody() throws Exception {
        Apartment updatedApartment = new Apartment();
        updatedApartment.setId(1L);
        updatedApartment.setTitle("Updated Apartment");

        ApartmentDTO updateDTO = new ApartmentDTO();
        updateDTO.setTitle("Updated Apartment");
        updateDTO.setRentalPrice(1800.0);

        Mockito.when(apartmentMapper.toEntity(ArgumentMatchers.any(ApartmentDTO.class)))
               .thenReturn(updatedApartment);
        Mockito.when(apartmentService.updateApartment(ArgumentMatchers.eq(1L), ArgumentMatchers.any()))
               .thenReturn(updatedApartment);

        mockMvc.perform(MockMvcRequestBuilders.put("/apartments/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Mockito.verify(apartmentMapper).toEntity(ArgumentMatchers.any(ApartmentDTO.class));
        Mockito.verify(apartmentService).updateApartment(ArgumentMatchers.eq(1L), ArgumentMatchers.any());
    }

    @Test
    @DisplayName("GET /apartments/999 - Should return 404 for non-existent apartment")
    void shouldReturn404ForNonExistentApartment() throws Exception {
        Mockito.when(apartmentService.getApartmentById(999L)).thenReturn(null);

        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(apartmentService).getApartmentById(999L);
    }

    @Test
    @DisplayName("GET /apartments/amenities - Should handle multiple query parameters")
    void shouldSearchByAmenitiesWithQueryParams() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        Mockito.when(apartmentService.findByAmenities(
            ArgumentMatchers.eq(true), 
            ArgumentMatchers.eq(true), 
            ArgumentMatchers.eq(false), 
            ArgumentMatchers.eq(AccessibilityType.PRIVATE), 
            ArgumentMatchers.eq(true))
        ).thenReturn(apartments);

        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/amenities")
                .param("needsWifi", "true")
                .param("needsParking", "true")
                .param("allowsPets", "false")
                .param("kitchenType", "PRIVATE")
                .param("needsDisabilityAccess", "true")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(apartmentService).findByAmenities(true, true, false, AccessibilityType.PRIVATE, true);
    }

    @Test
    @DisplayName("GET /apartments/available - Should handle date parameters")
    void shouldGetAvailableApartmentsWithDateParam() throws Exception {
        LocalDate testDate = LocalDate.of(2025, 6, 15);
        List<Apartment> apartments = Arrays.asList(testApartment);
        Mockito.when(apartmentService.findAvailableOnDate(testDate)).thenReturn(apartments);

        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/available")
                .param("date", "2025-06-15")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));

        Mockito.verify(apartmentService).findAvailableOnDate(testDate);
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by availableOn date")
    void shouldSearchByAvailableOnDate() throws Exception {
        LocalDate testDate = LocalDate.of(2025, 6, 15);
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findAvailableOnDate(testDate)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("availableOn", "2025-06-15")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findAvailableOnDate(testDate);
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by date range")
    void shouldSearchByDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2025, 6, 15);
        LocalDate endDate = LocalDate.of(2025, 6, 20);
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findAvailableBetweenDates(startDate, endDate)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("availableFrom", "2025-06-15")
                .param("availableTo", "2025-06-20")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findAvailableBetweenDates(startDate, endDate);
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by owner name")
    void shouldSearchByOwnerName() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findByOwnerName("John")).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("ownerName", "John")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findByOwnerName("John");
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by address")
    void shouldSearchByAddress() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findByAddressContaining("Warsaw")).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("address", "Warsaw")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findByAddressContaining("Warsaw");
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by size")
    void shouldSearchBySize() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findBySizeGreaterThan(50)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("size", "50")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findBySizeGreaterThan(50);
    }
    
    @Test
    @DisplayName("GET /apartments/search - Should search by price range")
    void shouldSearchByPriceRange() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findByRentalPriceBetween(1000.0, 2000.0)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/search")
                .param("minPrice", "1000.0")
                .param("maxPrice", "2000.0")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findByRentalPriceBetween(1000.0, 2000.0);
    }
    
    @Test
    @DisplayName("GET /apartments/available/range - Should get available apartments in date range")
    void shouldGetAvailableApartmentsInRange() throws Exception {
        LocalDate startDate = LocalDate.of(2025, 6, 15);
        LocalDate endDate = LocalDate.of(2025, 6, 20);
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findAvailableBetweenDates(startDate, endDate)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/available/range")
                .param("startDate", "2025-06-15")
                .param("endDate", "2025-06-20")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findAvailableBetweenDates(startDate, endDate);
    }
    
    @Test
    @DisplayName("GET /apartments/occupied - Should get occupied apartments")
    void shouldGetOccupiedApartments() throws Exception {
        LocalDate testDate = LocalDate.of(2025, 6, 15);
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findOccupiedOnDate(testDate)).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/occupied")
                .param("date", "2025-06-15")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findOccupiedOnDate(testDate);
    }
    
    @Test
    @DisplayName("GET /apartments/{id}/availability - Should get apartment availability")
    void shouldGetApartmentAvailability() throws Exception {
        List<DateRangeDTO> occupiedRanges = Arrays.asList(new DateRangeDTO());
        List<DateRangeDTO> availableRanges = Arrays.asList(new DateRangeDTO());
        
        when(apartmentService.getOccupiedDateRanges(1L)).thenReturn(occupiedRanges);
        when(apartmentService.getAvailableDateRanges(1L, 12)).thenReturn(availableRanges);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/1/availability")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.occupiedRanges").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.availableRanges").exists());
    
        verify(apartmentService).getOccupiedDateRanges(1L);
        verify(apartmentService).getAvailableDateRanges(1L, 12);
    }

    
    @Test
    @DisplayName("GET /apartments/accessibility - Should find by accessibility features")
    void shouldFindByAccessibilityFeatures() throws Exception {
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.findByAccessibilityFeatures(
            AccessibilityType.PRIVATE, AccessibilityType.SHARED, true))
            .thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/accessibility")
                .param("poolAccess", "PRIVATE")
                .param("yardAccess", "SHARED")
                .param("disabilityFriendly", "true")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)));
    
        verify(apartmentService).findByAccessibilityFeatures(
            AccessibilityType.PRIVATE, AccessibilityType.SHARED, true);
    }
    

    
    @Test
    @DisplayName("GET /apartments/{id}/calculate-price - Should calculate rental price")
    void shouldCalculateRentalPrice() throws Exception {
        LocalDate startDate = LocalDate.of(2025, 6, 15);
        LocalDate endDate = LocalDate.of(2025, 6, 20);
        
        Apartment mockApartment = Mockito.mock(Apartment.class);
        
        when(apartmentService.getApartmentById(1L)).thenReturn(mockApartment);
        when(mockApartment.getId()).thenReturn(1L);
        when(mockApartment.getTitle()).thenReturn("Test Apartment");
        when(mockApartment.getRentalPrice()).thenReturn(1500.0); 
        when(mockApartment.getPoolAccess()).thenReturn(AccessibilityType.PRIVATE); 
        when(mockApartment.getPoolFee()).thenReturn(500.0); 
        
        // Expected values
        double expectedNights = 5;
        double expectedBasePrice = 1500.0 * expectedNights; 
        double expectedPoolFee = 500.0;
        double expectedTotalPrice = expectedBasePrice + expectedPoolFee;
        
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/1/calculate-price")
                .param("startDate", "2025-06-15")
                .param("endDate", "2025-06-20")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.apartmentId", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.title", Matchers.is("Test Apartment")))
                .andExpect(MockMvcResultMatchers.jsonPath("$.nights", Matchers.is(5)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.basePrice", Matchers.is(7500.0)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.poolFee", Matchers.is(500.0)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.totalPrice", Matchers.is(8000.0)));
        
        verify(apartmentService).getApartmentById(1L);
    }
    
    @Test
    @DisplayName("GET /apartments/{id}/calculate-price - Should return error for invalid date range")
    void shouldReturnErrorForInvalidDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2025, 6, 20);
        LocalDate endDate = LocalDate.of(2025, 6, 15);
        
        when(apartmentService.getApartmentById(1L)).thenReturn(testApartment);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/1/calculate-price")
                .param("startDate", "2025-06-20")
                .param("endDate", "2025-06-15")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").exists());
    
        verify(apartmentService).getApartmentById(1L);
    }
    
    @Test
    @DisplayName("GET /apartments/{id}/photos - Should get apartment photos")
    void shouldGetApartmentPhotos() throws Exception {
        testPhoto.setFilePath("https://example.com/photo1.jpg");
        List<Photo> photos = Arrays.asList(testPhoto);
        when(photoService.getPhotosForApartment(1L)).thenReturn(photos);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/1/photos")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].url", Matchers.is("https://example.com/photo1.jpg")));
    
        verify(photoService).getPhotosForApartment(1L);
    }
    
    @Test
    @DisplayName("DELETE /apartments/{id}/photos/{photoId} - Should delete apartment photo")
    void shouldDeleteApartmentPhoto() throws Exception {
        testPhoto.setApartment(testApartment); 
        when(photoService.getPhoto(1L)).thenReturn(testPhoto);
    
        mockMvc.perform(MockMvcRequestBuilders.delete("/apartments/1/photos/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    
        verify(photoService).getPhoto(1L);
        verify(photoService).deletePhoto(1L);
    }
    
    
    @Test
    @DisplayName("GET /apartments/{id}/photos/paged - Should get paginated photos")
    void shouldGetPaginatedPhotos() throws Exception {
        Photo photo1 = new Photo();
        photo1.setId(1L);
        photo1.setFilePath("https://example.com/photo1.jpg");
        
        Photo photo2 = new Photo();
        photo2.setId(2L);
        photo2.setFilePath("https://example.com/photo2.jpg");
        
        List<Photo> photos = Arrays.asList(photo1, photo2);
        when(photoService.getPhotosForApartment(1L)).thenReturn(photos);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/1/photos/paged")
                .param("page", "0")
                .param("size", "1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.photos", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.currentPage", Matchers.is(0)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.totalItems", Matchers.is(2)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.totalPages", Matchers.is(2)));
    
        verify(photoService).getPhotosForApartment(1L);
    }
    
    
    @Test
    @DisplayName("GET /apartments/map-data - Should get apartments for map display")
    void shouldGetApartmentsForMap() throws Exception {
        testApartment.setPhotos(Arrays.asList(testPhoto));
        List<Apartment> apartments = Arrays.asList(testApartment);
        when(apartmentService.getAllApartments()).thenReturn(apartments);
    
        mockMvc.perform(MockMvcRequestBuilders.get("/apartments/map-data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].lat", Matchers.is(52.2297)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].lng", Matchers.is(21.0122)));
    
        verify(apartmentService).getAllApartments();
    }

}