package pl.ug.NestPoint;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class NestPointApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(NestPointApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

    }
}