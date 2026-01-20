package pl.ug.NestPoint.service;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class PaymentSimulationService {
    
    private final Random random = new Random();
    
    public boolean processPayment(String cardNumber) {
        // Validate card number is exactly 10 digits
        if (cardNumber == null || !cardNumber.matches("\\d{10}")) {
            return false;
        }
        
        // 90% chance of success (return false only when random is 0)
        return random.nextInt(10) != 0;
    }
}