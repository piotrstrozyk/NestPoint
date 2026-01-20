package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pl.ug.NestPoint.dto.PaymentRequestDTO;
import pl.ug.NestPoint.dto.PaymentResponseDTO;
import pl.ug.NestPoint.dto.RentalDTO;
import pl.ug.NestPoint.dto.RentalSearchCriteria;
import pl.ug.NestPoint.dto.RentalWithPaymentDTO;
import pl.ug.NestPoint.mapper.RentalMapper;
import pl.ug.NestPoint.service.PaymentSimulationService;
import pl.ug.NestPoint.service.RentalService;
import pl.ug.NestPoint.domain.Rental;
import pl.ug.NestPoint.domain.RentalStatus;

import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.persistence.EntityNotFoundException;


@RestController
@RequestMapping("/rentals")
@RequiredArgsConstructor
public class RentalController {
    private final RentalService rentalService;
    private final RentalMapper rentalMapper;
    private final PaymentSimulationService paymentSimulationService;


    @PostMapping("/create-with-payment")
    public ResponseEntity<?> createRentalWithPayment(@RequestBody RentalWithPaymentDTO rentalWithPayment) {
        // First process payment
        PaymentRequestDTO paymentRequest = rentalWithPayment.getPayment();
        
        // Verify card number length
        if (paymentRequest == null || paymentRequest.getCardNumber() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Payment information is required"
            ));
        }
        
        // Process the payment simulation
        boolean paymentSuccess = paymentSimulationService.processPayment(paymentRequest.getCardNumber());
        
        if (!paymentSuccess) {
            // Payment failed
            PaymentResponseDTO response = new PaymentResponseDTO();
            response.setSuccess(false);
            response.setMessage("Payment declined. Please try again with a different card.");
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
        }
        
        // Payment succeeded, create rental
        try {
            RentalDTO rentalDTO = rentalWithPayment.getRental();
            Rental rental = rentalService.createRental(rentalDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(rentalMapper.toDTO(rental));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", "Rental creation failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<RentalDTO>> getAllRentals() {
        List<RentalDTO> rentals = rentalService.getAllRentals().stream()
                .map(rentalMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rentals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalDTO> getRentalById(@PathVariable Long id) {
        RentalDTO rentalDTO = rentalMapper.toDTO(rentalService.getRentalById(id));
        if (rentalDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rentalDTO);
    }

    @PostMapping
    public ResponseEntity<?> createRental(@RequestBody RentalDTO rentalDTO) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "success", false,
            "message", "Direct rental creation is not allowed. Please use /rentals/create-with-payment endpoint."
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RentalDTO> updateRental(@PathVariable Long id, @RequestBody RentalDTO rentalDTO) {
        rentalService.updateRental(id, rentalDTO);
        return ResponseEntity.ok(rentalDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRental(@PathVariable Long id) {
        rentalService.deleteRental(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/search")
    public ResponseEntity<Page<RentalDTO>> searchRentals(@RequestBody RentalSearchCriteria criteria,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size,
                                                         @RequestParam(defaultValue = "id") String sortBy,
                                                         @RequestParam(defaultValue = "ASC") String direction) {
        Page<RentalDTO> rentals = rentalService
                .searchRentals(criteria, page, size, sortBy, direction)
                .map(rentalMapper::toDTO);
        return ResponseEntity.ok(rentals);
    }

    @GetMapping("/my-rentals/tenant/{userId}")
    public ResponseEntity<List<RentalDTO>> getMyTenantRentals(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        
        List<RentalDTO> rentals;
        if (status != null) {
            rentals = rentalService.findByTenantIdAndStatus(userId, status)
                    .stream().map(rentalMapper::toDTO).collect(Collectors.toList());
        } else {
            rentals = rentalService.findByTenantId(userId)
                    .stream().map(rentalMapper::toDTO).collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(rentals);
    }
    
    @GetMapping("/my-rentals/owner/{userId}")
    public ResponseEntity<List<RentalDTO>> getMyOwnerRentals(
            @PathVariable Long userId,
            @RequestParam(required = false) String status) {
        
        List<RentalDTO> rentals;
        if (status != null) {
            rentals = rentalService.findByOwnerIdAndStatus(userId, status)
                    .stream().map(rentalMapper::toDTO).collect(Collectors.toList());
        } else {
            rentals = rentalService.findByOwnerId(userId)
                    .stream().map(rentalMapper::toDTO).collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(rentals);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RentalDTO> updateRentalStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String reason) {
        
        Rental updated = rentalService.updateRentalStatus(id, status, reason);
        return ResponseEntity.ok(rentalMapper.toDTO(updated));
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<RentalDTO> cancelRental(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        
        Rental cancelled = rentalService.cancelRental(id, reason);
        return ResponseEntity.ok(rentalMapper.toDTO(cancelled));
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<Map<String, Object>>> getRentalsForCalendar(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<Rental> rentals;
        if (apartmentId != null) {
            rentals = rentalService.findByApartmentIdAndDateRange(apartmentId, startDate, endDate);
        } else if (userId != null) {
            rentals = rentalService.findByUserIdAndDateRange(userId, startDate, endDate);
        } else {
            rentals = rentalService.findByDateRange(startDate, endDate);
        }
        
        // Map to calendar-friendly format
        List<Map<String, Object>> calendarEvents = rentals.stream().map(rental -> {
            Map<String, Object> event = new HashMap<>();
            event.put("id", rental.getId());
            event.put("title", "Rental: " + rental.getApartment().getTitle());
            event.put("start", rental.getStartDate().toString());
            event.put("end", rental.getEndDate().toString());
            event.put("status", rental.getStatus().toString());
            event.put("color", getColorForStatus(rental.getStatus()));
            return event;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(calendarEvents);
    }
    
    private String getColorForStatus(RentalStatus status) {
        switch (status) {
            case PENDING: return "#FFA500";  // Orange
            case ACTIVE: return "#008000";   // Green
            case COMPLETED: return "#0000FF"; // Blue
            case CANCELLED: return "#FF0000"; // Red
            default: return "#808080";       // Gray
        }
    }

    @PostMapping("/{id}/confirm-auction-payment")
    public ResponseEntity<?> confirmAuctionPayment(
            @PathVariable Long id,
            @RequestBody Map<String, String> paymentData) {
        
        try {
            String cardNumber = paymentData.get("cardNumber");
            if (cardNumber == null || cardNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Card number is required"
                ));
            }
            
            boolean paymentSuccess = rentalService.confirmAuctionPayment(id, cardNumber);
            
            if (paymentSuccess) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Auction payment confirmed successfully!"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "success", false,
                    "message", "Payment declined. Please try again with a different card."
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/pay-auction-fine")
    public ResponseEntity<?> payAuctionFine(
            @PathVariable Long id,
            @RequestBody Map<String, String> paymentData) {
        
        try {
            String cardNumber = paymentData.get("cardNumber");
            boolean paymentSuccess = rentalService.payAuctionFine(id, cardNumber);
            
            if (paymentSuccess) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Fine paid successfully! Your account is now unblocked."
                ));
            } else {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "success", false,
                    "message", "Payment declined. Please try again."
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}/overdue-auction-payments")
    public ResponseEntity<List<RentalDTO>> getOverdueAuctionPayments(@PathVariable Long userId) {
        List<RentalDTO> overdue = rentalService.getUserOverdueAuctionRentals(userId)
                .stream()
                .map(rentalMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(overdue);
    }

    @GetMapping("/{id}/auction-payment-confirmed")
    public ResponseEntity<Boolean> isAuctionPaymentConfirmed(@PathVariable Long id) {
        try {
            Boolean isConfirmed = rentalService.isAuctionPaymentConfirmed(id);
            return ResponseEntity.ok(isConfirmed);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    @GetMapping("/{id}/auction-fine-issued")
    public ResponseEntity<Boolean> isAuctionFineIssued(@PathVariable Long id) {
        try {
            Boolean isFineIssued = rentalService.isAuctionFineIssued(id);
            return ResponseEntity.ok(isFineIssued);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(false);
        }
    }

    @GetMapping("/{id}/auction-fine-details")
    public ResponseEntity<Map<String, Object>> getAuctionFineDetails(@PathVariable Long id) {
        try {
            Rental rental = rentalService.getRentalById(id);
            if (rental == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (!rental.isAuction()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Rental is not an auction rental"
                ));
            }
            
            Map<String, Object> details = new HashMap<>();
            details.put("rentalId", rental.getId());
            details.put("fineIssued", rental.getAuctionFineIssued());
            details.put("fineAmount", rental.getAuctionFineAmount());
            details.put("paymentDeadline", rental.getAuctionPaymentDeadline());
            details.put("paymentStatus", rental.getAuctionPaymentConfirmed());
            
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
}