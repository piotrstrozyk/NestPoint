package pl.ug.NestPoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import pl.ug.NestPoint.domain.User;
import pl.ug.NestPoint.dto.UserDTO;
import pl.ug.NestPoint.mapper.UserMapper;
import pl.ug.NestPoint.service.UserService;
import pl.ug.NestPoint.domain.enums.Role;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDate;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllTenants() {
        List<UserDTO> tenants = userService.findAllTenants().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getTenantById(@PathVariable Long id) {
        User user = userService.findById(id);
        if (!user.isTenant()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userMapper.toDTO(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeTenantRole(@PathVariable Long id) {
        userService.removeRoleFromUser(id, Role.TENANT);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchTenants(
            @RequestParam(required = false) String rentalStatus,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        List<User> tenants;
        if (rentalStatus != null) {
            tenants = userService.findTenantsByRentalStatus(rentalStatus);
        } else if (address != null) {
            tenants = userService.findTenantsByApartmentAddress(address);
        } else if (startDate != null && endDate != null) {
            tenants = userService.findTenantsByRentalDateRange(startDate, endDate);
        } else {
            tenants = userService.findAllTenants();
        }
        
        return ResponseEntity.ok(tenants.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList()));
    }
}