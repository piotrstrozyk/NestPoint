package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Auction;
import pl.ug.NestPoint.domain.enums.AuctionStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    
    List<Auction> findByStatus(AuctionStatus status);
    
    @Query("SELECT a FROM Auction a WHERE a.apartment.id = :apartmentId")
    List<Auction> findByApartmentId(@Param("apartmentId") Long apartmentId);
    
    @Query("SELECT a FROM Auction a WHERE a.apartment.owner.id = :ownerId")
    List<Auction> findByOwnerId(@Param("ownerId") Long ownerId);
    
    @Query("SELECT a FROM Auction a WHERE a.status = 'ACTIVE' AND a.endTime < :now")
    List<Auction> findExpiredActiveAuctions(@Param("now") LocalDateTime now);
    
    @Query("SELECT a FROM Auction a WHERE a.status = 'PENDING' AND a.startTime < :now")
    List<Auction> findPendingAuctionsToBeActivated(@Param("now") LocalDateTime now);
    
    @Query("SELECT a FROM Auction a WHERE a.status = 'ACTIVE' AND " +
           "(SELECT COUNT(DISTINCT b.bidder.id) FROM Bid b WHERE b.auction = a) < a.maxBidders")
    List<Auction> findAuctionsWithAvailableBidderSlots();
    
    @Query("SELECT a FROM Auction a JOIN a.bids b WHERE b.bidder.id = :userId")
    List<Auction> findAuctionsByBidder(@Param("userId") Long userId);
}