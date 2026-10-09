package com.campusclubs.service.impl;

import com.campusclubs.dto.request.AuthRequests.*;
import com.campusclubs.entity.sql.ActivityLog;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.sql.ActivityLogRepository;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> DEMO_EMAILS = Set.of(
            "admin@campus.edu",
            "coord@campus.edu",
            "student1@campus.edu"
    );

    private final UserRepository        userRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder       encoder;
    private final JwtUtils              jwt;
    private final AuthenticationManager authManager;

    @Transactional
    public Map<String,Object> register(RegisterRequest req) {
        String password = decodeClientSecret(req.getPassword());
        validatePassword(password);
        var existing = userRepo.findByEmail(req.getEmail());
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.isEmailVerified()) {
                throw new BadRequestException("Email already registered");
            }
            user.setPasswordHash(encoder.encode(password));
            userRepo.save(user);
            return Map.of(
                    "verificationPending", true,
                    "user", userToMap(user)
            );
        }
        if (req.getStudentId() != null && !req.getStudentId().isBlank()
                && userRepo.existsByStudentId(req.getStudentId()))
            throw new BadRequestException("Student ID already in use");

        User user = User.builder()
                .name(req.getName()).email(req.getEmail())
                .passwordHash(encoder.encode(password))
                .studentId(req.getStudentId()).role(User.Role.STUDENT)
                .department(req.getDepartment()).year(req.getYear())
                .phone(req.getPhone()).skills(req.getSkills()).bio(req.getBio())
                .active(true).build();

        user = userRepo.save(user);
        logAction(user.getId(), "REGISTER", "New student registered", "USER", user.getId().toString());

        return Map.of(
                "verificationPending", true,
                "user", userToMap(user)
        );
    }

    @Transactional
    public Map<String,Object> login(LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getEmail(), decodeClientSecret(req.getPassword())));
        } catch (LockedException e) {
            throw new BadRequestException("Account is inactive or locked");
        } catch (BadCredentialsException | DisabledException e) {
            throw new BadRequestException("Invalid credentials or account inactive");
        }

        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.isActive()) throw new BadRequestException("Account is inactive");
        if (!user.isEmailVerified() && !isDemoUser(user)) {
            throw new BadRequestException("Please verify your email before signing in");
        }

        logAction(user.getId(), "LOGIN", "User logged in", "USER", user.getId().toString());
        return buildTokenMap(user);
    }

    @Transactional
    public Map<String,Object> refresh(RefreshRequest req) {
        User user = userRepo.findAll().stream()
                .filter(u -> req.getRefreshToken().equals(u.getRefreshToken()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Invalid or expired refresh token"));
        return buildTokenMap(user);
    }

    @Transactional
    public void logout(Long userId) {
        userRepo.findById(userId).ifPresent(u -> { u.setRefreshToken(null); userRepo.save(u); });
        logAction(userId, "LOGOUT", "User logged out", "USER", userId.toString());
    }

    private Map<String,Object> buildTokenMap(User user) {
        String access  = jwt.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refresh = jwt.generateRefreshToken();
        user.setRefreshToken(refresh);
        userRepo.save(user);
        return Map.of(
                "accessToken",  access,
                "refreshToken", refresh,
                "tokenType",    "Bearer",
                "user",         userToMap(user)
        );
    }

    private Map<String,Object> userToMap(User u) {
        return Map.ofEntries(
                Map.entry("id", u.getId()),
                Map.entry("name", u.getName()),
                Map.entry("email", u.getEmail()),
                Map.entry("studentId", u.getStudentId() != null ? u.getStudentId() : ""),
                Map.entry("role", u.getRole().name().toLowerCase()),
                Map.entry("department", u.getDepartment() != null ? u.getDepartment() : ""),
                Map.entry("year", u.getYear() != null ? u.getYear() : ""),
                Map.entry("active", u.isActive()),
                Map.entry("emailVerified", u.isEmailVerified()),
                Map.entry("managedClubMongoId", u.getManagedClubMongoId() != null ? u.getManagedClubMongoId() : ""),
                Map.entry("managedClubName", u.getManagedClubName() != null ? u.getManagedClubName() : "")
        );
    }

    private void logAction(Long userId, String action, String detail, String entityType, String entityId) {
        logRepo.save(ActivityLog.builder()
                .userId(userId).action(action).detail(detail)
                .entityType(entityType).entityId(entityId).build());
    }

    private boolean isDemoUser(User user) {
        return DEMO_EMAILS.contains(user.getEmail().toLowerCase());
    }

    public String decodeClientSecret(String value) {
        if (value == null || !value.startsWith("cc1:")) return value;
        try {
            return new String(Base64.getDecoder().decode(value.substring(4)), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid encrypted password payload");
        }
    }

    public void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        long letters = password.chars().filter(Character::isLetter).count();
        long digits  = password.chars().filter(Character::isDigit).count();
        if (letters < 2 || digits < 2) {
            throw new BadRequestException("Password must contain at least 2 alphabets and 2 numbers");
        }
    }
}