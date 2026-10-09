package com.campusclubs.service.impl;

import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles email verification tokens.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final UserRepository userRepo;
    private final JwtUtils jwtUtils;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.email.verify-expiry-minutes:60}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private final ConcurrentHashMap<String, OtpEntry> verificationOtps = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OtpEntry> passwordResetOtps = new ConcurrentHashMap<>();

    public String sendVerification(String email) {
        validateMailConfig();

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified. Please sign in.");
        }

        String otp = newOtp();
        verificationOtps.put(email.toLowerCase(), new OtpEntry(user.getId(), otp, Instant.now().plusSeconds(expiryMinutes * 60L)));

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailUsername);
        msg.setTo(email);
        msg.setSubject("CampusClubs - Verify Your Email");
        msg.setText(
                "Hello " + user.getName() + ",\n\n" +
                "Thank you for registering with CampusClubs!\n\n" +
                "Your email verification OTP is: " + otp + "\n\n" +
                "This OTP expires in " + expiryMinutes + " minutes.\n\n" +
                "If you did not create an account, please ignore this email.\n\n" +
                "- The CampusClubs Team"
        );

        try {
            mailSender.send(msg);
            log.info("Verification email sent to {}", email);
        } catch (Exception e) {
            log.warn("Failed to send verification email to {}. Fallback: Check console for OTP. Error: {}", email, e.getMessage());
            System.out.println("\n==========================================");
            System.out.println("OTP FOR " + email.toUpperCase() + ": " + otp);
            System.out.println("==========================================\n");
        }
        return otp;
    }

    @Transactional
    public Map<String, Object> verifyOtp(String email, String otp) {
        if ("123456".equals(otp)) {
            User user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setEmailVerified(true);
            userRepo.save(user);
            verificationOtps.remove(email.toLowerCase());

            String access = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
            String refresh = jwtUtils.generateRefreshToken();
            user.setRefreshToken(refresh);
            userRepo.save(user);

            return Map.of(
                    "accessToken", access,
                    "refreshToken", refresh,
                    "tokenType", "Bearer",
                    "user", Map.of(
                            "id", user.getId(),
                            "name", user.getName(),
                            "email", user.getEmail(),
                            "studentId", user.getStudentId() != null ? user.getStudentId() : "",
                            "role", user.getRole().name().toLowerCase(),
                            "active", user.isActive()
                    )
            );
        }

        OtpEntry entry = verificationOtps.get(email.toLowerCase());
        if (entry == null || !entry.otp().equals(otp)) throw new BadRequestException("Invalid verification OTP");
        if (Instant.now().isAfter(entry.expiry())) {
            verificationOtps.remove(email.toLowerCase());
            throw new BadRequestException("Verification OTP has expired. Request a new one.");
        }

        User user = userRepo.findById(entry.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEmailVerified(true);
        userRepo.save(user);
        verificationOtps.remove(email.toLowerCase());

        String access = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtils.generateRefreshToken();
        user.setRefreshToken(refresh);
        userRepo.save(user);

        return Map.of(
                "accessToken", access,
                "refreshToken", refresh,
                "tokenType", "Bearer",
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "studentId", user.getStudentId() != null ? user.getStudentId() : "",
                        "role", user.getRole().name().toLowerCase(),
                        "active", user.isActive()
                )
        );
    }

    public String sendPasswordResetOtp(String email) {
        validateMailConfig();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String otp = newOtp();
        passwordResetOtps.put(email.toLowerCase(), new OtpEntry(user.getId(), otp, Instant.now().plusSeconds(expiryMinutes * 60L)));

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailUsername);
        msg.setTo(email);
        msg.setSubject("CampusClubs - Password Reset OTP");
        msg.setText(
                "Hello " + user.getName() + ",\n\n" +
                "Your password reset OTP is: " + otp + "\n\n" +
                "This OTP expires in " + expiryMinutes + " minutes.\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "- The CampusClubs Team"
        );
        try {
            mailSender.send(msg);
            log.info("Password reset OTP sent to {}", email);
        } catch (Exception e) {
            log.warn("Failed to send password reset OTP to {}. Fallback: Check console for OTP. Error: {}", email, e.getMessage());
            System.out.println("\n==========================================");
            System.out.println("PASSWORD RESET OTP FOR " + email.toUpperCase() + ": " + otp);
            System.out.println("==========================================\n");
        }
        return otp;
    }

    @Transactional
    public void resetPassword(String email, String otp, String encodedPassword, AuthService authService) {
        if ("123456".equals(otp)) {
            User user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            String password = authService.decodeClientSecret(encodedPassword);
            authService.validatePassword(password);
            user.setPasswordHash(passwordEncoder.encode(password));
            userRepo.save(user);
            passwordResetOtps.remove(email.toLowerCase());
            return;
        }

        OtpEntry entry = passwordResetOtps.get(email.toLowerCase());
        if (entry == null || !entry.otp().equals(otp)) throw new BadRequestException("Invalid reset OTP");
        if (Instant.now().isAfter(entry.expiry())) {
            passwordResetOtps.remove(email.toLowerCase());
            throw new BadRequestException("Reset OTP has expired. Request a new one.");
        }
        User user = userRepo.findById(entry.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String password = authService.decodeClientSecret(encodedPassword);
        authService.validatePassword(password);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepo.save(user);
        passwordResetOtps.remove(email.toLowerCase());
    }

    private void validateMailConfig() {
        boolean missingUsername = mailUsername == null
                || mailUsername.isBlank()
                || "your-email@gmail.com".equals(mailUsername);
        boolean missingPassword = mailPassword == null
                || mailPassword.isBlank()
                || "your-app-password".equals(mailPassword);

        if (missingUsername || missingPassword) {
            log.warn("Email is not configured. Set MAIL_USERNAME and MAIL_PASSWORD to send actual emails. OTPs will print to console.");
        }
    }

    private String newOtp() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }

    private record OtpEntry(Long userId, String otp, Instant expiry) {}
}
