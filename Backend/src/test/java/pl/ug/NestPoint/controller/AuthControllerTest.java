package pl.ug.NestPoint.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.handler.SimpleMappingExceptionResolver;
import org.springframework.test.util.ReflectionTestUtils;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.RegistrationRequest;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.security.JwtUtil;
import pl.ug.NestPoint.service.TokenBlacklistService;
import pl.ug.NestPoint.service.UserService;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Tests")
class AuthControllerTest {

    private MockMvc mockMvc;
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @Mock
    private UserService userService;
    
    @Mock
    private AuthenticationManager authenticationManager;
    
    @Mock
    private JwtUtil jwtUtil;
    
    @Mock
    private TokenBlacklistService tokenBlacklistService;
    
    @InjectMocks
    private AuthController authController;

    @MockBean
    private UserBlockingInterceptor userBlockingInterceptor;

    @MockBean
    private UserRepository userRepository;

    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .roles(Collections.singleton(Role.TENANT))
                .build();
                
        mockMvc = MockMvcBuilders
            .standaloneSetup(authController)
            .setHandlerExceptionResolvers(new SimpleMappingExceptionResolver())
            .build();
    }
        
    @Test
    @DisplayName("Should register user successfully")
    void shouldRegisterUserSuccessfully() throws Exception {
        // Given
        RegistrationRequest request = new RegistrationRequest(
            "newuser", "new@example.com", "password123",
            "New", "User", "123-456-7890", Role.TENANT
        );

        User registeredUser = User.builder()
                .id(2L)
                .username("newuser")
                .email("new@example.com")
                .roles(Collections.singleton(Role.TENANT))
                .build();

        // Mock user registration
        when(userService.registerUser(
            eq("newuser"),
            eq("new@example.com"),
            eq("password123"),
            eq("New"),
            eq("User"),
            eq("123-456-7890"),  
            eq(Role.TENANT)
        )).thenReturn(registeredUser);

        // Mock token generation
        when(jwtUtil.generateToken(
            eq("newuser"),
            eq(List.of("TENANT")),
            eq(2L)
        )).thenReturn("mock.jwt.token");

        // When & Then
        mockMvc.perform(post("/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.message").value("TENANT registered successfully"));
    }
    
    @Test
    @DisplayName("Should reject invalid role registration")
    void shouldRejectInvalidRoleRegistration() throws Exception {
        // Given
        RegistrationRequest request = new RegistrationRequest(
            "newuser", "new@example.com", "password123",
            "New", "User", "111-222-3333", Role.ADMIN
        );

        // When & Then - expect the controller logic to return 400
        mockMvc.perform(post("/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Only TENANT or OWNER roles are allowed")));

        verify(userService, never()).registerUser(anyString(), anyString(), anyString(),
            anyString(), anyString(), anyString(), any(Role.class));
    }
    
    @Test
    @DisplayName("Should login user successfully")
    void shouldLoginUserSuccessfully() throws Exception {
        // Given
        AuthController.LoginRequest loginRequest = 
            new AuthController.LoginRequest("testuser", "password123");
        
        Authentication mockAuth = new UsernamePasswordAuthenticationToken(
            "testuser", "password123", 
            List.of(new SimpleGrantedAuthority("TENANT"))
        );
        
        when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(jwtUtil.generateToken(anyString(), anyList(), anyLong()))
            .thenReturn("mock.jwt.token");
        
        // When & Then
        mockMvc.perform(post("/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.userId").value(1));
    }
    
    @Test
    @DisplayName("Should register admin with valid secret key")
    void shouldRegisterAdminWithValidSecretKey() throws Exception {
        // Given
        AuthController.AdminRegistrationRequest request = 
            new AuthController.AdminRegistrationRequest(
                "admin", "admin@example.com", "password123",
                "Admin", "User", "123-456-7890", "super_secure_admin_key_2025"
            );
        
        User adminUser = User.builder()
                .id(2L)
                .username("admin")
                .email("admin@example.com")
                .roles(Collections.singleton(Role.ADMIN))
                .build();
        
        when(userService.registerUser(anyString(), anyString(), anyString(), 
            anyString(), anyString(), anyString(), eq(Role.ADMIN)))
            .thenReturn(adminUser);
        when(jwtUtil.generateToken(anyString(), anyList(), anyLong()))
            .thenReturn("admin.jwt.token");
        
        // When & Then
        mockMvc.perform(post("/register-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Admin registered successfully"))
                .andExpect(jsonPath("$.token").value("admin.jwt.token"));
    }

    @Test
    @DisplayName("Should reject admin registration with invalid secret key")
    void shouldRejectAdminRegistrationWithInvalidSecretKey() throws Exception {
        // Given
        AuthController.AdminRegistrationRequest request = 
            new AuthController.AdminRegistrationRequest(
                "admin", "admin@example.com", "password123",
                "Admin", "User", "123-456-7890", "wrong_secret_key"
            );
        
        // When & Then
        mockMvc.perform(post("/register-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Invalid secret key"));
        
        verify(userService, never()).registerUser(anyString(), anyString(), anyString(),
            anyString(), anyString(), anyString(), any(Role.class));
    }
    
    @Test
    @DisplayName("Should logout successfully")
    void shouldLogoutSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(post("/logout")
                .header("Authorization", "Bearer mock.jwt.token"))
                .andExpect(status().isOk())
                .andExpect(content().string("{\"success\": true, \"message\": \"Logout successful\"}"));
        
        verify(tokenBlacklistService).blacklistToken("mock.jwt.token");
    }
    
    @Test
    @DisplayName("Should handle logout without token")
    void shouldHandleLogoutWithoutToken() throws Exception {
        // When & Then 
        mockMvc.perform(post("/logout")
                .header("Authorization", "InvalidToken")) // Provide invalid token
                .andDo(print())
                .andExpect(status().isOk()) // Controller returns 200 with error message
                .andExpect(content().json("{\"success\": false, \"message\": \"No valid token provided\"}"));
        
        verify(tokenBlacklistService, never()).blacklistToken(anyString());
    }
}