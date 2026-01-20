package pl.ug.NestPoint.dto;

import lombok.Data;

@Data
public class UserSummaryDTO {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
}