package pl.ug.NestPoint.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.dto.RegistrationRequest;
import pl.ug.NestPoint.security.JwtUtil;
import pl.ug.NestPoint.service.TokenBlacklistService;
import pl.ug.NestPoint.service.UserService;
import pl.ug.NestPoint.domain.enums.Role;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequiredArgsConstructor
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final TokenBlacklistService tokenBlacklistService;

    public record LoginRequest(String username, String password) {}

    private static final String ADMIN_REGISTRATION_SECRET = "super_secure_admin_key_2025";
    
    public record AdminRegistrationRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phone,
        @NotBlank String secretKey
    ) {}

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody AdminRegistrationRequest request) {
        try {
            // Validate the secret key
            if (!ADMIN_REGISTRATION_SECRET.equals(request.secretKey())) {
                logger.warn("Admin registration attempted with invalid secret key");
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Invalid secret key"
                ));
            }

            logger.info("Admin registration with valid secret key");
            
            // Create the admin user
            User user = userService.registerUser(
                    request.username(),
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    Role.ADMIN
            );

            // Generate JWT with admin role
            String token = jwtUtil.generateToken(
                    user.getUsername(),
                    List.of(Role.ADMIN.name()),
                    user.getId()
            );

            // Return confirmation
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Admin registered successfully");
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user with Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.username(),
                            loginRequest.password()
                    )
            );

            // Extract roles from the authenticated user
            List<String> roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // 3) Load full User to get its ID
            User user = userService.findByUsername(loginRequest.username());

            // 4) Generate JWT with username, roles, and userId
            String token = jwtUtil.generateToken(
                    loginRequest.username(),
                    roles,
                    user.getId()
            );
            logger.info("Generated token for user {}: {}", loginRequest.username(), token);

            // 5) Build response
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", loginRequest.username());
            response.put("roles", roles);
            response.put("userId",   user.getId());

            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            logger.error("Authentication failed for user {}: {}", loginRequest.username(), e.getMessage());
            return ResponseEntity.badRequest().body("Invalid username or password");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistrationRequest request) {
        try {
            if (request.role() != Role.TENANT && request.role() != Role.OWNER) {
                throw new IllegalArgumentException("Only TENANT or OWNER roles are allowed for registration");
            }

            // 1) Create the user
            User user = userService.registerUser(
                    request.username(),
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.role()
            );

            // 2) Generate JWT with the new user's ID
            String token = jwtUtil.generateToken(
                    user.getUsername(),
                    List.of(request.role().name()),
                    user.getId()
            );

            // 3) Return registration confirmation plus token
            Map<String, Object> response = new HashMap<>();
            response.put("message", String.format("%s registered successfully", request.role()));
            response.put("user", user);
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/logout")
    public String logout(@RequestHeader("Authorization") String authHeader) {
        logger.info("Logout request received with header: {}", authHeader);

        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            logger.info("Token extracted: {}", token);
        }

        if (token != null) {
            // Add token to blacklist
            tokenBlacklistService.blacklistToken(token);

            // Clear security context
            SecurityContextHolder.clearContext();

            logger.info("User logged out and token blacklisted");
            return "{\"success\": true, \"message\": \"Logout successful\"}";
        }

        logger.warn("No valid token provided");
        return "{\"success\": false, \"message\": \"No valid token provided\"}";
    }
}
