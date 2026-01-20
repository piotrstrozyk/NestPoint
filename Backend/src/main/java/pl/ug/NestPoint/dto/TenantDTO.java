package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class TenantDTO {
    private Long id;
    private String name;
    private String surname;
    private String email;
    private String phone;
}