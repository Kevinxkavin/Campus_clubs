package com.campusclubs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.campusclubs.entity.sql.User;
import com.campusclubs.repository.sql.UserRepository;

@SpringBootApplication
@EnableJpaAuditing
public class CampusClubsApplication {
    public static void main(String[] args) {
        SpringApplication.run(CampusClubsApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.findByEmail("admin@campus.edu").isPresent()) {
                userRepository.save(User.builder()
                        .email("admin@campus.edu")
                        .name("System Admin")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(User.Role.ADMIN)
                        .active(true)
                        .emailVerified(true)
                        .build());
                System.out.println("--- Seeded admin@campus.edu ---");
            }

            if (!userRepository.findByEmail("coord@campus.edu").isPresent()) {
                userRepository.save(User.builder()
                        .email("coord@campus.edu")
                        .name("Club Coordinator")
                        .passwordHash(passwordEncoder.encode("coord123"))
                        .role(User.Role.COORDINATOR)
                        .active(true)
                        .emailVerified(true)
                        .build());
                System.out.println("--- Seeded coord@campus.edu ---");
            }

            if (!userRepository.findByEmail("student1@campus.edu").isPresent()) {
                userRepository.save(User.builder()
                        .email("student1@campus.edu")
                        .name("Student One")
                        .passwordHash(passwordEncoder.encode("student123"))
                        .role(User.Role.STUDENT)
                        .active(true)
                        .emailVerified(true)
                        .build());
                System.out.println("--- Seeded student1@campus.edu ---");
            }

            markDemoUserVerified(userRepository, "admin@campus.edu");
            markDemoUserVerified(userRepository, "coord@campus.edu");
            markDemoUserVerified(userRepository, "student1@campus.edu");
        };
    }

    private void markDemoUserVerified(UserRepository userRepository, String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                userRepository.save(user);
            }
        });
    }
}
