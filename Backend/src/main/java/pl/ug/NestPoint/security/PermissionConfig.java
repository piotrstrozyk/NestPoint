package pl.ug.NestPoint.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import pl.ug.NestPoint.domain.enums.Role;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


@Configuration
public class PermissionConfig {

    public static final String CREATE_APARTMENT = "apartment:create";
    public static final String READ_APARTMENT = "apartment:read";
    public static final String UPDATE_APARTMENT = "apartment:update";
    public static final String DELETE_APARTMENT = "apartment:delete";
    
    public static final String CREATE_USER = "user:create";
    public static final String READ_USER = "user:read";
    public static final String UPDATE_USER = "user:update";
    public static final String DELETE_USER = "user:delete";
    
    public static final String MODERATE_CONTENT = "content:moderate";
    public static final String MANAGE_BOOKINGS = "booking:manage";
    public static final String CREATE_REVIEW = "review:create";
    public static final String READ_REVIEW = "review:read";
    public static final String MANAGE_REVIEWS = "review:manage";
    
    @Bean
    public Map<Role, Set<String>> rolePermissions() {
        Map<Role, Set<String>> permissions = new HashMap<>();
        
        // Admin has all permissions
        permissions.put(Role.ADMIN, Set.of(
            CREATE_APARTMENT, READ_APARTMENT, UPDATE_APARTMENT, DELETE_APARTMENT,
            CREATE_USER, READ_USER, UPDATE_USER, DELETE_USER,
            MODERATE_CONTENT, MANAGE_BOOKINGS
        ));
        
        // Client can read apartments and manage their own bookings
        permissions.put(Role.TENANT, Set.of(
            READ_APARTMENT,
            MANAGE_BOOKINGS, CREATE_REVIEW, READ_REVIEW
        ));
        
        // Host can manage their apartments and bookings
        permissions.put(Role.OWNER, Set.of(
            CREATE_APARTMENT, READ_APARTMENT, UPDATE_APARTMENT, 
            MANAGE_BOOKINGS, CREATE_REVIEW, READ_REVIEW, MANAGE_REVIEWS
        ));
        
        return permissions;
    }
    
    /**
     * Helper method to check if a role has a specific permission
     */
    public boolean hasPermission(Role role, String permission) {
        return rolePermissions().getOrDefault(role, Set.of()).contains(permission);
    }
    
    /**
     * Helper method to check if any of the roles has a specific permission
     */
    public boolean hasPermission(Set<Role> roles, String permission) {
        return roles.stream()
                .anyMatch(role -> hasPermission(role, permission));
    }
}