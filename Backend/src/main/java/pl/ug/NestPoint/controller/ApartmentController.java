package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.domain.Apartment;
import pl.ug.NestPoint.domain.enums.AccessibilityType;
import pl.ug.NestPoint.domain.enums.PropertyType;
import pl.ug.NestPoint.dto.ApartmentDTO;
import pl.ug.NestPoint.dto.DateRangeDTO;
import pl.ug.NestPoint.mapper.ApartmentMapper;
import pl.ug.NestPoint.service.ApartmentService;
import pl.ug.NestPoint.service.PhotoService;
import pl.ug.NestPoint.service.GeocodingService;
import pl.ug.NestPoint.domain.Address;
import pl.ug.NestPoint.domain.Photo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/apartments")
@RequiredArgsConstructor
public class ApartmentController {
    private final ApartmentService apartmentService;
    private final ApartmentMapper apartmentMapper;
    private final PhotoService photoService;
    private final GeocodingService geocodingService;

    @GetMapping("/auctions")
    public ResponseEntity<List<ApartmentDTO>> findByAuctionStatus(
            @RequestParam(required = false) Boolean hasActiveAuction,
            @RequestParam(required = false) Boolean hasUpcomingAuction,
            @RequestParam(required = false) Boolean hasCompletedAuction,
            @RequestParam(required = false) Boolean includeAuctionDetails) {
        
        List<ApartmentDTO> apartments = apartmentService.findByAuctionStatus(
                hasActiveAuction, hasUpcomingAuction, hasCompletedAuction, 
                includeAuctionDetails != null ? includeAuctionDetails : false)
                .stream()
                .map(apartment -> apartmentMapper.toDTO(apartment))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(apartments);
    }


