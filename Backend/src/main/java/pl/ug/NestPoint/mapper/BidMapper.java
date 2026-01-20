package pl.ug.NestPoint.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.ug.NestPoint.domain.Bid;
import pl.ug.NestPoint.dto.BidDTO;

@Mapper(componentModel = "spring")
public interface BidMapper {
    
    @Mapping(source = "auction.id", target = "auctionId")
    @Mapping(source = "bidder.id", target = "bidderId")
    @Mapping(source = "bidder.username", target = "bidderUsername")
    BidDTO toDTO(Bid bid);
    
    @Mapping(source = "auctionId", target = "auction.id")
    @Mapping(source = "bidderId", target = "bidder.id")
    Bid toEntity(BidDTO bidDTO);
}