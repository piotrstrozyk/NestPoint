package pl.ug.NestPoint.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
 import pl.ug.NestPoint.service.TokenBlacklistService;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtUtil jwtUtil;

    private final TokenBlacklistService tokenBlacklistService;
    
    // Constructor injection for JwtUtil and TokenBlacklistService
    // This allows us to use these services in the filter
    @Autowired
    public JwtAuthenticationFilter(JwtUtil jwtUtil, TokenBlacklistService tokenBlacklistService) {
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
    }
    
    // This method is called for every request to check if the user is authenticated
    // It extracts the JWT token from the Authorization header, validates it, and sets the authentication in the SecurityContext
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
                                    throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        logger.info("Authorization header: {}", header);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            logger.info("Extracted token: {}", token);
            
            // Check if token is blacklisted
            if (tokenBlacklistService.isBlacklisted(token)) {
                logger.warn("Attempt to use blacklisted token");
                filterChain.doFilter(request, response);
                return;
            }
            
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                List<String> roles = jwtUtil.getRolesFromToken(token);
                logger.info("User: {} Roles: {}", username, roles);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    roles.stream().map(SimpleGrantedAuthority::new).toList()
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}