    @GetMapping
    public ResponseEntity<List<ApartmentDTO>> getAllApartments() {
        List<ApartmentDTO> apartments = apartmentService.getAllApartments().stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApartmentDTO> getApartmentById(@PathVariable Long id) {
        Apartment apartment = apartmentService.getApartmentById(id);
        if (apartment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(apartmentMapper.toDTO(apartment));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApartmentDTO> createApartment(
            @RequestParam("details") String apartmentDetails,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) throws IOException {
        try {
            // Parse apartment details from JSON string
            ObjectMapper mapper = new ObjectMapper();
            ApartmentDTO apartmentDTO = mapper.readValue(apartmentDetails, ApartmentDTO.class);
    
            // Create apartment first
            Apartment apartment = apartmentService.createApartment(apartmentDTO);
    
            // If photos were provided, upload them to Cloudinary
            if (photos != null && !photos.isEmpty()) {
                for (MultipartFile photo : photos) {
                    photoService.uploadPhotoForApartment(apartment.getId(), photo);
                }
            }
    
            return ResponseEntity.ok(apartmentMapper.toDTO(apartment));
        } catch (Exception e) {
            e.printStackTrace(); // Log the exception
            return ResponseEntity.status(500).body(null); // Return 500 status with no body
        }
    }
    

    @PutMapping("/{id}")
    public ResponseEntity<ApartmentDTO> updateApartment(@PathVariable Long id, @RequestBody ApartmentDTO apartmentDTO) {
        Apartment updatedApartment = apartmentMapper.toEntity(apartmentDTO);
        apartmentService.updateApartment(id, updatedApartment);
        return ResponseEntity.ok(apartmentMapper.toDTO(updatedApartment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApartment(@PathVariable Long id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.noContent().build();
    }

        @GetMapping("/amenities")
    public ResponseEntity<List<ApartmentDTO>> findByAmenities(
            @RequestParam(defaultValue = "false") boolean needsWifi,
            @RequestParam(defaultValue = "false") boolean needsParking,
            @RequestParam(defaultValue = "false") boolean allowsPets,
            @RequestParam(required = false) AccessibilityType kitchenType,
            @RequestParam(defaultValue = "false") boolean needsDisabilityAccess) {
        List<ApartmentDTO> apartments = apartmentService.findByAmenities(
                needsWifi, needsParking, allowsPets, kitchenType, needsDisabilityAccess)
                .stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }

    @GetMapping("/property-type/{type}")
    public ResponseEntity<List<ApartmentDTO>> findByPropertyType(
            @PathVariable PropertyType type) {
        List<ApartmentDTO> apartments = apartmentService.findByPropertyType(type)
                .stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }

    @GetMapping("/accessibility")
    public ResponseEntity<List<ApartmentDTO>> findByAccessibilityFeatures(
            @RequestParam(required = false) AccessibilityType poolAccess,
            @RequestParam(required = false) AccessibilityType yardAccess,
            @RequestParam(defaultValue = "false") boolean disabilityFriendly) {
        List<ApartmentDTO> apartments = apartmentService.findByAccessibilityFeatures(
                poolAccess, yardAccess, disabilityFriendly)
                .stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
    

    // Date-based availability endpoints
    @GetMapping("/available")
    public ResponseEntity<List<ApartmentDTO>> getAvailableApartments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ApartmentDTO> apartments = apartmentService.findAvailableOnDate(date).stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
    
    @GetMapping("/available/range")
    public ResponseEntity<List<ApartmentDTO>> getAvailableApartmentsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ApartmentDTO> apartments = apartmentService.findAvailableBetweenDates(startDate, endDate).stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
    
    @GetMapping("/occupied")
    public ResponseEntity<List<ApartmentDTO>> getOccupiedApartments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ApartmentDTO> apartments = apartmentService.findOccupiedOnDate(date).stream()
                .map(apartmentMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
    
    @GetMapping("/{id}/availability")
    public ResponseEntity<Object> getApartmentAvailability(@PathVariable Long id) {
        List<DateRangeDTO> occupiedRanges = apartmentService.getOccupiedDateRanges(id);
        List<DateRangeDTO> availableRanges = apartmentService.getAvailableDateRanges(id, 12); // Show 12 months ahead
        
        return ResponseEntity.ok(new Object() {
            public List<DateRangeDTO> getOccupiedRanges() { return occupiedRanges; }
            public List<DateRangeDTO> getAvailableRanges() { return availableRanges; }
        });
    }

    @GetMapping("/search")
    public ResponseEntity<List<ApartmentDTO>> searchApartments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableOn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableTo,
            @RequestParam(required = false) String ownerName,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        
        List<ApartmentDTO> apartments;
        
        if (availableOn != null) {
            apartments = apartmentService.findAvailableOnDate(availableOn).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (availableFrom != null && availableTo != null) {
            apartments = apartmentService.findAvailableBetweenDates(availableFrom, availableTo).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (ownerName != null) {
            apartments = apartmentService.findByOwnerName(ownerName).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (address != null) {
            apartments = apartmentService.findByAddressContaining(address).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (size != null) {
            apartments = apartmentService.findBySizeGreaterThan(size).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (minPrice != null && maxPrice != null) {
            apartments = apartmentService.findByRentalPriceBetween(minPrice, maxPrice).stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        } else {
            apartments = apartmentService.getAllApartments().stream()
                    .map(apartmentMapper::toDTO)
                    .collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(apartments);
    }

    @GetMapping("/{id}/calculate-price")
    public ResponseEntity<Map<String, Object>> calculatePrice(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Apartment apartment = apartmentService.getApartmentById(id);
        
        // Calculate nights
        long nights = ChronoUnit.DAYS.between(startDate, endDate);
        if (nights < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "End date must be after or equal to start date"));
        }
        
        // Calculate base price
        double basePrice = apartment.getRentalPrice() * nights;
        
        // Calculate pool fee if applicable
        double poolFee = 0.0;
        if (apartment.getPoolAccess() != null && apartment.getPoolAccess() != AccessibilityType.NONE) {
            poolFee = apartment.getPoolFee();
        }
        
        // Total price includes base price and any fees
        double totalPrice = basePrice + poolFee;
        
        Map<String, Object> result = new HashMap<>();
        result.put("apartmentId", id);
        result.put("title", apartment.getTitle());
        result.put("pricePerNight", apartment.getRentalPrice());
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("nights", nights);
        result.put("basePrice", basePrice);
        result.put("poolFee", poolFee);
        result.put("totalPrice", totalPrice);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/photos")
    public ResponseEntity<List<Map<String, Object>>> getApartmentPhotos(@PathVariable Long id) {
        // Get photos but only return necessary display information (URL and ID)
        List<Map<String, Object>> photoData = photoService.getPhotosForApartment(id)
            .stream()
            .map(photo -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", photo.getId());
                data.put("url", photo.getFilePath());
                return data;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(photoData);
    }
    
    @PostMapping("/{id}/photos")
    public ResponseEntity<Map<String, Object>> addApartmentPhoto(
            @PathVariable Long id,
            @RequestParam("photo") MultipartFile photo) throws IOException {
        Photo savedPhoto = photoService.uploadPhotoForApartment(id, photo);
        
        // Return minimal data needed for the frontend
        Map<String, Object> result = new HashMap<>();
        result.put("id", savedPhoto.getId());
        result.put("url", savedPhoto.getFilePath());
        
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{apartmentId}/photos/{photoId}")
    public ResponseEntity<Void> deleteApartmentPhoto(
            @PathVariable Long apartmentId,
            @PathVariable Long photoId) {
        // First verify the photo belongs to this apartment
        Photo photo = photoService.getPhoto(photoId);
        if (photo.getApartment() == null || !photo.getApartment().getId().equals(apartmentId)) {
            return ResponseEntity.notFound().build();
        }
        
        photoService.deletePhoto(photoId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{id}/photos/paged")
    public ResponseEntity<Map<String, Object>> getApartmentPhotosPaged(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        List<Photo> allPhotos = photoService.getPhotosForApartment(id);
        
        // Manual pagination since we're already fetching all photos
        int start = page * size;
        int end = Math.min(start + size, allPhotos.size());
        
        if (start >= allPhotos.size()) {
            start = 0;
            end = Math.min(size, allPhotos.size());
        }
        
        List<Map<String, Object>> paginatedPhotos = allPhotos.subList(start, end)
            .stream()
            .map(photo -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", photo.getId());
                data.put("url", photo.getFilePath());
                return data;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("photos", paginatedPhotos);
        response.put("currentPage", page);
        response.put("totalItems", allPhotos.size());
        response.put("totalPages", (int) Math.ceil((double) allPhotos.size() / size));
        
        return ResponseEntity.ok(response);
    }

    // For map display coords
    @GetMapping("/map-data")
    public ResponseEntity<List<Map<String, Object>>> getApartmentsForMap() {
        List<Map<String, Object>> mapData = apartmentService.getAllApartments().stream()
            .filter(apartment -> apartment.getAddress() != null 
                && apartment.getAddress().getLatitude() != null 
                && apartment.getAddress().getLongitude() != null)
            .map(apartment -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", apartment.getId());
                data.put("title", apartment.getTitle());
                data.put("price", apartment.getRentalPrice());
                data.put("lat", apartment.getAddress().getLatitude());
                data.put("lng", apartment.getAddress().getLongitude());
                data.put("address", apartment.getAddress().getCity() + ", " + apartment.getAddress().getStreet());
                // Add a thumbnail from photos if available
                if (apartment.getPhotos() != null && !apartment.getPhotos().isEmpty()) {
                    data.put("thumbnail", apartment.getPhotos().get(0).getFilePath());
                }
                return data;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(mapData);
    }
    @GetMapping("/reverse-geocode")
    public ResponseEntity<JsonNode> reverseGeocode(
            @RequestParam("lat") Double lat,
            @RequestParam("lon") Double lon
    ) {
        if (lat == null || lon == null) {
            return ResponseEntity
                    .badRequest()
                    .build();
        }

        // build a minimal Address with just coords
        Address address = new Address();
        address.setLatitude(lat);
        address.setLongitude(lon);

        // call the new method that returns both address + geojson
        ObjectNode result = geocodingService.reverseGeocode(address);
        if (result == null) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }

        // result has two fields: "address" (your populated Address)
        // and "geojson" (the feature geometry)
        return ResponseEntity.ok(result);
    }
}