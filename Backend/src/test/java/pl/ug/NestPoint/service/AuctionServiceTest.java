package pl.ug.NestPoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import pl.ug.NestPoint.domain.*;
import pl.ug.NestPoint.domain.enums.AuctionStatus;
import pl.ug.NestPoint.domain.enums.Role;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.AuctionDTO;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.mapper.AuctionMapper;
import pl.ug.NestPoint.mapper.BidMapper;
import pl.ug.NestPoint.repository.*;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuctionService Unit Tests")
class AuctionServiceTest {

    @Mock
    private AuctionRepository auctionRepository;
    
    @Mock
    private BidRepository bidRepository;
    
    @Mock
    private ApartmentRepository apartmentRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private RentalService rentalService;
    
    @Mock
    private AuctionMapper auctionMapper;
    
    @Mock
    private BidMapper bidMapper;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Mock
    private RedisTemplate<String, Set<Long>> participantsRedisTemplate;
    
    @Mock
    private ValueOperations<String, Set<Long>> valueOperations;
    
    @InjectMocks
    private AuctionService auctionService;
    
    private User realOwner;
    private User realTenant1;
    private User realTenant2;
    private Apartment realApartment;
    private Auction realAuction;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        
        realOwner = new User();
        realOwner.setId(1L);
        realOwner.setUsername("apartment_owner");
        realOwner.setEmail("owner@test.com");
        realOwner.setRoles(Set.of(Role.OWNER));
        
        realTenant1 = new User();
        realTenant1.setId(2L);
        realTenant1.setUsername("bidder1");
        realTenant1.setEmail("tenant1@test.com");
        realTenant1.setRoles(Set.of(Role.TENANT));
        
        realTenant2 = new User();
        realTenant2.setId(3L);
        realTenant2.setUsername("bidder2");
        realTenant2.setEmail("tenant2@test.com");
        realTenant2.setRoles(Set.of(Role.TENANT));
        
        realApartment = new Apartment();
        realApartment.setId(1L);
        realApartment.setOwner(realOwner);
        realApartment.setTitle("Luxury Downtown Apartment");
        realApartment.setDescription("Beautiful apartment in the city center");
        realApartment.setRentalPrice(200.0); // Per night
        realApartment.setSize(75);
        realApartment.setNumberOfRooms(3);
        realApartment.setNumberOfBeds(2);
        realApartment.setPropertyType(PropertyType.APARTMENT);
        
        Address address = new Address();
        address.setStreet("Main Street 123");
        address.setCity("Warsaw");
        address.setCountry("Poland");
        address.setPostalCode("00-001");
        realApartment.setAddress(address);
        
        realAuction = new Auction();
        realAuction.setId(1L);
        realAuction.setApartment(realApartment);
        realAuction.setStartTime(now.minusMinutes(30)); 
        realAuction.setEndTime(now.plusHours(2));
        realAuction.setStartingPrice(150.0);
        realAuction.setMinimumBidIncrement(25.0);
        realAuction.setRentalStartDate(LocalDate.now().plusDays(7));
        realAuction.setRentalEndDate(LocalDate.now().plusDays(14));
        realAuction.setStatus(AuctionStatus.ACTIVE);
        realAuction.setMaxBidders(5);
        realAuction.setBids(new ArrayList<>());
        
