package pl.ug.NestPoint.domain;

import jakarta.persistence.*;
import lombok.*;
import pl.ug.NestPoint.domain.enums.Role;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    @Email(message = "Invalid email format")
    private String email;
    
    @Size(max = 30)
    private String firstName;
    
    @Size(max = 30)
    private String lastName;

    @Pattern(regexp = "^[0-9]{3}-[0-9]{3}-[0-9]{4}$")
    private String phone;

    @Column(name = "is_blocked")
    private Boolean isBlocked = false;

    @Column(name = "blocked_reason")
    private String blockedReason;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // Owner-specific relationships
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Apartment> ownedApartments = new ArrayList<>();

    // Tenant-specific relationships
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Rental> rentals = new ArrayList<>();

    // Owner rentals relationship
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Rental> ownedRentals = new ArrayList<>();

    // Helper methods with null checks
    public boolean isOwner() {
        return roles != null && roles.contains(Role.OWNER);
    }

    public boolean isTenant() {
        return roles != null && roles.contains(Role.TENANT);
    }
    
    public boolean isAdmin() {
        return roles != null && roles.contains(Role.ADMIN);
    }

    public void addApartment(Apartment apartment) {
        if (!isOwner()) {
            throw new IllegalStateException("User must be an owner to add apartments");
        }
        if (ownedApartments == null) {
            ownedApartments = new ArrayList<>();
        }
        ownedApartments.add(apartment);
        apartment.setOwner(this);
    }

    public void addRental(Rental rental) {
        if (!isTenant()) {
            throw new IllegalStateException("User must be a tenant to add rentals");
        }
        if (rentals == null) {
            rentals = new ArrayList<>();
        }
        rentals.add(rental);
        rental.setTenant(this);
    }

    public void removeApartment(Apartment apartment) {
        if (ownedApartments != null) {
            ownedApartments.remove(apartment);
            apartment.setOwner(null);
        }
    }

    public void removeRental(Rental rental) {
        if (rentals != null) {
            rentals.remove(rental);
            rental.setTenant(null);
        }
    }
    
    public void addRole(Role role) {
        if (roles == null) {
            roles = new HashSet<>();
        }
        roles.add(role);
    }
    
    public void removeRole(Role role) {
        if (roles != null) {
            roles.remove(role);
        }
    }

    public boolean isCurrentlyBlocked() {
        return isBlocked != null && isBlocked;
    }
    
    public void blockUser(String reason) {
        this.isBlocked = true;
        this.blockedReason = reason;
        this.blockedAt = LocalDateTime.now();
    }
    
    public void unblockUser() {
        this.isBlocked = false;
        this.blockedReason = null;
        this.blockedAt = null;
    }

}