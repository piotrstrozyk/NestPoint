package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.dto.AuctionDTO;
import pl.ug.NestPoint.dto.BidDTO;
import pl.ug.NestPoint.service.AuctionService;

import java.util.List;

@RestController
@RequestMapping("/auctions")
@RequiredArgsConstructor
public class AuctionController {
    
    private final AuctionService auctionService;
    
    @GetMapping
    public ResponseEntity<List<AuctionDTO>> getAllAuctions() {
        return ResponseEntity.ok(auctionService.getAllAuctions());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AuctionDTO>> getActiveAuctions() {
        return ResponseEntity.ok(auctionService.getActiveAuctions());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AuctionDTO> getAuctionById(@PathVariable Long id) {
        return ResponseEntity.ok(auctionService.getAuctionById(id));
    }
    
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<AuctionDTO>> getAuctionsByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(auctionService.getAuctionsByOwnerId(ownerId));
    }
    
    @GetMapping("/bidder/{bidderId}")
    public ResponseEntity<List<AuctionDTO>> getAuctionsByBidder(@PathVariable Long bidderId) {
        return ResponseEntity.ok(auctionService.getAuctionsByBidder(bidderId));
    }
    
    @PostMapping
    public ResponseEntity<AuctionDTO> createAuction(@RequestBody AuctionDTO auctionDTO) {
        return ResponseEntity.ok(auctionService.createAuction(auctionDTO));
    }
    
    @PostMapping("/bid")
    public ResponseEntity<BidDTO> placeBid(@RequestBody BidDTO bidDTO) {
        return ResponseEntity.ok(auctionService.placeBid(bidDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelAuction(@PathVariable Long id) {
        auctionService.cancelAuction(id);
        return ResponseEntity.noContent().build();
    }
}