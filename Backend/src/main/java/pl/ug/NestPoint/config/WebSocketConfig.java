package pl.ug.NestPoint.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import pl.ug.NestPoint.security.JwtUtil;
import pl.ug.NestPoint.service.TokenBlacklistService;

import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;


import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setHeartbeatTime(10000);  // Set heartbeat interval to 10 seconds, needed for client-side SockJS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue", "/user")
            .setHeartbeatValue(new long[]{10000, 10000}) // Set server heartbeat to 10 seconds, in order to match client-side SockJS
            .setTaskScheduler(heartbeatScheduler());
        
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
    
    @Bean
    public TaskScheduler heartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        return scheduler;
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setSendTimeLimit(30 * 1000)
                   .setSendBufferSizeLimit(1024 * 1024)
                   .setMessageSizeLimit(256 * 1024);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");
                    log.info("WebSocket CONNECT with auth: {}", authorization != null ? "present" : "missing");
                    
                    if (authorization != null && authorization.startsWith("Bearer ")) {
                        String token = authorization.substring(7);
                        
                        if (!tokenBlacklistService.isBlacklisted(token) && jwtUtil.validateToken(token)) {
                            String username = jwtUtil.getUsernameFromToken(token);
                            Long userId = jwtUtil.getUserIdFromToken(token);
                            
                            log.info("WebSocket authenticated for user: {} (ID: {})", username, userId);
                            
                            // CRITICAL: Save userId in session for message mapping methods
                            accessor.getSessionAttributes().put("userId", userId);
                            
                            List<String> roles = jwtUtil.getRolesFromToken(token);
                            List<SimpleGrantedAuthority> authorities = roles.stream()
                                .map(role -> new SimpleGrantedAuthority(role))
                                .collect(Collectors.toList());
    
                            // CRITICAL FIX: Use userId.toString() as principal name
                            UsernamePasswordAuthenticationToken user = 
                                new UsernamePasswordAuthenticationToken(userId.toString(), null, authorities);
                            
                            accessor.setUser(user);
                            
                            log.info("WebSocket authentication successful - Principal: {}", userId.toString());
                        } else {
                            log.warn("Invalid token in WebSocket connection");
                        }
                    } else {
                        log.warn("No Authorization header in WebSocket connection");
                    }
                }
                return message;
            }
        });
    }
}