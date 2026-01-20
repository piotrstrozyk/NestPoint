package pl.ug.NestPoint.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TenantProfileRequest {
    private String phone;
    
}