package pl.ug.NestPoint.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.web.multipart.MultipartFile;

import pl.ug.NestPoint.dto.ReviewDTO;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.repository.ReviewRepository;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.service.ReviewService;
import pl.ug.NestPoint.service.UserService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.hamcrest.Matchers;

@MockitoSettings(strictness = Strictness.LENIENT)
@WebMvcTest(ReviewController.class)
@Import(ReviewControllerTest.TestSecurityConfig.class)
@DisplayName("Review Controller Tests")
public class ReviewControllerTest {

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
    private ReviewService reviewService;

    @MockBean
    private ReviewRepository reviewRepository;

    @MockBean
    private UserBlockingInterceptor userBlockingInterceptor;

    @MockBean
    private UserRepository userRepository;

    @MockBean  
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private ReviewDTO testReviewDTO;
    private Map<String, Object> testReviewsResponse;

    @BeforeEach
    void setUp() {
        testReviewDTO = new ReviewDTO();
        testReviewDTO.setContent("Great apartment!");
        testReviewDTO.setScore(5);
        testReviewDTO.setAuthorId(1L);
        testReviewDTO.setApartmentId(1L);

        testReviewsResponse = new HashMap<>();
        testReviewsResponse.put("reviews", Collections.singletonList(testReviewDTO));
        testReviewsResponse.put("averageRating", 4.5);
        testReviewsResponse.put("reviewCount", 1);
    }

    @Test
    @DisplayName("Should debug if user can review apartment")
    void shouldDebugIfUserCanReviewApartment() throws Exception {
        // Arrange
        Mockito.when(reviewRepository.hasUserRentedApartment(1L, 1L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/reviews/debug")
                .param("apartmentId", "1")
                .param("authorId", "1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.canReview", Matchers.is(true)));

        // Verify
        Mockito.verify(reviewRepository).hasUserRentedApartment(1L, 1L);
    }

    @Test
    @DisplayName("Should create apartment review")
    void shouldCreateApartmentReview() throws Exception {
        // Convert the DTO to JSON string
        String reviewDetailsJson = objectMapper.writeValueAsString(testReviewDTO);
        
        // Create test file
        MockMultipartFile file = new MockMultipartFile(
                "file", 
                "test-image.jpg", 
                "image/jpeg", 
                "test image content".getBytes()
        );

        Mockito.doReturn(testReviewDTO).when(reviewService).reviewApartment(
                ArgumentMatchers.any(ReviewDTO.class), 
                ArgumentMatchers.any());

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/reviews/apartment")
                .file(file)
                .param("details", reviewDetailsJson)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.content").value("Great apartment!"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.score").value(5))
                .andExpect(MockMvcResultMatchers.jsonPath("$.authorId").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.apartmentId").value(1));

        // Capture and verify
        ArgumentCaptor<ReviewDTO> reviewCaptor = ArgumentCaptor.forClass(ReviewDTO.class);
        ArgumentCaptor<MultipartFile> fileCaptor = ArgumentCaptor.forClass(MultipartFile.class);
        
        Mockito.verify(reviewService).reviewApartment(reviewCaptor.capture(), fileCaptor.capture());
        
        ReviewDTO capturedReview = reviewCaptor.getValue();
        assertEquals("Great apartment!", capturedReview.getContent());
        assertEquals(5, capturedReview.getScore());
        assertEquals(1L, capturedReview.getAuthorId());
        assertEquals(1L, capturedReview.getApartmentId());
        
        MultipartFile capturedFile = fileCaptor.getValue();
        assertEquals("test-image.jpg", capturedFile.getOriginalFilename());
    }


