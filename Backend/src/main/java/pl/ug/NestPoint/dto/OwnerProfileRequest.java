package pl.ug.NestPoint.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OwnerProfileRequest {
    @Pattern(regexp = "^[0-9]{3}-[0-9]{3}-[0-9]{4}$", message = "Invalid phone number format")
    private String phone;
    
    private String email;
}