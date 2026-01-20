package pl.ug.NestPoint.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.domain.enums.AuctionStatus;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.dto.AuctionDTO;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.dto.websocket.AuctionBidMessage;
import pl.ug.NestPoint.dto.websocket.AuctionStatusMessage;
import pl.ug.NestPoint.mapper.AuctionMapper;
import pl.ug.NestPoint.mapper.BidMapper;
import pl.ug.NestPoint.repository.ApartmentRepository;
import pl.ug.NestPoint.repository.AuctionRepository;
import pl.ug.NestPoint.repository.BidRepository;
import pl.ug.NestPoint.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuctionService {
    
    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final RentalService rentalService;
    private final AuctionMapper auctionMapper;
    private final BidMapper bidMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Set<Long>> participantsRedisTemplate;
    
    // Redis key patterns
    private static final String AUCTION_PARTICIPANTS_KEY_PREFIX = "auction:participants:";
    private static final long REDIS_KEY_EXPIRATION_TIME = 24; // hours
    
    // Helper methods for Redis operations
    private String getAuctionParticipantsKey(Long auctionId) {
        return AUCTION_PARTICIPANTS_KEY_PREFIX + auctionId;
    }
    
    private Set<Long> getAuctionParticipants(Long auctionId) {
        String key = getAuctionParticipantsKey(auctionId);
        Set<Long> participants = participantsRedisTemplate.opsForValue().get(key);
        return participants != null ? participants : new HashSet<>();
    }
    
    private void saveAuctionParticipants(Long auctionId, Set<Long> participants) {
        String key = getAuctionParticipantsKey(auctionId);
        participantsRedisTemplate.opsForValue().set(key, participants, REDIS_KEY_EXPIRATION_TIME, TimeUnit.HOURS);
    }
    
    // Core CRUD operations
    public List<AuctionDTO> getAllAuctions() {
        return auctionRepository.findAll().stream()
                .map(auctionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    public AuctionDTO getAuctionById(Long id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with id: " + id));
        return auctionMapper.toDTO(auction);
    }
    
    public List<AuctionDTO> getActiveAuctions() {
        return auctionRepository.findByStatus(AuctionStatus.ACTIVE).stream()
                .map(auctionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<AuctionDTO> getAuctionsByOwnerId(Long ownerId) {
        return auctionRepository.findByOwnerId(ownerId).stream()
                .map(auctionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<AuctionDTO> getAuctionsByBidder(Long bidderId) {
        return auctionRepository.findAuctionsByBidder(bidderId).stream()
                .map(auctionMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public AuctionDTO createAuction(AuctionDTO auctionDTO) {
        Apartment apartment = apartmentRepository.findById(auctionDTO.getApartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Apartment not found"));
        
        if (apartment.getOwner() == null || !apartment.getOwner().isOwner()) {
            throw new IllegalStateException("Apartment must belong to an owner");
        }
        
        if (apartment.isOccupiedBetween(auctionDTO.getRentalStartDate(), auctionDTO.getRentalEndDate())) {
            throw new IllegalStateException("Apartment is already booked for the specified period");
        }
        
        Auction auction = auctionMapper.toEntity(auctionDTO);
        auction.setApartment(apartment);
        auction.setStatus(AuctionStatus.PENDING);
        
        if (auction.getMaxBidders() <= 0) {
            auction.setMaxBidders(10);
        }
        
        Auction savedAuction = auctionRepository.save(auction);
        return auctionMapper.toDTO(savedAuction);
    }
    
    @Transactional
    public BidDTO placeBid(BidDTO bidDTO) {
        Auction auction = auctionRepository.findById(bidDTO.getAuctionId())
                .orElseThrow(() -> new EntityNotFoundException("Auction not found"));
        
        User bidder = userRepository.findById(bidDTO.getBidderId())
                .orElseThrow(() -> new EntityNotFoundException("Bidder not found"));
        
        // Verify bidder is a tenant
        if (!bidder.getRoles().contains(Role.TENANT)) {
            throw new IllegalStateException("Only tenants can place bids");
        }
        
        // Check if auction is active
        if (!auction.isActive()) {
            throw new IllegalStateException("Auction is not active");
        }
        
        // Check if there's room for this bidder
        boolean isBidderAlreadyParticipating = bidRepository.findByAuctionIdAndBidderId(
                auction.getId(), bidder.getId()).size() > 0;
                
        if (!isBidderAlreadyParticipating && !auction.canAcceptMoreBidders()) {
            throw new IllegalStateException("Maximum number of bidders reached");
        }
        
        // RATE LIMITING: Check if the bidder has placed a bid in the last 15 minutes
        List<Bid> recentBids = bidRepository.findByAuctionIdAndBidderId(auction.getId(), bidder.getId());
        if (!recentBids.isEmpty()) {
            // Get most recent bid
            Bid mostRecentBid = recentBids.stream()
                    .max(Comparator.comparing(Bid::getBidTime))
                    .orElse(null);
            
            if (mostRecentBid != null) {
                LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minus(15, ChronoUnit.MINUTES);
                if (mostRecentBid.getBidTime().isAfter(fifteenMinutesAgo)) {
                    throw new IllegalStateException("You can only place one bid every 15 minutes. Please try again later.");
                }
            }
        }
        
        // Check minimum bid amount
        double minimumBid = auction.getCurrentHighestBid() + auction.getMinimumBidIncrement();
        if (bidDTO.getAmount() < minimumBid) {
            throw new IllegalStateException("Bid amount must be at least " + minimumBid);
        }
        
        // Process auto-bid if applicable
        Bid bid = bidMapper.toEntity(bidDTO);
        bid.setAuction(auction);
        bid.setBidder(bidder);
        bid.setBidTime(LocalDateTime.now());
        
        // Save the bid
        Bid savedBid = bidRepository.save(bid);
        
        // Process auto-bids from other bidders
        processAutoBids(auction.getId(), savedBid);
        
        // Send WebSocket notification
        AuctionBidMessage bidMessage = AuctionBidMessage.builder()
                .auctionId(auction.getId())
                .bidderId(bidder.getId())
                .bidderUsername(bidder.getUsername())
                .bidAmount(bid.getAmount())
                .bidTime(bid.getBidTime())
                .isWinningBid(isWinningBid(auction, bid))
                .build();
        
        messagingTemplate.convertAndSend("/topic/auction/" + auction.getId() + "/bids", bidMessage);
        
        // Update auction status for all participants
        sendAuctionStatusUpdate(auction);
        
        return bidMapper.toDTO(savedBid);
    }
    
    private boolean isWinningBid(Auction auction, Bid bid) {
        Bid winningBid = auction.getWinningBid();
        return winningBid != null && winningBid.getId().equals(bid.getId());
    }
    
    @Transactional
    public void cancelAuction(Long id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found"));
        
        if (auction.getStatus() == AuctionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed auction");
        }
        
        auction.setStatus(AuctionStatus.CANCELLED);
        auctionRepository.save(auction);
        
        // Notify participants about cancellation
        sendAuctionStatusUpdate(auction);
    }
    
    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    @Transactional
    public void processAuctionStatuses() {
        LocalDateTime now = LocalDateTime.now();
        
        // Activate pending auctions whose start time has passed
        List<Auction> pendingAuctions = auctionRepository.findPendingAuctionsToBeActivated(now);
        pendingAuctions.forEach(auction -> {
            auction.setStatus(AuctionStatus.ACTIVE);
            auctionRepository.save(auction);
            sendAuctionStatusUpdate(auction);
        });
        
        // Complete active auctions whose end time has passed
        List<Auction> expiredAuctions = auctionRepository.findExpiredActiveAuctions(now);
        expiredAuctions.forEach(this::completeAuction);
        
        // Update status for all active auctions
        List<Auction> activeAuctions = auctionRepository.findByStatus(AuctionStatus.ACTIVE);
        activeAuctions.forEach(this::sendAuctionStatusUpdate);
    }
    
    @Transactional
    public void completeAuction(Auction auction) {
        Bid winningBid = auction.getWinningBid();
        
        if (winningBid != null) {
            // Create a rental for the winning bidder
            Rental rental = new Rental();
            rental.setApartment(auction.getApartment());
            rental.setTenant(winningBid.getBidder());
            rental.setOwner(auction.getApartment().getOwner());
            rental.setStartDate(auction.getRentalStartDate());
            rental.setEndDate(auction.getRentalEndDate());
            
            rental.setAuction(true);
            rental.setTotalCost(winningBid.getAmount());
            rental.setStatus(RentalStatus.PENDING);
            
            rental.setAuctionPaymentConfirmed(false);
            rental.setAuctionPaymentDeadline(LocalDateTime.now().plusHours(24)); // 24h deadline
            rental.setAuctionFineIssued(false);
            rental.setAuctionFineAmount(0.0);
            
            // Set the resulting rental
            Rental savedRental = rentalService.createRentalFromAuction(rental);
            auction.setResultingRental(savedRental);
        }
        
        auction.setStatus(AuctionStatus.COMPLETED);
        Auction savedAuction = auctionRepository.save(auction);
        
        // Send status update (existing functionality)
        sendAuctionStatusUpdate(savedAuction);
    }
    
    // Add user to auction participants in Redis and notify others
    @Transactional    
    public void addUserToAuction(Long auctionId, Long userId) {
        // Check if auction exists
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found"));
        
        // Get current participants from Redis
        Set<Long> participants = getAuctionParticipants(auctionId);
        
        // Add user to participants
        participants.add(userId);
        
        // Save updated participants set to Redis
        saveAuctionParticipants(auctionId, participants);
        
        // Send current auction state to the new participant
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        // Send participant joined message to all
        messagingTemplate.convertAndSend(
                "/topic/auction/" + auctionId + "/participants", 
                user.getUsername() + " joined the auction"
        );
        
        // Send current auction status to the new participant
        sendAuctionStatusUpdate(auction);
    }
    
    public void removeUserFromAuction(Long auctionId, Long userId) {
        // Get current participants from Redis
        Set<Long> participants = getAuctionParticipants(auctionId);
        
        if (!participants.isEmpty()) {
            // Remove user from participants
            participants.remove(userId);
            
            // If participants set is empty, delete the key
            if (participants.isEmpty()) {
                participantsRedisTemplate.delete(getAuctionParticipantsKey(auctionId));
            } else {
                // Otherwise save the updated set
                saveAuctionParticipants(auctionId, participants);
            }
            
            // Notify other participants
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
            
            messagingTemplate.convertAndSend(
                    "/topic/auction/" + auctionId + "/participants", 
                    user.getUsername() + " left the auction"
            );
        }
    }
    
    // Get count of active auction observers (WebSocket connections)
    public int getActiveAuctionObserverCount(Long auctionId) {
        Set<Long> participants = getAuctionParticipants(auctionId);
        return participants.size();
    }
    
    // Scheduled task to clean up stale auction participant data
    @Scheduled(fixedRate = 3600000) // Run every hour
    public void cleanupStaleAuctionParticipants() {
        // This is less important with Redis's TTL functionality,
        // but we can still implement additional cleanup logic if needed
        List<Auction> completedAuctions = auctionRepository.findByStatus(AuctionStatus.COMPLETED);
        completedAuctions.forEach(auction -> {
            // Delete participant entries for completed auctions older than 24 hours
            if (auction.getEndTime().isBefore(LocalDateTime.now().minus(24, ChronoUnit.HOURS))) {
                participantsRedisTemplate.delete(getAuctionParticipantsKey(auction.getId()));
            }
        });
    }
    
    private void sendAuctionStatusUpdate(Auction auction) {
        AuctionStatusMessage statusMessage = createStatusMessage(auction);
        messagingTemplate.convertAndSend("/topic/auction/" + auction.getId() + "/status", statusMessage);
    }
    
    private AuctionStatusMessage createStatusMessage(Auction auction) {
        AuctionStatusMessage message = new AuctionStatusMessage();
        message.setAuctionId(auction.getId());
        message.setStatus(auction.getStatus());
        message.setTimestamp(LocalDateTime.now());
        
        // Calculate time remaining
        if (auction.getStatus() == AuctionStatus.ACTIVE) {
            long secondsRemaining = LocalDateTime.now().until(auction.getEndTime(), ChronoUnit.SECONDS);
            message.setTimeRemainingSeconds(Math.max(0, secondsRemaining));
        }
        
        // Set bidder count
        message.setRemainingBidders(auction.getMaxBidders() - auction.getCurrentBidderCount());
        
        // Set observer count (WebSocket connections)
        message.setActiveObservers(getActiveAuctionObserverCount(auction.getId()));
        
        // Set winning bid info if available
        Bid winningBid = auction.getWinningBid();
        if (winningBid != null) {
            message.setWinningBidAmount(winningBid.getAmount());
            message.setWinningBidderId(winningBid.getBidder().getId());
        } else {
            message.setWinningBidAmount(auction.getStartingPrice());
        }
        
        // Add a status message
        message.setMessage(createStatusMessageText(auction));
        
        return message;
    }
    
    private String createStatusMessageText(Auction auction) {
        switch (auction.getStatus()) {
            case PENDING:
                return "Auction will start at " + auction.getStartTime();
            case ACTIVE:
                LocalDateTime now = LocalDateTime.now();
                long hoursRemaining = now.until(auction.getEndTime(), ChronoUnit.HOURS);
                long minutesRemaining = now.until(auction.getEndTime(), ChronoUnit.MINUTES) % 60;
                
                if (hoursRemaining > 0) {
                    return "Auction in progress: " + hoursRemaining + "h " + minutesRemaining + "m remaining";
                } else {
                    return "Auction in progress: " + minutesRemaining + "m remaining";
                }
            case COMPLETED:
                Bid winningBid = auction.getWinningBid();
                if (winningBid != null) {
                    return "Auction has ended. Winner: " + winningBid.getBidder().getUsername() + 
                           " with bid of $" + winningBid.getAmount();
                } else {
                    return "Auction has ended with no bids";
                }
            case CANCELLED:
                return "This auction has been cancelled";
            default:
                return "Unknown auction status";
        }
    }
    
    @Transactional
    protected void processAutoBids(Long auctionId, Bid newBid) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found"));
        
        // Get all auto-bids for this auction except from the current bidder
        List<Bid> autoBids = bidRepository.findByAuctionId(auctionId).stream()
                .filter(b -> b.isAutoBid() && !b.getBidder().getId().equals(newBid.getBidder().getId()))
                .collect(Collectors.toList());
        
        if (autoBids.isEmpty()) {
            return;
        }
        
        double currentHighestBid = auction.getCurrentHighestBid();
        double minimumIncrement = auction.getMinimumBidIncrement();
        
        for (Bid autoBid : autoBids) {
            // Skip if this auto-bid's max is less than what would be needed to outbid
            if (autoBid.getMaxAutoBidAmount() < currentHighestBid + minimumIncrement) {
                continue;
            }
            
            // Place a new bid at the minimum required amount
            double newAmount = currentHighestBid + minimumIncrement;
            
            // Don't exceed their maximum
            if (newAmount > autoBid.getMaxAutoBidAmount()) {
                newAmount = autoBid.getMaxAutoBidAmount();
            }
            
            Bid automaticBid = new Bid();
            automaticBid.setAuction(auction);
            automaticBid.setBidder(autoBid.getBidder());
            automaticBid.setAmount(newAmount);
            automaticBid.setBidTime(LocalDateTime.now());
            automaticBid.setAutoBid(true);
            automaticBid.setMaxAutoBidAmount(autoBid.getMaxAutoBidAmount());
            
            Bid savedAutoBid = bidRepository.save(automaticBid);
            
            // Notify participants about auto-bid
            AuctionBidMessage bidMessage = AuctionBidMessage.builder()
                    .auctionId(auction.getId())
                    .bidderId(autoBid.getBidder().getId())
                    .bidderUsername(autoBid.getBidder().getUsername())
                    .bidAmount(newAmount)
                    .bidTime(automaticBid.getBidTime())
                    .isWinningBid(true)
                    .build();
            
            messagingTemplate.convertAndSend("/topic/auction/" + auction.getId() + "/bids", bidMessage);
            
            // Update current highest for the next iteration
            currentHighestBid = newAmount;
        }
        
        // Send updated auction status
        sendAuctionStatusUpdate(auction);
    }
}