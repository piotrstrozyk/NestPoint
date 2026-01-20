package pl.ug.NestPoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.Conversation;
import pl.ug.NestPoint.domain.Rental;
import pl.ug.NestPoint.domain.RentalStatus;
import pl.ug.NestPoint.dto.RentalDTO;
import pl.ug.NestPoint.dto.RentalSearchCriteria;
import pl.ug.NestPoint.mapper.RentalMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.ConversationRepository;
import pl.ug.NestPoint.repository.RentalRepository;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalService {
    private final RentalRepository rentalRepository;
    private final ApartmentRepository apartmentRepository;
    private final RentalMapper rentalMapper;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    private static final double LUXURY_THRESHOLD = 2000.0;

    public List<Rental> getAllRentals() {
        return rentalRepository.findAll();
    }

    public Rental getRentalById(Long id) {
        return rentalRepository.findById(id).orElse(null);
    }

    public Page<Rental> findByUserName(String userName, Pageable pageable) {
        Page<Rental> ownerRentals = rentalRepository.findByOwnerName(userName, Role.OWNER, pageable);
        if (ownerRentals.hasContent()) {
            return ownerRentals;
        }
        return rentalRepository.findByTenantName(userName, Role.TENANT, pageable);
    }

    private void createConversationForRental(Rental rental) {
    // Check if conversation already exists to avoid duplicates
    boolean conversationExists = conversationRepository.findByRentalId(rental.getId()).isPresent();
    
    if (!conversationExists) {
        Conversation conversation = new Conversation();
        conversation.setRental(rental);
        conversation.setActive(true);
        conversationRepository.save(conversation);
        }
    }


    @Transactional
    public Rental createRental(RentalDTO rentalDTO) {
        // Get the apartment
        Apartment apartment = apartmentRepository.findById(rentalDTO.getApartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Apartment not found"));
        
        // Get the tenant with EAGER loading of roles
        User tenant = userRepository.findById(rentalDTO.getTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));
        
        // Explicitly check tenant has TENANT role before proceeding
        if (tenant.getRoles() == null || !tenant.getRoles().contains(Role.TENANT)) {
            throw new IllegalStateException("User must have TENANT role to create a rental");
        }
        
        // Check for overlapping rentals
        boolean overlapping = apartment.isOccupiedBetween(rentalDTO.getStartDate(), rentalDTO.getEndDate());
        if (overlapping) {
            throw new IllegalStateException("Apartment is already booked for these dates");
        }
        
        // Create and save the rental
        Rental rental = new Rental();
        rental.setApartment(apartment);
        rental.setTenant(tenant);
        rental.setOwner(apartment.getOwner());
        rental.setStartDate(rentalDTO.getStartDate());
        rental.setEndDate(rentalDTO.getEndDate());
        rental.setStatus(RentalStatus.PENDING);
        
        // Calculate total cost based on days and rental price
        long nights = ChronoUnit.DAYS.between(rental.getStartDate(), rental.getEndDate());
        double baseCost = apartment.getRentalPrice() * nights;
        double totalFees = rentalDTO.getRentalFees();        
        rental.setTotalCost(baseCost + totalFees);
        rental.setRentalFees(totalFees);
        
        // Save rental first to get ID
        rental = rentalRepository.saveAndFlush(rental);
        
        // Create conversation
        createConversationForRental(rental);
        
        return rental;        
    }
    
    @Transactional
    public Rental updateRental(Long id, RentalDTO rentalDTO) {
        Rental rental = rentalRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rental not found"));
    
        // Find the apartment based on apartmentId
        Apartment apartment = apartmentRepository
                .findById(rentalDTO.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found"));
    
        // If user tries to change the dates or apartment, check availability
        if (!rental.getApartment().getId().equals(apartment.getId()) ||
            !rental.getStartDate().equals(rentalDTO.getStartDate()) ||
            !rental.getEndDate().equals(rentalDTO.getEndDate())) {
            
            // Check if the apartment is available for the new dates
            // Exclude the current rental from the check
            boolean occupied = apartment.getRentals().stream()
                .filter(r -> !r.getId().equals(rental.getId()))
                .filter(r -> r.getStatus() != RentalStatus.CANCELLED)
                .anyMatch(r -> 
                    (r.getStartDate().isBefore(rentalDTO.getEndDate()) || 
                     r.getStartDate().isEqual(rentalDTO.getEndDate())) && 
                    (r.getEndDate().isAfter(rentalDTO.getStartDate()) || 
                     r.getEndDate().isEqual(rentalDTO.getStartDate()))
                );
                
            if (occupied) {
                throw new IllegalStateException("Apartment is not available for the requested dates");
            }
        }

        // Update rental properties
        rental.setApartment(apartment);
        rental.setOwner(apartment.getOwner());
        rental.setStartDate(rentalDTO.getStartDate());
        rental.setEndDate(rentalDTO.getEndDate());
        rental.setTotalCost(apartment.getRentalPrice() + rentalDTO.getRentalFees());
        rental.setAuctionPaymentDeadline(rentalDTO.getAuctionPaymentDeadline());
        rental.setAuctionFineIssued(rentalDTO.getAuctionFineIssued());
        rental.setAuctionFineAmount(rentalDTO.getAuctionFineAmount());

        if (!rental.isAuction()) {
            long nights = ChronoUnit.DAYS.between(rental.getStartDate(), rental.getEndDate());
            double baseCost = apartment.getRentalPrice() * nights;
            rental.setTotalCost(baseCost + rentalDTO.getRentalFees());
            rental.setRentalFees(rentalDTO.getRentalFees());
        }

        if (rentalDTO.getStatus() != null) {
            rental.setStatus(RentalStatus.valueOf(rentalDTO.getStatus()));
        }

        return rentalRepository.saveAndFlush(rental);
    }

    @Transactional
    public void deleteRental(Long id) {
        Rental rental = rentalRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Rental not found"));

        rentalRepository.deleteById(id);
    }


    public Page<Rental> findByApartmentAddressContaining(String address, Pageable pageable) {
        return rentalRepository.findByApartmentAddressContaining(address, pageable);
    }

    public Page<Rental> findByTenantName(String tenantName, Pageable pageable) {
        return rentalRepository.findByTenantName(tenantName, Role.TENANT, pageable);
    }

    public Page<Rental> findByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return rentalRepository.findByDateRange(startDate, endDate, pageable);
    }

    public Page<Rental> findByOwnerName(String ownerName, Pageable pageable) {
        return rentalRepository.findByOwnerName(ownerName, Role.OWNER, pageable);
    }

    public Page<Rental> findByOccupied(boolean occupied, Pageable pageable) {
        return rentalRepository.findByOccupied(occupied, pageable);
    }

    public Page<Rental> searchRentals(RentalSearchCriteria criteria,
                                    int page,
                                    int size,
                                    String sortBy,
                                    String direction) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                direction.equalsIgnoreCase("ASC")
                        ? Sort.by(sortBy).ascending()
                        : Sort.by(sortBy).descending()
        );
    
        if (criteria.getAddress() != null) {
            return rentalRepository.findByApartmentAddressContaining(criteria.getAddress(), pageable);
        } else if (criteria.getOccupied() != null) {
            return rentalRepository.findByOccupied(criteria.getOccupied(), pageable);
        } else if (criteria.getOwnerName() != null) {
            return rentalRepository.findByOwnerName(criteria.getOwnerName(), Role.OWNER, pageable);
        } else if (criteria.getTenantName() != null) {
            return rentalRepository.findByTenantName(criteria.getTenantName(), Role.TENANT, pageable);
        } else if (criteria.getRentalStatus() != null) {
            return rentalRepository.findByStatus(RentalStatus.valueOf(criteria.getRentalStatus()), pageable);
        }
        return rentalRepository.findAll(pageable);
    }

    public Page<Rental> findRentalsByTotalCostGreaterThan(double cost, Pageable pageable) {
        return rentalRepository.findRentalsByTotalCostGreaterThan(cost, pageable);
    }

    public Page<Rental> findLuxuryRentals(Pageable pageable) {
        return rentalRepository.findLuxuryRentals(LUXURY_THRESHOLD, pageable);
    }

    public Page<Rental> findBudgetRentals(Pageable pageable) {
        return rentalRepository.findBudgetRentals(LUXURY_THRESHOLD, pageable);
    }

    public List<Object[]> findAverageRentalCostGroupedByCity() {
        return rentalRepository.findAverageRentalCostGroupedByCity();
    }
    
    @Transactional
    public Rental createRentalFromAuction(Rental rental) {
        // Skip availability checks since the auction already validated this
        
        rental.setRentalFees(0.0);
        
        // Save rental first to get ID
        rental = rentalRepository.save(rental);
        
        // Create conversation for all auction rentals
        createConversationForRental(rental);
        
        return rental;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Run daily at midnight - tested, works fine
    @Transactional
    public void updateRentalStatuses() {
        LocalDate today = LocalDate.now();
        
        // Update PENDING to ACTIVE when start date is reached
        // Only select rentals that are explicitly in PENDING status
        List<Rental> pendingRentals = rentalRepository.findByStatusAndStartDateLessThanEqual(
            RentalStatus.PENDING, today);
        pendingRentals.forEach(rental -> {
            rental.setStatus(RentalStatus.ACTIVE);
            rentalRepository.save(rental);
        });
        
        // Update ACTIVE to COMPLETED when end date has passed
        // Only select rentals that are explicitly in ACTIVE status
        List<Rental> activeRentals = rentalRepository.findByStatusAndEndDateLessThan(
            RentalStatus.ACTIVE, today);
        activeRentals.forEach(rental -> {
            rental.setStatus(RentalStatus.COMPLETED);
            rentalRepository.save(rental);
        });
    }

    @Transactional
    public Rental updateRentalStatus(Long id, String statusStr, String reason) {
        Rental rental = getRentalById(id);
        if (rental == null) {
            throw new EntityNotFoundException("Rental not found");
        }
        
        RentalStatus newStatus = RentalStatus.valueOf(statusStr);
        
        // Validate status transition
        validateStatusTransition(rental.getStatus(), newStatus);
        
        rental.setStatus(newStatus);
        
        return rentalRepository.save(rental);
    }
    
    private void validateStatusTransition(RentalStatus currentStatus, RentalStatus newStatus) {
        // Define valid transitions
        switch (currentStatus) {
            case PENDING:
                if (newStatus != RentalStatus.ACTIVE && newStatus != RentalStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from PENDING");
                }
                break;
            case ACTIVE:
                if (newStatus != RentalStatus.COMPLETED && newStatus != RentalStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from ACTIVE");
                }
                break;
            case COMPLETED:
            case CANCELLED:
                throw new IllegalStateException("Cannot change status from " + currentStatus);
        }
    }
    
    @Transactional
    public Rental cancelRental(Long id, String reason) {
        return updateRentalStatus(id, "CANCELLED", reason);
    }

    
    public List<Rental> findByApartmentIdAndDateRange(Long apartmentId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = LocalDate.now().plusMonths(3); // Default to 3 months ahead
        }
        
        return rentalRepository.findByApartmentIdAndDateBetween(apartmentId, startDate, endDate);
    }
    
    public List<Rental> findByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = LocalDate.now().plusMonths(3); // Default to 3 months ahead
        }
        
        // Fetch rentals where the user is either owner or tenant
        List<Rental> ownerRentals = rentalRepository.findByOwnerIdAndDateBetween(userId, startDate, endDate);
        List<Rental> tenantRentals = rentalRepository.findByTenantIdAndDateBetween(userId, startDate, endDate);
        
        // Combine the lists
        ownerRentals.addAll(tenantRentals);
        return ownerRentals;
    }
    
    public List<Rental> findByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = LocalDate.now().plusMonths(3); // Default to 3 months ahead
        }
        
        return rentalRepository.findByDateBetween(startDate, endDate);
    }
    
    public List<Rental> findByTenantIdAndStatus(Long tenantId, String statusStr) {
        RentalStatus status = RentalStatus.valueOf(statusStr.toUpperCase());
        return rentalRepository.findByTenantIdAndStatus(tenantId, status);
    }
    
    public List<Rental> findByTenantId(Long tenantId) {
        return rentalRepository.findByTenantId(tenantId);
    }
    
    public List<Rental> findByOwnerIdAndStatus(Long ownerId, String statusStr) {
        RentalStatus status = RentalStatus.valueOf(statusStr.toUpperCase());
        return rentalRepository.findByOwnerIdAndStatus(ownerId, status);
    }
    
    public List<Rental> findByOwnerId(Long ownerId) {
        return rentalRepository.findByOwnerId(ownerId);
    }

    public List<Rental> findByApartmentId(Long apartmentId) {
        return rentalRepository.findByApartmentId(apartmentId);
    }

    public long getActiveRentalCount() {
    return rentalRepository.countByStatus(RentalStatus.ACTIVE);
    }
    
    @Transactional
    public boolean confirmAuctionPayment(Long rentalId, String cardNumber) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new EntityNotFoundException("Rental not found"));
        
        if (!rental.isAuction()) {
            throw new IllegalStateException("This rental is not from an auction");
        }
        
        if (rental.getAuctionPaymentConfirmed()) {
            throw new IllegalStateException("Payment already confirmed");
        }
        
        // Check if deadline has passed
        if (rental.isAuctionPaymentOverdue()) {
            throw new IllegalStateException("Payment deadline has passed");
        }
        
        boolean paymentSuccess = processAuctionPaymentSimulation(cardNumber);
        
        if (paymentSuccess) {
            rental.setAuctionPaymentConfirmed(true);
            rentalRepository.save(rental);
            return true;
        }
        
        return false;
    }
    
    private boolean processAuctionPaymentSimulation(String cardNumber) {
        // Validate card number is exactly 10 digits
        if (cardNumber == null || !cardNumber.matches("\\d{10}")) {
            return false;
        }
        
        // Simulate processing delay
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Always fail for specific test cards
        if ("4000000000000002".equals(cardNumber)) {
            return false;
        }
        
        // 98% SUCCESS RATE FOR AUCTION PAYMENTS (higher than regular 90%)
        return Math.random() < 0.98;
    }
    
    // SCHEDULED TASK TO CHECK PAYMENT DEADLINES AND ISSUE FINES
    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    @Transactional
    public void checkAuctionPaymentDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find overdue auction rentals that haven't been fined yet
        List<Rental> overdueRentals = rentalRepository.findOverdueAuctionPayments(now);
        
        for (Rental rental : overdueRentals) {
            if (!rental.getAuctionFineIssued()) {
                // Issue 30% fine
                issueFineForOverduePayment(rental);
            }
        }
    }
    
    private void issueFineForOverduePayment(Rental rental) {
        // Calculate 30% fine
        double fineAmount = rental.getTotalCost() * 0.30;
        
        rental.setAuctionFineIssued(true);
        rental.setAuctionFineAmount(fineAmount);
        rentalRepository.save(rental);
        
        System.out.println("FINE ISSUED: " + rental.getTenant().getUsername() + 
                          " owes $" + fineAmount + " for overdue auction payment");
    }
    
    public List<Rental> getUserOverdueAuctionRentals(Long userId) {
        return rentalRepository.findOverdueAuctionPaymentsByUser(userId, LocalDateTime.now());
    }
    
    @Transactional
    public boolean payAuctionFine(Long rentalId, String cardNumber) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new EntityNotFoundException("Rental not found"));
        
        if (!rental.getAuctionFineIssued() || rental.getAuctionFineAmount() == null) {
            throw new IllegalStateException("No fine to pay for this rental");
        }
        
        // Process fine payment
        boolean paymentSuccess = processAuctionPaymentSimulation(cardNumber);
        
        if (paymentSuccess) {
            // Clear fine and confirm original payment
            rental.setAuctionPaymentConfirmed(true);
            rental.setAuctionFineIssued(false);
            rental.setAuctionFineAmount(null);
            rentalRepository.save(rental);
            
            // Unblock user if they were blocked
            User tenant = rental.getTenant();
            if (tenant.isCurrentlyBlocked()) {
                tenant.unblockUser();
                userRepository.save(tenant);
            }
            
            return true;
        }
        
        return false;
    }
    
    // SCHEDULED TASK TO BLOCK USERS WITH UNPAID FINES
    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void blockUsersWithUnpaidFines() {
        LocalDateTime fineDeadline = LocalDateTime.now().minusHours(24); // 24h to pay fine
        
        List<Rental> unpaidFines = rentalRepository.findUnpaidFinesOlderThan(fineDeadline);
        
        for (Rental rental : unpaidFines) {
            User tenant = rental.getTenant();
            if (!tenant.isCurrentlyBlocked()) {
                tenant.blockUser("Unpaid auction fine of $" + rental.getAuctionFineAmount());
                userRepository.save(tenant);
                
                System.out.println("🚫 USER BLOCKED: " + tenant.getUsername() + 
                                  " - Fine escalated to higher authorities");
            }
        }
    }

    public Boolean isAuctionPaymentConfirmed(Long id) {
        Rental rental = getRentalById(id);
        if (rental == null) {
            throw new EntityNotFoundException("Rental not found with id: " + id);
        }
        
        if (!rental.isAuction()) {
            throw new IllegalStateException("Rental with id " + id + " is not an auction rental");
        }
        
        return rental.getAuctionPaymentConfirmed();
    }
    

    public Boolean isAuctionFineIssued(Long id) {
        Rental rental = getRentalById(id);
        if (rental == null) {
            throw new EntityNotFoundException("Rental not found with id: " + id);
        }
        
        if (!rental.isAuction()) {
            throw new IllegalStateException("Rental with id " + id + " is not an auction rental");
        }
        
        return rental.getAuctionFineIssued();
    }
}