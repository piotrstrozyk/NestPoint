package pl.ug.NestPoint.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import pl.ug.NestPoint.service.UserService;

@Component
@RequiredArgsConstructor
public class UserBlockingInterceptor implements HandlerInterceptor {
    
    private final UserService userService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        
        // Allow payment endpoints and GET requests
        if ("GET".equals(request.getMethod()) || 
            requestURI.contains("/pay-auction-fine") || 
            requestURI.contains("/auth") ||
            requestURI.contains("/user/profile")) {
            return true;
        }
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            try {
                pl.ug.NestPoint.domain.User user = userService.findByUsername(auth.getName());
                
                if (user.isCurrentlyBlocked()) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(String.format("""
                        {
                            "blocked": true,
                            "message": "Your account is blocked: %s",
                            "blockedAt": "%s",
                            "reason": "%s"
                        }
                        """, 
                        user.getBlockedReason(),
                        user.getBlockedAt(),
                        user.getBlockedReason()
                    ));
                    return false;
                }
            } catch (Exception e) {
                // Continue if user lookup fails
            }
        }
        
        return true;
    }
}