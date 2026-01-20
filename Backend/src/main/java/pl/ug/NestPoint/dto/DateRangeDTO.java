package pl.ug.NestPoint.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DateRangeDTO {
    private LocalDate startDate;
    private LocalDate endDate;
}