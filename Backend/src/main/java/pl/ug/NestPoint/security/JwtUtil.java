package pl.ug.NestPoint.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component // Make JwtUtil a Spring-managed bean
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private final Key key; // Initialize key in constructor
    private final long jwtExpirationInMs = 3600000; // 1 hour

    public JwtUtil() {
        this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256); // Generate key only once
        logger.info("JwtUtil created with key: {}", key);
    }

    public String generateToken(String username, List<String> roles, Long userId) {
        logger.info("Generating token for user: {} with roles: {} and ID: {}", username, roles, userId);
        return Jwts.builder()
            .setSubject(username)
            .claim("roles", roles)
            .claim("userId", userId) // UserID should work now
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationInMs))
            .signWith(key)
            .compact();
    }

    public boolean validateToken(String token) {
        logger.info("Validating token: {}", token);
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token", ex);
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token", ex);
        } catch (MalformedJwtException ex) {
            logger.error("Malformed JWT token", ex);
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature", ex);
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty.", ex);
        }
        return false;
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.getSubject();
    }

    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.get("roles", List.class);
    }
    
    // New method to extract userId from token
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.get("userId", Long.class);
    }

    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            logger.error("Error checking token expiration", e);
            return true; // If there's an error, consider the token expired
        }
    }
}