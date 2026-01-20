package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.repository.UserRepository;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @InjectMocks
    private UserService userService;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .firstName("Test")
                .lastName("User")
                .phone("123456789")
                .roles(Collections.singleton(Role.TENANT))
                .build();
    }
    
    @Test
    @DisplayName("Should register new user successfully")
    void shouldRegisterNewUserSuccessfully() {
        // Given
        String rawPassword = "password123";
        String encodedPassword = "encodedPassword123";
        
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByEmailAndRoleNot("new@example.com", Role.TENANT)).thenReturn(false);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.registerUser(
            "newuser", "new@example.com", rawPassword,
            "New", "User", "987654321", Role.TENANT
        );
        
        // Then
        assertNotNull(result);
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).existsByEmail("new@example.com");
        verify(userRepository).existsByEmailAndRoleNot("new@example.com", Role.TENANT);
        verify(passwordEncoder).encode(rawPassword);
        verify(userRepository).save(any(User.class));
    }
    
    @Test
    @DisplayName("Should throw exception when username already exists")
    void shouldThrowExceptionWhenUsernameExists() {
        // Given
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> userService.registerUser(
                "existinguser", "new@example.com", "password",
                "New", "User", "123456789", Role.TENANT
            )
        );
        
        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> userService.registerUser(
                "newuser", "existing@example.com", "password",
                "New", "User", "123456789", Role.TENANT
            )
        );
        
        assertEquals("Email already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should throw exception for invalid role")
    void shouldThrowExceptionForInvalidRole() {
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.registerUser(
                "newuser", "new@example.com", "password",
                "New", "User", "123456789", null
            )
        );
        
        assertEquals("Wrong format of role. Allowed roles are: TENANT, OWNER, ADMIN", exception.getMessage());
        verify(userRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should throw exception when user has different role for same email")
    void shouldThrowExceptionWhenUserHasDifferentRoleForSameEmail() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByEmailAndRoleNot("test@example.com", Role.TENANT)).thenReturn(true);
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.registerUser(
                "newuser", "test@example.com", "password",
                "New", "User", "123456789", Role.TENANT
            )
        );
        
        assertTrue(exception.getMessage().contains("User already has an account with different role"));
        verify(userRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should register owner successfully")
    void shouldRegisterOwnerSuccessfully() {
        // Given
        when(userRepository.existsByUsername("owner")).thenReturn(false);
        when(userRepository.existsByEmail("owner@example.com")).thenReturn(false);
        when(userRepository.existsByEmailAndRoleNot("owner@example.com", Role.OWNER)).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.registerOwner(
            "owner", "owner@example.com", "password",
            "Owner", "User", "987654321"
        );
        
        // Then
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }
    
    @Test
    @DisplayName("Should register tenant successfully")
    void shouldRegisterTenantSuccessfully() {
        // Given
        when(userRepository.existsByUsername("tenant")).thenReturn(false);
        when(userRepository.existsByEmail("tenant@example.com")).thenReturn(false);
        when(userRepository.existsByEmailAndRoleNot("tenant@example.com", Role.TENANT)).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.registerTenant(
            "tenant", "tenant@example.com", "password",
            "Tenant", "User", "987654321"
        );
        
        // Then
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }
    
    @Test
    @DisplayName("Should find all owners")
    void shouldFindAllOwners() {
        // Given
        List<User> owners = Arrays.asList(testUser);
        when(userRepository.findByRole(Role.OWNER)).thenReturn(owners);
        
        // When
        List<User> result = userService.findAllOwners();
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findByRole(Role.OWNER);
    }
    
    @Test
    @DisplayName("Should find all tenants")
    void shouldFindAllTenants() {
        // Given
        List<User> tenants = Arrays.asList(testUser);
        when(userRepository.findByRole(Role.TENANT)).thenReturn(tenants);
        
        // When
        List<User> result = userService.findAllTenants();
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findByRole(Role.TENANT);
    }
    
    @Test
    @DisplayName("Should find owners by apartment occupied status")
    void shouldFindOwnersByApartmentOccupied() {
        // Given
        List<User> owners = Arrays.asList(testUser);
        when(userRepository.findByRoleAndApartmentOccupied(Role.OWNER, true)).thenReturn(owners);
        
        // When
        List<User> result = userService.findOwnersByApartmentOccupied(true);
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findByRoleAndApartmentOccupied(Role.OWNER, true);
    }
    
    @Test
    @DisplayName("Should find owners by apartment price range")
    void shouldFindOwnersByApartmentPriceRange() {
        // Given
        List<User> owners = Arrays.asList(testUser);
        when(userRepository.findOwnersByApartmentPriceRange(500.0, 1500.0, Role.OWNER)).thenReturn(owners);
        
        // When
        List<User> result = userService.findOwnersByApartmentPriceRange(500.0, 1500.0);
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findOwnersByApartmentPriceRange(500.0, 1500.0, Role.OWNER);
    }
    
    @Test
    @DisplayName("Should find owners by name")
    void shouldFindOwnersByName() {
        // Given
        List<User> owners = Arrays.asList(testUser);
        when(userRepository.findOwnersByName("John", Role.OWNER)).thenReturn(owners);
        
        // When
        List<User> result = userService.findOwnersByName("John");
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findOwnersByName("John", Role.OWNER);
    }
    
    @Test
    @DisplayName("Should find user by username")
    void shouldFindUserByUsername() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        
        // When
        User result = userService.findByUsername("testuser");
        
        // Then
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).findByUsername("testuser");
    }
    
    @Test
    @DisplayName("Should throw exception when user not found by username")
    void shouldThrowExceptionWhenUserNotFoundByUsername() {
        // Given
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());
        
        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> userService.findByUsername("nonexistent")
        );
        
        assertEquals("User not found", exception.getMessage());
    }
    
    @Test
    @DisplayName("Should find user by id")
    void shouldFindUserById() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        
        // When
        User result = userService.findById(1L);
        
        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(userRepository).findById(1L);
    }
    
    @Test
    @DisplayName("Should update user successfully")
    void shouldUpdateUserSuccessfully() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsername("newusername")).thenReturn(false);
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(passwordEncoder.encode("newpassword")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.updateUser(
            1L, "newusername", "newemail@example.com", "newpassword",
            "NewFirst", "NewLast", "987654321"
        );
        
        // Then
        assertNotNull(result);
        verify(userRepository).save(testUser);
    }
    

    @Test
    @DisplayName("Should add role to user")
    void shouldAddRoleToUser() {
        // Given - Create a mutable set of roles
        Set<Role> mutableRoles = new HashSet<>();
        mutableRoles.add(Role.TENANT);
        testUser.setRoles(mutableRoles);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.addRoleToUser(1L, Role.OWNER);
        
        // Then
        assertNotNull(result);
        assertTrue(result.getRoles().contains(Role.OWNER));
        verify(userRepository).save(testUser);
    }
    
    @Test
    @DisplayName("Should remove role from user")
    void shouldRemoveRoleFromUser() {
        // Given
        Set<Role> mutableRoles = new HashSet<>();
        mutableRoles.add(Role.TENANT);
        mutableRoles.add(Role.OWNER);
        testUser.setRoles(mutableRoles);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        User result = userService.removeRoleFromUser(1L, Role.TENANT);
        
        // Then
        assertNotNull(result);
        assertFalse(result.getRoles().contains(Role.TENANT));
        assertTrue(result.getRoles().contains(Role.OWNER));
        verify(userRepository).save(testUser);
    }
    
    @Test
    @DisplayName("Should delete user")
    void shouldDeleteUser() {
        // When
        userService.deleteUser(1L);
        
        // Then
        verify(userRepository).deleteById(1L);
    }
    
    @Test
    @DisplayName("Should get all users")
    void shouldGetAllUsers() {
        // Given
        List<User> users = Arrays.asList(testUser);
        when(userRepository.findAll()).thenReturn(users);
        
        // When
        List<User> result = userService.getAllUsers();
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findAll();
    }
    
    @Test
    @DisplayName("Should get user count")
    void shouldGetUserCount() {
        // Given
        when(userRepository.count()).thenReturn(5L);
        
        // When
        long result = userService.getUserCount();
        
        // Then
        assertEquals(5L, result);
        verify(userRepository).count();
    }
    
    @Test
    @DisplayName("Should find tenants by rental date range")
    void shouldFindTenantsByRentalDateRange() {
        // Given
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 12, 31);
        List<User> tenants = Arrays.asList(testUser);
        when(userRepository.findByRoleAndRentalDateRange(Role.TENANT, startDate, endDate)).thenReturn(tenants);
        
        // When
        List<User> result = userService.findTenantsByRentalDateRange(startDate, endDate);
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findByRoleAndRentalDateRange(Role.TENANT, startDate, endDate);
    }
    
    @Test
    @DisplayName("Should find tenants by apartment address")
    void shouldFindTenantsByApartmentAddress() {
        // Given
        List<User> tenants = Arrays.asList(testUser);
        when(userRepository.findTenantsByApartmentAddress("Main Street", Role.TENANT)).thenReturn(tenants);
        
        // When
        List<User> result = userService.findTenantsByApartmentAddress("Main Street");
        
        // Then
        assertEquals(1, result.size());
        verify(userRepository).findTenantsByApartmentAddress("Main Street", Role.TENANT);
    }
}