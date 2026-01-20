package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.ug.NestPoint.domain.Auction;
import pl.ug.NestPoint.dto.AuctionDTO;

@Mapper(componentModel = "spring", uses = {BidMapper.class})
public interface AuctionMapper {
    
    @Mapping(source = "apartment.id", target = "apartmentId")
    @Mapping(source = "apartment.title", target = "apartmentTitle")
    @Mapping(source = "auction", target = "currentHighestBid", qualifiedByName = "currentHighestBid")
    @Mapping(source = "auction", target = "currentBidderCount", qualifiedByName = "currentBidderCount")
    @Mapping(source = "resultingRental.id", target = "resultingRentalId")
    @Mapping(source = "auction", target = "active", qualifiedByName = "isActive")
    AuctionDTO toDTO(Auction auction);
    
    @Mapping(source = "apartmentId", target = "apartment.id")
    @Mapping(target = "bids", ignore = true)
    @Mapping(target = "resultingRental", ignore = true)
    Auction toEntity(AuctionDTO auctionDTO);
    
    @Named("currentHighestBid")
    default double currentHighestBid(Auction auction) {
        return auction.getCurrentHighestBid();
    }
    
    @Named("currentBidderCount")
    default int currentBidderCount(Auction auction) {
        return auction.getCurrentBidderCount();
    }
    
    @Named("isActive")
    default boolean isActive(Auction auction) {
        return auction.isActive();
    }
}