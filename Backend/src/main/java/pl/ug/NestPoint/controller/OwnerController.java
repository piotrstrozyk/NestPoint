package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.ug.NestPoint.dto.UserDTO;
import pl.ug.NestPoint.service.UserService;
import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.mapper.UserMapper;
import pl.ug.NestPoint.domain.enums.Role;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/owners")
@RequiredArgsConstructor
public class OwnerController {
    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllOwners() {
        List<UserDTO> owners = userService.findAllOwners().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(owners);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getOwnerById(@PathVariable Long id) {
        User user = userService.findById(id);
        if (!user.isOwner()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userMapper.toDTO(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeOwnerRole(@PathVariable Long id) {
        userService.removeRoleFromUser(id, Role.OWNER);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchOwners(
            @RequestParam(required = false) Boolean hasOccupiedApartments,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String name) {
        
        List<User> owners;
        if (hasOccupiedApartments != null) {
            owners = userService.findOwnersByApartmentOccupied(hasOccupiedApartments);
        } else if (address != null) {
            owners = userService.findOwnersByApartmentAddress(address);
        } else if (minPrice != null && maxPrice != null) {
            owners = userService.findOwnersByApartmentPriceRange(minPrice, maxPrice);
        } else if (name != null) {
            owners = userService.findOwnersByName(name);
        } else {
            owners = userService.findOwnersWithApartments();
        }
        
        return ResponseEntity.ok(owners.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}/fee-percentage")
    public ResponseEntity<List<Object[]>> getOwnerFeePercentage(@PathVariable Long id) {
        List<Object[]> feePercentage = userService.getOwnerFeePercentage(id);
        return ResponseEntity.ok(feePercentage);
    }

    @GetMapping("/fee-percentage-by-address")
    public ResponseEntity<List<Object[]>> getOwnerFeePercentageByAddress(@RequestParam String address) {
        List<Object[]> feePercentage = userService.getOwnerFeePercentageByAddress(address);
        return ResponseEntity.ok(feePercentage);
    }
}