package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.domain.enums.Role;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u " +
           "WHERE u.email = :email AND NOT :role MEMBER OF u.roles")
    boolean existsByEmailAndRoleNot(@Param("email") String email, @Param("role") Role role);
    
    @Query("SELECT u FROM User u WHERE :role MEMBER OF u.roles")
    List<User> findByRole(@Param("role") Role role);
    
    @Query("SELECT u FROM User u WHERE :role MEMBER OF u.roles " +
           "AND CONCAT(u.firstName, ' ', u.lastName) LIKE %:name%")
    List<User> findOwnersByName(@Param("name") String name, @Param("role") Role role);
    
    @Query("SELECT u FROM User u WHERE :role MEMBER OF u.roles " +
           "AND u.ownedApartments IS NOT EMPTY")
    List<User> findOwnersWithApartments(@Param("role") Role role);
    
    @Query("SELECT u FROM User u JOIN u.ownedApartments a WHERE :role MEMBER OF u.roles " +
           "AND (a.address.street LIKE %:address% OR a.address.city LIKE %:address% OR a.address.postalCode LIKE %:address%)")
    List<User> findOwnersByApartmentAddress(@Param("address") String address, @Param("role") Role role);
    
    @Query("SELECT u FROM User u WHERE :role MEMBER OF u.roles " +
           "AND u.rentals IS NOT EMPTY")
    List<User> findTenantsWithRentals(@Param("role") Role role);
    
    @Query("SELECT u FROM User u JOIN u.rentals r WHERE :role MEMBER OF u.roles " +
           "AND r.status = :status")
    List<User> findTenantsByRentalStatus(@Param("status") String status, @Param("role") Role role);
    
    @Query("SELECT u FROM User u JOIN u.ownedApartments a WHERE :role MEMBER OF u.roles " +
           "AND a.rentalPrice BETWEEN :minPrice AND :maxPrice")
    List<User> findOwnersByApartmentPriceRange(
        @Param("minPrice") double minPrice, 
        @Param("maxPrice") double maxPrice, 
        @Param("role") Role role
    );
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.rentals r WHERE :role MEMBER OF u.roles " +
           "AND r.status = :status")
    List<User> findByRoleAndRentalStatus(@Param("role") Role role, @Param("status") RentalStatus status);

    @Query("SELECT DISTINCT u FROM User u JOIN u.rentals r WHERE :role MEMBER OF u.roles " +
           "AND r.startDate >= :startDate AND r.endDate <= :endDate")
    List<User> findByRoleAndRentalDateRange(@Param("role") Role role, 
                                           @Param("startDate") LocalDate startDate, 
                                           @Param("endDate") LocalDate endDate);

    // Replace the method using the removed 'occupied' field
    @Query("SELECT DISTINCT u FROM User u JOIN u.ownedApartments a JOIN a.rentals r " +
           "WHERE :role MEMBER OF u.roles " +
           "AND r.status != 'CANCELLED' " +
           "AND CURRENT_DATE BETWEEN r.startDate AND r.endDate")
    List<User> findByRoleWithCurrentlyOccupiedApartments(@Param("role") Role role);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.ownedApartments a " +
           "WHERE :role MEMBER OF u.roles " +
           "AND NOT EXISTS (" +
           "    SELECT r FROM Rental r " +
           "    WHERE r.apartment = a " +
           "    AND r.status != 'CANCELLED' " +
           "    AND CURRENT_DATE BETWEEN r.startDate AND r.endDate" +
           ")")
    List<User> findByRoleWithCurrentlyAvailableApartments(@Param("role") Role role);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.ownedApartments a " +
           "WHERE :role MEMBER OF u.roles " +
           "AND (:occupied = true AND EXISTS (" +
           "    SELECT r FROM Rental r " +
           "    WHERE r.apartment = a " +
           "    AND r.status != 'CANCELLED' " +
           "    AND CURRENT_DATE BETWEEN r.startDate AND r.endDate" +
           ")) OR (:occupied = false AND NOT EXISTS (" +
           "    SELECT r FROM Rental r " +
           "    WHERE r.apartment = a " +
           "    AND r.status != 'CANCELLED' " +
           "    AND CURRENT_DATE BETWEEN r.startDate AND r.endDate" +
           "))")
    List<User> findByRoleAndApartmentOccupied(@Param("role") Role role, @Param("occupied") boolean occupied);

    @Query("SELECT a.owner.id, " +
           "COUNT(r) as totalRentals, " +
           "SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedRentals, " +
           "(SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(r)) as completionRate " +
           "FROM Apartment a LEFT JOIN a.rentals r " +
           "WHERE a.owner.id = :ownerId " +
           "GROUP BY a.owner.id")
    List<Object[]> getOwnerFeePercentage(@Param("ownerId") Long ownerId);

    @Query("SELECT a.owner.id, " +
           "COUNT(r) as totalRentals, " +
           "SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedRentals, " +
           "(SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(r)) as completionRate " +
           "FROM Apartment a LEFT JOIN a.rentals r " +
           "WHERE (a.address.street LIKE %:address% OR a.address.city LIKE %:address%) " +
           "AND :role MEMBER OF a.owner.roles " +
           "GROUP BY a.owner.id")
    List<Object[]> getOwnerFeePercentageByAddress(@Param("address") String address, @Param("role") Role role);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.rentals r JOIN r.apartment a WHERE :role MEMBER OF u.roles " +
           "AND (a.address.street LIKE %:address% OR a.address.city LIKE %:address% OR a.address.postalCode LIKE %:address%)")
     List<User> findTenantsByApartmentAddress(@Param("address") String address, @Param("role") Role role);
}