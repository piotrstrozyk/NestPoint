package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Bid;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    
    List<Bid> findByAuctionId(Long auctionId);
    
    List<Bid> findByBidderId(Long bidderId);
    
    @Query("SELECT b FROM Bid b WHERE b.auction.id = :auctionId ORDER BY b.amount DESC")
    List<Bid> findHighestBidsByAuctionId(@Param("auctionId") Long auctionId);
    
    @Query("SELECT b FROM Bid b WHERE b.auction.id = :auctionId AND b.bidder.id = :bidderId ORDER BY b.bidTime DESC")
    List<Bid> findByAuctionIdAndBidderId(
            @Param("auctionId") Long auctionId, 
            @Param("bidderId") Long bidderId);
    
    @Query("SELECT MAX(b.amount) FROM Bid b WHERE b.auction.id = :auctionId")
    Optional<Double> findHighestBidAmountByAuctionId(@Param("auctionId") Long auctionId);

    @Query("SELECT b FROM Bid b WHERE b.auction.id = :auctionId AND b.dropped = false AND " +
           "b.amount = (SELECT MAX(b2.amount) FROM Bid b2 WHERE b2.auction.id = :auctionId AND " +
           "b2.bidder.id = b.bidder.id AND b2.dropped = false) " +
           "ORDER BY b.amount ASC")
    List<Object[]> findHighestBidPerBidderForAuction(@Param("auctionId") Long auctionId);
}