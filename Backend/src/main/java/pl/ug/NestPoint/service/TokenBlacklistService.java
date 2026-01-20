package pl.ug.NestPoint.service;

import org.springframework.stereotype.Service;
import pl.ug.NestPoint.security.JwtUtil;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {
    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();
    private final JwtUtil jwtUtil;

    public TokenBlacklistService(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public void blacklistToken(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
    
    // Optional: Method to clean up expired tokens from the blacklist
    public void cleanupExpiredTokens() {
        blacklistedTokens.removeIf(token -> {
            try {
                return jwtUtil.isTokenExpired(token);
            } catch (Exception e) {
                // If token can't be parsed, it's likely invalid
                return true; 
            }
        });
    }
}