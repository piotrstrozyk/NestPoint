package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.OwnerProfileRequest;
import pl.ug.NestPoint.dto.TenantProfileRequest;
import pl.ug.NestPoint.service.UserService;

import java.util.Map;


@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final UserService userService;

    @PostMapping("/create-owner")
    public ResponseEntity<?> createOwnerProfile(
            @RequestBody OwnerProfileRequest request,
            Authentication authentication) {
        try {
            User user = userService.findByUsername(authentication.getName());
            user = userService.addRoleToUser(user.getId(), Role.OWNER);
            
            if (request.getPhone() != null) {
                user = userService.updateUser(user.getId(), null, null, null, null, null, request.getPhone());
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Owner profile created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/create-tenant")
    public ResponseEntity<?> createTenantProfile(
            @RequestBody TenantProfileRequest request,
            Authentication authentication) {
        try {
            User user = userService.findByUsername(authentication.getName());
            user = userService.addRoleToUser(user.getId(), Role.TENANT);
            
            if (request.getPhone() != null) {
                user = userService.updateUser(user.getId(), null, null, null, null, null, request.getPhone());
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tenant profile created successfully",
                "userId", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}