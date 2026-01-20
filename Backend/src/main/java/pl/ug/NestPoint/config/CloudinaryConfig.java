package pl.ug.NestPoint.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", "datvh8iik", // DONT LEAK
            "api_key", "166286623842281",       // DONT LEAK
            "api_secret", "HNbKB-4ozeMEhTtNO4jOwagFYBA"  // DONT LEAK
        ));
    }
}