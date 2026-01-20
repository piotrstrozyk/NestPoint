package pl.ug.NestPoint.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;  
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.Set;

@Configuration
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // “redis” is the service name in docker-compose NETWORK - if locally running Redis, use "localhost"
        LettuceConnectionFactory factory = new LettuceConnectionFactory("redis", 6379);
        return factory;
    }
    
    @Bean
    public RedisTemplate<String, Set<Long>> participantsRedisTemplate() {

        // Create a new RedisTemplate instance
        RedisTemplate<String, Set<Long>> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory());
        // Set the key and value serializers in order to serialize the keys and values of the RedisTemplate
        // to JSON format using the GenericJackson2JsonRedisSerializer
        // and the StringRedisSerializer for the keys
        template.setKeySerializer(new StringRedisSerializer());
        
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }
}