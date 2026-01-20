package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.domain.enums.Role;

import java.time.LocalDate;
import java.util.List;

public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    @Query("SELECT DISTINCT a FROM Apartment a LEFT JOIN a.rentals r " +
           "WHERE r IS NULL OR NOT EXISTS (" +
           "    SELECT r2 FROM Rental r2 " +
           "    WHERE r2.apartment = a " +
           "    AND r2.status <> 'CANCELLED' " +
           "    AND r2.startDate <= :date " +
           "    AND r2.endDate >= :date" +
           ")")
    List<Apartment> findAvailableOnDate(@Param("date") LocalDate date);
    
    @Query("SELECT DISTINCT a FROM Apartment a LEFT JOIN a.rentals r " +
           "WHERE r IS NULL OR NOT EXISTS (" +
           "    SELECT r2 FROM Rental r2 " +
           "    WHERE r2.apartment = a " +
           "    AND r2.status <> 'CANCELLED' " +
           "    AND r2.startDate <= :endDate " +
           "    AND r2.endDate >= :startDate" +
           ")")
    List<Apartment> findAvailableBetweenDates(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT DISTINCT a FROM Apartment a JOIN a.rentals r " +
           "WHERE r.status <> 'CANCELLED' " +
           "AND r.startDate <= :date " +
           "AND r.endDate >= :date")
    List<Apartment> findOccupiedOnDate(@Param("date") LocalDate date);

    @Query("SELECT a FROM Apartment a WHERE a.size > :size")
    List<Apartment> findBySizeGreaterThan(@Param("size") int size);
    
    @Query("SELECT a FROM Apartment a WHERE " +
           "CONCAT(a.owner.firstName, ' ', a.owner.lastName) LIKE %:ownerName% AND " +
           ":ownerRole MEMBER OF a.owner.roles")
    List<Apartment> findByOwnerName(@Param("ownerName") String ownerName, @Param("ownerRole") Role ownerRole);
    
    default List<Apartment> findByOwnerName(String ownerName) {
        return findByOwnerName(ownerName, Role.OWNER);
    }

    @Query("SELECT a FROM Apartment a WHERE a.address.street LIKE %:address% OR " +
           "a.address.city LIKE %:address% OR a.address.postalCode LIKE %:address%")
    List<Apartment> findByAddressContaining(@Param("address") String address);

    @Query("SELECT a FROM Apartment a WHERE a.owner.id = :userId AND " +
           ":ownerRole MEMBER OF a.owner.roles")
    List<Apartment> findByOwnerId(@Param("userId") Long userId, @Param("ownerRole") Role ownerRole);
    
    default List<Apartment> findByOwnerId(Long userId) {
        return findByOwnerId(userId, Role.OWNER);
    }

    @Query("SELECT a FROM Apartment a WHERE a.rentalPrice BETWEEN :minPrice AND :maxPrice")
    List<Apartment> findByRentalPriceBetween(@Param("minPrice") double minPrice, @Param("maxPrice") double maxPrice);

    @Query("SELECT a FROM Apartment a WHERE a.rentalPrice > :luxuryThreshold")
    List<Apartment> findLuxuryApartments(@Param("luxuryThreshold") double luxuryThreshold);

    @Query("SELECT a FROM Apartment a WHERE a.rentalPrice < :luxuryThreshold")
    List<Apartment> findBudgetApartments(@Param("luxuryThreshold") double luxuryThreshold);

    @Query("SELECT a.address.city, AVG(a.rentalPrice) FROM Apartment a GROUP BY a.address.city")
    List<Object[]> findAverageRentalPriceGroupedByCity();

    @Query("SELECT CONCAT(o.firstName, ' ', o.lastName), AVG(a.rentalPrice) " +
           "FROM Apartment a JOIN a.owner o WHERE :ownerRole MEMBER OF o.roles " +
           "GROUP BY o.firstName, o.lastName")
    List<Object[]> findAverageRentalPriceGroupedByOwner(@Param("ownerRole") Role ownerRole);
    
    default List<Object[]> findAverageRentalPriceGroupedByOwner() {
        return findAverageRentalPriceGroupedByOwner(Role.OWNER);
    }

    @Query("SELECT a FROM Apartment a WHERE " +
           "(:needsWifi = false OR a.wifi = true) AND " +
           "(:needsParking = false OR a.parkingSpace = true) AND " +
           "(:allowsPets = false OR a.petsAllowed = true) AND " +
           "(:kitchenType is null OR a.kitchen = :kitchenType) AND " +
           "(:needsDisabilityAccess = false OR a.disabilityFriendly = true)")
    List<Apartment> findByAmenities(
        @Param("needsWifi") boolean needsWifi,
        @Param("needsParking") boolean needsParking,
        @Param("allowsPets") boolean allowsPets,
        @Param("kitchenType") AccessibilityType kitchenType,
        @Param("needsDisabilityAccess") boolean needsDisabilityAccess
    );

    List<Apartment> findByPropertyType(PropertyType propertyType);

    @Query("SELECT a FROM Apartment a WHERE " +
           "(:poolAccess is null OR a.poolAccess = :poolAccess) AND " +
           "(:yardAccess is null OR a.yardAccess = :yardAccess) AND " +
           "(:disabilityFriendly = false OR a.disabilityFriendly = true)")
    List<Apartment> findByAccessibilityFeatures(
        @Param("poolAccess") AccessibilityType poolAccess,
        @Param("yardAccess") AccessibilityType yardAccess,
        @Param("disabilityFriendly") boolean disabilityFriendly
    );

    @Query("SELECT COUNT(a) > 0 FROM Apartment a WHERE a.id = :apartmentId AND " +
           "a.owner.id = :userId AND :ownerRole MEMBER OF a.owner.roles")
    boolean isOwnedByUser(@Param("apartmentId") Long apartmentId, @Param("userId") Long userId, @Param("ownerRole") Role ownerRole);
    
    default boolean isOwnedByUser(Long apartmentId, Long userId) {
        return isOwnedByUser(apartmentId, userId, Role.OWNER);
    }
    
    @Query("SELECT DISTINCT a FROM Apartment a JOIN a.auctions auc WHERE auc.status = 'ACTIVE' AND auc.startTime <= CURRENT_TIMESTAMP AND auc.endTime > CURRENT_TIMESTAMP")
    List<Apartment> findWithActiveAuctions();
    
    @Query("SELECT DISTINCT a FROM Apartment a JOIN a.auctions auc WHERE auc.status = 'SCHEDULED' OR (auc.status = 'ACTIVE' AND auc.startTime > CURRENT_TIMESTAMP)")
    List<Apartment> findWithUpcomingAuctions();
    
    @Query("SELECT DISTINCT a FROM Apartment a JOIN a.auctions auc WHERE auc.status = 'COMPLETED'")
    List<Apartment> findWithCompletedAuctions();
    
    @Query("SELECT DISTINCT a FROM Apartment a JOIN a.auctions auc")
    List<Apartment> findWithAnyAuction();
}