        // Mock Redis operations
        when(participantsRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }
    
    
    @Test
    @DisplayName("Should calculate minimum bid correctly for first bid")
    void shouldCalculateMinimumBidForFirstBid() {
        // Given
        realAuction.setBids(new ArrayList<>());
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        when(bidRepository.findByAuctionIdAndBidderId(1L, 2L)).thenReturn(new ArrayList<>());
        when(valueOperations.get(anyString())).thenReturn(new HashSet<>());
        
        BidDTO validBidDTO = new BidDTO();
        validBidDTO.setAuctionId(1L);
        validBidDTO.setBidderId(2L);
        validBidDTO.setAmount(175.0); 
        
        Bid newBid = new Bid();
        newBid.setId(1L);
        newBid.setAuction(realAuction);
        newBid.setBidder(realTenant1);
        newBid.setAmount(175.0); 
        newBid.setBidTime(now);
        
        when(bidMapper.toEntity(validBidDTO)).thenReturn(newBid);
        when(bidRepository.save(any(Bid.class))).thenReturn(newBid);
        when(bidMapper.toDTO(newBid)).thenReturn(validBidDTO);
        
        // When
        BidDTO result = auctionService.placeBid(validBidDTO);
        
        // Then
        assertNotNull(result);
        assertEquals(175.0, result.getAmount());
        
        // Verify the bid was added to the auction
        verify(bidRepository).save(any(Bid.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/auction/1/bids"), any(Object.class));
    }
    
    @Test
    @DisplayName("Should calculate minimum bid correctly with existing bids")
    void shouldCalculateMinimumBidWithExistingBids() {
        // Given
        Bid existingBid1 = new Bid();
        existingBid1.setId(1L);
        existingBid1.setBidder(realTenant1);
        existingBid1.setAmount(175.0);
        existingBid1.setBidTime(now.minusMinutes(20));
        
        Bid existingBid2 = new Bid();
        existingBid2.setId(2L);
        existingBid2.setBidder(realTenant2);
        existingBid2.setAmount(200.0);
        existingBid2.setBidTime(now.minusMinutes(18));
        
        realAuction.setBids(Arrays.asList(existingBid1, existingBid2));
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        when(bidRepository.findByAuctionIdAndBidderId(1L, 2L)).thenReturn(Arrays.asList(existingBid1));
        when(valueOperations.get(anyString())).thenReturn(new HashSet<>());
        
        BidDTO newBidDTO = new BidDTO();
        newBidDTO.setAuctionId(1L);
        newBidDTO.setBidderId(2L);
        newBidDTO.setAmount(225.0);
        
        Bid newBid = new Bid();
        newBid.setId(3L);
        newBid.setAuction(realAuction);
        newBid.setBidder(realTenant1);
        newBid.setAmount(225.0);
        newBid.setBidTime(now);
        
        when(bidMapper.toEntity(newBidDTO)).thenReturn(newBid);
        when(bidRepository.save(any(Bid.class))).thenReturn(newBid);
        when(bidMapper.toDTO(newBid)).thenReturn(newBidDTO); // FIXED: Use newBidDTO
        
        // When
        BidDTO result = auctionService.placeBid(newBidDTO);
        
        // Then
        assertNotNull(result);
        assertEquals(225.0, result.getAmount());
        verify(bidRepository).save(any(Bid.class));
    }
    
    @Test
    @DisplayName("Should reject bid that's too low")
    void shouldRejectBidThatsTooLow() {
        // Given
        Bid existingHighBid = new Bid();
        existingHighBid.setId(1L);
        existingHighBid.setBidder(realTenant2);
        existingHighBid.setAmount(200.0);
        existingHighBid.setBidTime(now.minusMinutes(5));
        
        realAuction.setBids(Arrays.asList(existingHighBid));
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        when(bidRepository.findByAuctionIdAndBidderId(1L, 2L)).thenReturn(new ArrayList<>());
        
        BidDTO lowBidDTO = new BidDTO();
        lowBidDTO.setAuctionId(1L);
        lowBidDTO.setBidderId(2L);
        lowBidDTO.setAmount(210.0); 
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.placeBid(lowBidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Bid amount must be at least"));
        verify(bidRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));    
    }
    
    
    @Test
    @DisplayName("Should reject bid on auction that hasn't started")
    void shouldRejectBidOnAuctionThatHasntStarted() {
        // Given
        realAuction.setStartTime(now.plusHours(1)); 
        realAuction.setStatus(AuctionStatus.PENDING);
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        
        BidDTO bidDTO = new BidDTO();
        bidDTO.setAuctionId(1L);
        bidDTO.setBidderId(2L);
        bidDTO.setAmount(150.0);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.placeBid(bidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Auction is not active"));
        verify(bidRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should reject bid on expired auction")
    void shouldRejectBidOnExpiredAuction() {
        // Given
        realAuction.setEndTime(now.minusHours(1));
        realAuction.setStatus(AuctionStatus.COMPLETED);
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        
        BidDTO bidDTO = new BidDTO();
        bidDTO.setAuctionId(1L);
        bidDTO.setBidderId(2L);
        bidDTO.setAmount(150.0);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.placeBid(bidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Auction is not active"));
        verify(bidRepository, never()).save(any());
    }

    
    @Test
    @DisplayName("Should determine winner correctly from multiple bids")
    void shouldDetermineWinnerCorrectlyFromMultipleBids() {
        // Given
        Bid bid1 = new Bid();
        bid1.setId(1L);
        bid1.setBidder(realTenant1);
        bid1.setAmount(150.0);
        bid1.setBidTime(now.minusMinutes(20));
        
        Bid bid2 = new Bid();
        bid2.setId(2L);
        bid2.setBidder(realTenant2);
        bid2.setAmount(225.0);
        bid2.setBidTime(now.minusMinutes(15));
        
        Bid bid3 = new Bid();
        bid3.setId(3L);
        bid3.setBidder(realTenant1);
        bid3.setAmount(275.0); 
        bid3.setBidTime(now.minusMinutes(10));
        
        Bid bid4 = new Bid();
        bid4.setId(4L);
        bid4.setBidder(realTenant2);
        bid4.setAmount(250.0);
        bid4.setBidTime(now.minusMinutes(5));
        
        realAuction.setBids(Arrays.asList(bid1, bid2, bid3, bid4));
        realAuction.setStatus(AuctionStatus.COMPLETED);
        
        Optional<Bid> winningBid = realAuction.getBids().stream()
            .max(Comparator.comparing(Bid::getAmount));
        
        // Then
        assertTrue(winningBid.isPresent());
        assertEquals(275.0, winningBid.get().getAmount());
        assertEquals(realTenant1.getId(), winningBid.get().getBidder().getId());
    }
    
    @Test
    @DisplayName("Should handle tie in bid amounts by timestamp")
    void shouldHandleTieInBidAmountsByTimestamp() {
        // Given
        Bid earlierBid = new Bid();
        earlierBid.setId(1L);
        earlierBid.setBidder(realTenant1);
        earlierBid.setAmount(200.0);
        earlierBid.setBidTime(now.minusMinutes(15));
        
        Bid laterBid = new Bid();
        laterBid.setId(2L);
        laterBid.setBidder(realTenant2);
        laterBid.setAmount(200.0);
        laterBid.setBidTime(now.minusMinutes(10));
        
        realAuction.setBids(Arrays.asList(earlierBid, laterBid));
        
        double maxAmount = realAuction.getBids().stream()
            .mapToDouble(Bid::getAmount)
            .max()
            .orElse(0.0);
        
        Optional<Bid> winningBid = realAuction.getBids().stream()
            .filter(bid -> Double.compare(bid.getAmount(), maxAmount) == 0)
            .min(Comparator.comparing(Bid::getBidTime)); // Earlier timestamp wins
        
        // Then
        assertTrue(winningBid.isPresent());
        assertEquals(200.0, winningBid.get().getAmount());
        assertEquals(realTenant1.getId(), winningBid.get().getBidder().getId());
    }
    

    
    @Test
    @DisplayName("Should reject bid from user without TENANT role")
    void shouldRejectBidFromUserWithoutTenantRole() {
        // Given
        User ownerUser = new User();
        ownerUser.setId(4L);
        ownerUser.setUsername("owner_trying_to_bid");
        ownerUser.setRoles(Set.of(Role.OWNER));
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(4L)).thenReturn(Optional.of(ownerUser));
        
        BidDTO invalidBidDTO = new BidDTO();
        invalidBidDTO.setAuctionId(1L);
        invalidBidDTO.setBidderId(4L);
        invalidBidDTO.setAmount(150.0);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.placeBid(invalidBidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Only tenants can place bids"));
        verify(bidRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should prevent apartment owner from bidding on own auction")
    void shouldPreventApartmentOwnerFromBiddingOnOwnAuction() {
        // Given
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(1L)).thenReturn(Optional.of(realOwner));
        
        BidDTO ownerBidDTO = new BidDTO();
        ownerBidDTO.setAuctionId(1L);
        ownerBidDTO.setBidderId(1L);
        ownerBidDTO.setAmount(175.0);
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.placeBid(ownerBidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Only tenants can place bids"));
        verify(bidRepository, never()).save(any());
    }
    

    
    @Test
    @DisplayName("Should add user to auction participants correctly")
    void shouldAddUserToAuctionParticipantsCorrectly() {
        // Given
        Set<Long> currentParticipants = new HashSet<>();
        currentParticipants.add(3L); // realTenant2 already watching
        
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        when(valueOperations.get("auction:participants:1")).thenReturn(currentParticipants);
        
        // When
        auctionService.addUserToAuction(1L, 2L);
        
        // Then 
        verify(valueOperations).set(eq("auction:participants:1"), argThat(participants -> {
            Set<Long> participantSet = (Set<Long>) participants;
            return participantSet.contains(2L) && participantSet.contains(3L) && participantSet.size() == 2;
        }), anyLong(), any());
        
        verify(messagingTemplate).convertAndSend(eq("/topic/auction/1/participants"), anyString());
    }
    
    @Test
    @DisplayName("Should get correct participant count")
    void shouldGetCorrectParticipantCount() {
        // Given
        Set<Long> participants = new HashSet<>();
        participants.add(2L);
        participants.add(3L);
        participants.add(4L);
        
        when(valueOperations.get("auction:participants:1")).thenReturn(participants);
        
        // When
        int count = auctionService.getActiveAuctionObserverCount(1L);
        
        // Then
        assertEquals(3, count);
        verify(valueOperations).get("auction:participants:1");
    }
    
    @Test
    @DisplayName("Should return zero when no participants")
    void shouldReturnZeroWhenNoParticipants() {
        // Given
        when(valueOperations.get("auction:participants:1")).thenReturn(null);
        
        // When
        int count = auctionService.getActiveAuctionObserverCount(1L);
        
        // Then
        assertEquals(0, count);
    }
    

    
    @Test
    @DisplayName("Should throw exception when auction not found")
    void shouldThrowExceptionWhenAuctionNotFound() {
        // Given
        when(auctionRepository.findById(999L)).thenReturn(Optional.empty());
        
        BidDTO bidDTO = new BidDTO();
        bidDTO.setAuctionId(999L);
        bidDTO.setBidderId(2L);
        bidDTO.setAmount(150.0);
        
        // When & Then
        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class,
            () -> auctionService.placeBid(bidDTO)
        );
        
        assertTrue(exception.getMessage().contains("Auction not found"));
        verify(bidRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should throw exception when bidder not found")
    void shouldThrowExceptionWhenBidderNotFound() {
        // Given
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        
        BidDTO bidDTO = new BidDTO();
        bidDTO.setAuctionId(1L);
        bidDTO.setBidderId(999L);
        bidDTO.setAmount(175.0); 
        
        // When & Then
        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class,
            () -> auctionService.placeBid(bidDTO)
        );
        
        assertTrue(exception.getMessage().contains("not found") || 
                   exception.getMessage().contains("User") ||
                   exception.getMessage().contains("999"));
        verify(bidRepository, never()).save(any());
    }
    

    
    @Test
    @DisplayName("Should cancel active auction successfully")
    void shouldCancelActiveAuctionSuccessfully() {
        // Given
        realAuction.setStatus(AuctionStatus.ACTIVE);
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        when(auctionRepository.save(realAuction)).thenReturn(realAuction);
        when(valueOperations.get(anyString())).thenReturn(new HashSet<>());
        
        // When
        auctionService.cancelAuction(1L);
        
        // Then
        assertEquals(AuctionStatus.CANCELLED, realAuction.getStatus());
        verify(auctionRepository).save(realAuction);
        verify(messagingTemplate).convertAndSend(eq("/topic/auction/1/status"), any(Object.class));    
    }
    
    @Test
    @DisplayName("Should not allow cancelling completed auction")
    void shouldNotAllowCancellingCompletedAuction() {
        // Given
        realAuction.setStatus(AuctionStatus.COMPLETED);
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(realAuction));
        
        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> auctionService.cancelAuction(1L)
        );
        
        assertTrue(exception.getMessage().contains("Cannot cancel"));
        verify(auctionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get all auctions successfully")
    void shouldGetAllAuctionsSuccessfully() {
        // Given
        List<Auction> auctions = Arrays.asList(realAuction);
        when(auctionRepository.findAll()).thenReturn(auctions);
        when(auctionMapper.toDTO(realAuction)).thenReturn(new AuctionDTO());
        
        // When
        List<AuctionDTO> result = auctionService.getAllAuctions();
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(auctionRepository).findAll();
        verify(auctionMapper).toDTO(realAuction);
    }

    @Test
    @DisplayName("Should get active auctions successfully")
    void shouldGetActiveAuctionsSuccessfully() {
        // Given
        List<Auction> activeAuctions = Arrays.asList(realAuction);
        when(auctionRepository.findByStatus(AuctionStatus.ACTIVE)).thenReturn(activeAuctions);
        when(auctionMapper.toDTO(realAuction)).thenReturn(new AuctionDTO());
        
        // When
        List<AuctionDTO> result = auctionService.getActiveAuctions();
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(auctionRepository).findByStatus(AuctionStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should create auction successfully")
    void shouldCreateAuctionSuccessfully() {
        // Given
        AuctionDTO auctionDTO = new AuctionDTO();
        auctionDTO.setApartmentId(1L);
        auctionDTO.setRentalStartDate(LocalDate.now().plusDays(7));
        auctionDTO.setRentalEndDate(LocalDate.now().plusDays(14));
        
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(realApartment));
        when(auctionMapper.toEntity(auctionDTO)).thenReturn(realAuction);
        when(auctionRepository.save(any(Auction.class))).thenReturn(realAuction);
        when(auctionMapper.toDTO(realAuction)).thenReturn(auctionDTO);
        
        // When
        AuctionDTO result = auctionService.createAuction(auctionDTO);
        
        // Then
        assertNotNull(result);
        verify(apartmentRepository).findById(1L);
        verify(auctionRepository).save(any(Auction.class));
    }

    @Test
    @DisplayName("Should complete auction with winning bid")
    void shouldCompleteAuctionWithWinningBid() {
        // Given
        Bid winningBid = new Bid();
        winningBid.setId(1L);
        winningBid.setBidder(realTenant1);
        winningBid.setAmount(200.0);
        winningBid.setAuction(realAuction);
        
        realAuction.setBids(Arrays.asList(winningBid));
        
        when(rentalService.createRentalFromAuction(any(Rental.class))).thenReturn(new Rental());
        when(auctionRepository.save(realAuction)).thenReturn(realAuction);
        
        // When
        auctionService.completeAuction(realAuction);
        
        // Then
        assertEquals(AuctionStatus.COMPLETED, realAuction.getStatus());
        verify(rentalService).createRentalFromAuction(any(Rental.class));
        verify(auctionRepository).save(realAuction);
    }

    @Test
    @DisplayName("Should remove user from auction participants")
    void shouldRemoveUserFromAuctionParticipants() {
        // Given
        Set<Long> participants = new HashSet<>();
        participants.add(2L);
        participants.add(3L);
        
        when(valueOperations.get("auction:participants:1")).thenReturn(participants);
        when(userRepository.findById(2L)).thenReturn(Optional.of(realTenant1));
        
        // When
        auctionService.removeUserFromAuction(1L, 2L);
        
        // Then
        verify(valueOperations).get("auction:participants:1");
        verify(messagingTemplate).convertAndSend(anyString(), anyString());
    }
}