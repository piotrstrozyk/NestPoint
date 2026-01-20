package pl.ug.NestPoint.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Rental;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.domain.enums.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface RentalRepository extends JpaRepository<Rental, Long> {
    Page<Rental> findByStatus(RentalStatus status, Pageable pageable);

    @Query("SELECT r FROM Rental r JOIN r.apartment a WHERE a.address.street LIKE %:address% OR " +
           "a.address.city LIKE %:address% OR a.address.postalCode LIKE %:address%")
    Page<Rental> findByApartmentAddressContaining(@Param("address") String address, Pageable pageable);

    @Query("SELECT r FROM Rental r JOIN r.tenant t WHERE " +
           "CONCAT(t.firstName, ' ', t.lastName) LIKE %:tenantName% AND " +
           ":role MEMBER OF t.roles")
    Page<Rental> findByTenantName(@Param("tenantName") String tenantName, 
                                 @Param("role") Role role, 
                                 Pageable pageable);

    @Query("SELECT r FROM Rental r WHERE r.startDate >= :startDate AND r.endDate <= :endDate")
    Page<Rental> findByDateRange(@Param("startDate") LocalDate startDate, 
                                @Param("endDate") LocalDate endDate, 
                                Pageable pageable);

    @Query("SELECT r FROM Rental r JOIN r.apartment a JOIN a.owner o WHERE " +
           "CONCAT(o.firstName, ' ', o.lastName) LIKE %:ownerName% AND " +
           ":role MEMBER OF o.roles")
    Page<Rental> findByOwnerName(@Param("ownerName") String ownerName, 
                                @Param("role") Role role, 
                                Pageable pageable);

    @Query("SELECT r FROM Rental r WHERE " +
           "(:occupied = true AND r.status != 'CANCELLED' AND CURRENT_DATE BETWEEN r.startDate AND r.endDate) OR " +
           "(:occupied = false AND (r.status = 'CANCELLED' OR NOT (CURRENT_DATE BETWEEN r.startDate AND r.endDate)))")
    Page<Rental> findByOccupied(@Param("occupied") boolean occupied, Pageable pageable);

    @Query(value = "SELECT * FROM Rental r WHERE r.total_cost > :cost", nativeQuery = true)
    Page<Rental> findRentalsByTotalCostGreaterThan(@Param("cost") double cost, Pageable pageable);

    @Query("SELECT r FROM Rental r WHERE r.totalCost > :luxuryThreshold")
    Page<Rental> findLuxuryRentals(@Param("luxuryThreshold") double luxuryThreshold, Pageable pageable);

    @Query("SELECT r FROM Rental r WHERE r.totalCost < :luxuryThreshold")
    Page<Rental> findBudgetRentals(@Param("luxuryThreshold") double luxuryThreshold, Pageable pageable);

    @Query("SELECT r.apartment.address.city, AVG(r.totalCost) FROM Rental r GROUP BY r.apartment.address.city")
    List<Object[]> findAverageRentalCostGroupedByCity();

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Rental r " +
           "WHERE r.apartment.id = :apartmentId AND r.tenant.id = :tenantId AND " +
           ":role MEMBER OF r.tenant.roles")
    boolean existsByApartmentIdAndTenantId(@Param("apartmentId") Long apartmentId, 
                                          @Param("tenantId") Long tenantId,
                                          @Param("role") Role role);
    
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Rental r " +
           "WHERE r.tenant.id = :tenantId AND r.apartment.owner.id = :ownerId AND " +
           ":tenantRole MEMBER OF r.tenant.roles AND " +
           ":ownerRole MEMBER OF r.apartment.owner.roles")
    boolean existsByTenantIdAndOwnerId(@Param("tenantId") Long tenantId, 
                                      @Param("ownerId") Long ownerId,
                                      @Param("tenantRole") Role tenantRole,
                                      @Param("ownerRole") Role ownerRole);
                                      
    @Query("SELECT r FROM Rental r WHERE r.status != 'CANCELLED' AND :date BETWEEN r.startDate AND r.endDate")
    Page<Rental> findActiveOnDate(@Param("date") LocalDate date, Pageable pageable);
    
    @Query("SELECT COUNT(r) > 0 FROM Rental r " +
           "WHERE r.apartment.id = :apartmentId " +
           "AND r.status != 'CANCELLED' " +
           "AND (:id IS NULL OR r.id != :id) " +
           "AND r.startDate <= :endDate AND r.endDate >= :startDate")
    boolean existsOverlappingRental(
        @Param("apartmentId") Long apartmentId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("id") Long excludeId
    );

    List<Rental> findByStatusAndStartDateLessThanEqual(RentalStatus status, LocalDate date);
    List<Rental> findByStatusAndEndDateLessThan(RentalStatus status, LocalDate date);

    @Query("SELECT r FROM Rental r WHERE r.apartment.id = :apartmentId " +
           "AND r.status != 'CANCELLED' " + 
           "AND ((r.startDate BETWEEN :startDate AND :endDate) " +
           "OR (r.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN r.startDate AND r.endDate))")
    List<Rental> findByApartmentIdAndDateBetween(
        @Param("apartmentId") Long apartmentId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM Rental r WHERE r.owner.id = :ownerId " +
           "AND ((r.startDate BETWEEN :startDate AND :endDate) " +
           "OR (r.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN r.startDate AND r.endDate))")
    List<Rental> findByOwnerIdAndDateBetween(
        @Param("ownerId") Long ownerId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM Rental r WHERE r.tenant.id = :tenantId " +
           "AND ((r.startDate BETWEEN :startDate AND :endDate) " +
           "OR (r.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN r.startDate AND r.endDate))")
    List<Rental> findByTenantIdAndDateBetween(
        @Param("tenantId") Long tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM Rental r WHERE " +
           "(r.startDate BETWEEN :startDate AND :endDate) " +
           "OR (r.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN r.startDate AND r.endDate)")
    List<Rental> findByDateBetween(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    List<Rental> findByTenantIdAndStatus(Long tenantId, RentalStatus status);
    List<Rental> findByTenantId(Long tenantId);
    List<Rental> findByOwnerIdAndStatus(Long ownerId, RentalStatus status);
    List<Rental> findByOwnerId(Long ownerId);
    List<Rental> findByApartmentId(Long apartmentId);
    long countByStatus(RentalStatus status);


       @Query("SELECT r FROM Rental r WHERE r.isAuction = true AND r.auctionPaymentConfirmed = false AND r.auctionPaymentDeadline < :now AND r.auctionFineIssued = false")
       List<Rental> findOverdueAuctionPayments(@Param("now") LocalDateTime now);

       @Query("SELECT r FROM Rental r WHERE r.tenant.id = :userId AND r.isAuction = true AND r.auctionPaymentConfirmed = false AND r.auctionPaymentDeadline < :now")
       List<Rental> findOverdueAuctionPaymentsByUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

       @Query("SELECT r FROM Rental r WHERE r.auctionFineIssued = true AND r.auctionPaymentConfirmed = false AND r.auctionPaymentDeadline < :deadline")
       List<Rental> findUnpaidFinesOlderThan(@Param("deadline") LocalDateTime deadline);
}