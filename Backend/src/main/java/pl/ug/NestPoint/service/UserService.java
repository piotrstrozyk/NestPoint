package pl.ug.NestPoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.repository.UserRepository;


import java.util.Collections;
import java.util.List;
import java.time.LocalDate;



@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String username, String email, String password, 
                           String firstName, String lastName, String phone, Role role) {
        // Validate role
        if (role != Role.TENANT && role != Role.OWNER && role != Role.ADMIN) {
            throw new IllegalArgumentException("Wrong format of role. Allowed roles are: TENANT, OWNER, ADMIN");
        }

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
    
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        // Check if user already has an account with different role
        if (userRepository.existsByEmailAndRoleNot(email, role)) {
            throw new IllegalArgumentException(
                "User already has an account with different role. Please use separate email addresses for tenant and owner accounts."
            );
        }
    
        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .roles(Collections.singleton(role)) // Using singleton instead of HashSet
                .build();
    
        return userRepository.save(user);
    }

    // Simplified role-specific registration methods
    @Transactional
    public User registerOwner(String username, String email, String password, 
                            String firstName, String lastName, String phone) {
        return registerUser(username, email, password, firstName, lastName, phone, Role.OWNER);
    }
    
    @Transactional
    public User registerTenant(String username, String email, String password, 
                             String firstName, String lastName, String phone) {
        return registerUser(username, email, password, firstName, lastName, phone, Role.TENANT);
    }

    // Methods for finding users by role
    public List<User> findAllOwners() {
        return userRepository.findByRole(Role.OWNER);
    }

    public List<User> findAllTenants() {
        return userRepository.findByRole(Role.TENANT);
    }

    // Owner-specific queries
    public List<User> findOwnersByApartmentOccupied(boolean occupied) {
        return userRepository.findByRoleAndApartmentOccupied(Role.OWNER, occupied);
    }

    public List<User> findOwnersByApartmentPriceRange(double minPrice, double maxPrice) {
        return userRepository.findOwnersByApartmentPriceRange(minPrice, maxPrice, Role.OWNER);
    }

        public List<User> findOwnersByName(String name) {
        return userRepository.findOwnersByName(name, Role.OWNER);
    }

    public List<User> findOwnersWithApartments() {
        return userRepository.findOwnersWithApartments(Role.OWNER);
    }

    public List<User> findOwnersByApartmentAddress(String address) {
        return userRepository.findOwnersByApartmentAddress(address, Role.OWNER);
    }

    // Tenant-specific queries
    public List<User> findTenantsByRentalStatus(String status) {
        return userRepository.findTenantsByRentalStatus(status, Role.TENANT);
    }

    public List<User> findTenantsByRentalDateRange(LocalDate startDate, LocalDate endDate) {
        return userRepository.findByRoleAndRentalDateRange(Role.TENANT, startDate, endDate);
    }

    // Rest of the methods
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public User updateUser(Long id, String username, String email, String password, 
                         String firstName, String lastName, String phone) {
        User user = findById(id);
        
        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(username);
        }
        
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(email);
        }
        
        if (password != null) {
            user.setPassword(passwordEncoder.encode(password));
        }
        
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (phone != null) user.setPhone(phone);
        
        return userRepository.save(user);
    }

    @Transactional
    public User addRoleToUser(Long userId, Role role) {
        User user = findById(userId);
        user.getRoles().add(role);
        return userRepository.save(user);
    }
    
    @Transactional
    public User removeRoleFromUser(Long userId, Role role) {
        User user = findById(userId);
        user.getRoles().remove(role);
        return userRepository.save(user);
    }

    
    public List<Object[]> getOwnerFeePercentage(Long ownerId) {
        User user = findById(ownerId);
        if (!user.isOwner()) {
            throw new RuntimeException("User is not an owner");
        }
        return userRepository.getOwnerFeePercentage(ownerId);
    }

    public List<Object[]> getOwnerFeePercentageByAddress(String address) {
        return userRepository.getOwnerFeePercentageByAddress(address, Role.OWNER);
    }

    public List<User> findTenantsByApartmentAddress(String address) {
        return userRepository.findTenantsByApartmentAddress(address, Role.TENANT);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public long getUserCount() {
        return userRepository.count();
    }
}