    @Test
    @DisplayName("Should create apartment review without photo")
    void shouldCreateApartmentReviewWithoutPhoto() throws Exception {
        String reviewDetailsJson = objectMapper.writeValueAsString(testReviewDTO);

        Mockito.doReturn(testReviewDTO).when(reviewService).reviewApartment(
                ArgumentMatchers.any(ReviewDTO.class), 
                ArgumentMatchers.isNull());

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/reviews/apartment")
                .param("details", reviewDetailsJson)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @DisplayName("Should create user review")
    void shouldCreateUserReview() throws Exception {
        testReviewDTO.setApartmentId(null);
        testReviewDTO.setTargetUserId(2L);
        
        String reviewDetailsJson = objectMapper.writeValueAsString(testReviewDTO);

        Mockito.doReturn(testReviewDTO).when(reviewService).reviewUser(
                ArgumentMatchers.any(ReviewDTO.class));

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/reviews/user")
                .param("details", reviewDetailsJson)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @DisplayName("Should get apartment reviews")
    void shouldGetApartmentReviews() throws Exception {
        // Arrange
        Mockito.when(reviewService.getApartmentReviews(1L)).thenReturn(testReviewsResponse);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/reviews/apartment/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.averageRating", Matchers.is(4.5)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.reviewCount", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.reviews", Matchers.hasSize(1)));

        // Verify
        Mockito.verify(reviewService).getApartmentReviews(1L);
    }

    @Test
    @DisplayName("Should get user reviews")
    void shouldGetUserReviews() throws Exception {
        // Arrange
        Mockito.when(reviewService.getUserReviews(1L)).thenReturn(testReviewsResponse);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/reviews/user/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.averageRating", Matchers.is(4.5)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.reviewCount", Matchers.is(1)))
                .andExpect(MockMvcResultMatchers.jsonPath("$.reviews", Matchers.hasSize(1)));

        // Verify
        Mockito.verify(reviewService).getUserReviews(1L);
    }

    @Test
    @DisplayName("Should delete a review")
    void shouldDeleteReview() throws Exception {
        // Arrange 
        Mockito.doNothing().when(reviewService).deleteReview(1L);
    
        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.delete("/reviews/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    
        // Verify that the service was called
        Mockito.verify(reviewService).deleteReview(1L);
    }
    
    @Test
    @DisplayName("Should update a review")
    void shouldUpdateReview() throws Exception {
        // Set up test data
        Long reviewId = 1L;
        testReviewDTO.setId(reviewId);
        testReviewDTO.setContent("Updated content");
        
        String reviewDetailsJson = objectMapper.writeValueAsString(testReviewDTO);
        
        MockMultipartFile file = new MockMultipartFile(
                "file", 
                "updated-image.jpg", 
                "image/jpeg", 
                "updated image content".getBytes()
        );
    
        // Mock service response
        Mockito.doReturn(testReviewDTO).when(reviewService).updateReview(
                ArgumentMatchers.any(ReviewDTO.class), 
                ArgumentMatchers.any());
    
        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/reviews/{reviewId}", reviewId)
                .file(file)
                .param("details", reviewDetailsJson)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
                .andExpect(MockMvcResultMatchers.status().isOk());
    
        // Verify the service was called with the correct ID
        Mockito.verify(reviewService).updateReview(
                ArgumentMatchers.argThat(dto -> dto.getId().equals(reviewId)), 
                ArgumentMatchers.any());
    }
    
    @Test
    @DisplayName("Should update a review without photo")
    void shouldUpdateReviewWithoutPhoto() throws Exception {
        // Set up test data
        Long reviewId = 1L;
        testReviewDTO.setId(reviewId);
        testReviewDTO.setContent("Updated content without photo");
        
        String reviewDetailsJson = objectMapper.writeValueAsString(testReviewDTO);
    
        // Mock service response
        Mockito.doReturn(testReviewDTO).when(reviewService).updateReview(
                ArgumentMatchers.any(ReviewDTO.class), 
                ArgumentMatchers.isNull());
    
        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.multipart("/reviews/{reviewId}", reviewId)
                .param("details", reviewDetailsJson)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .with(request -> {
                    request.setMethod("PUT");
                    return request;
                }))
                .andExpect(MockMvcResultMatchers.status().isOk());
    
        // Verify the service was called with the correct ID
        Mockito.verify(reviewService).updateReview(
                ArgumentMatchers.argThat(dto -> dto.getId().equals(reviewId)), 
                ArgumentMatchers.isNull());
    }
    
    @Test
    @DisplayName("Should handle error when deleting non-existent review")
    void shouldHandleErrorWhenDeletingNonExistentReview() throws Exception {
        // Arrange
        Long nonExistentId = 999L;
        Mockito.doThrow(new RuntimeException("Review not found"))
               .when(reviewService).deleteReview(nonExistentId);
    
        // Act & Assert - expect exception
        try {
            mockMvc.perform(MockMvcRequestBuilders.delete("/reviews/{reviewId}", nonExistentId)
                    .contentType(MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            // Verify the exception was thrown and service was called
            Mockito.verify(reviewService).deleteReview(nonExistentId);
            assertTrue(e.getCause() instanceof RuntimeException);
            assertEquals("Review not found", e.getCause().getMessage());
        }
    }
}