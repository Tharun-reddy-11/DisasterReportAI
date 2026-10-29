package com.disasterreportai;

import com.disasterreportai.user.Role;
import com.disasterreportai.user.User;
import com.disasterreportai.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

  @Bean
  CommandLineRunner seedData(UserRepository users) {
    return args -> {
      BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

      // Ensure Government Official Account exists
      if (users.findByEmail("official@disaster.gov.in").isEmpty()) {
        User authority = new User();
        authority.setFullName("Disaster Operations Commander (NDMA / SDMA)");
        authority.setEmail("official@disaster.gov.in");
        authority.setPasswordHash(encoder.encode("Official@2026"));
        authority.setRole(Role.AUTHORITY);
        authority.setPhone("+91-11-26701700");
        users.save(authority);
        System.out.println(">>> Verified Official Account: official@disaster.gov.in");
      }

      // Ensure Citizen Account exists
      if (users.findByEmail("btharunreddy26@gmail.com").isEmpty()) {
        User citizen = new User();
        citizen.setFullName("Tharun Reddy");
        citizen.setEmail("btharunreddy26@gmail.com");
        citizen.setPasswordHash(encoder.encode("Tharun@1126"));
        citizen.setRole(Role.CITIZEN);
        citizen.setPhone("+91-9876543210");
        users.save(citizen);
        System.out.println(">>> Verified Citizen Account: btharunreddy26@gmail.com");
      }
    };
  }
}
