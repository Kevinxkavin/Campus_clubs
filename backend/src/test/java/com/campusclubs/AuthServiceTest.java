package com.campusclubs;

import com.campusclubs.dto.request.AuthRequests.LoginRequest;
import com.campusclubs.dto.request.AuthRequests.RegisterRequest;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.repository.sql.ActivityLogRepository;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.security.JwtUtils;
import com.campusclubs.service.impl.AuthService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService unit tests")
class AuthServiceTest {

    @Mock UserRepository        userRepo;
    @Mock ActivityLogRepository logRepo;
    @Mock PasswordEncoder       encoder;
    @Mock JwtUtils              jwt;
    @Mock AuthenticationManager authManager;

    @InjectMocks AuthService authService;

    @Test
    @DisplayName("register – happy path creates user and returns tokens")
    void register_success() {
        RegisterRequest req = new RegisterRequest(
                "Kavin", "kavin@campus.edu", "secret123",
                "2024CS001", "Computer Science", "2nd Year", "9000000004", "Java, Python", "CS student");

        when(userRepo.existsByEmail("kavin@campus.edu")).thenReturn(false);
        when(userRepo.existsByStudentId("2024CS001")).thenReturn(false);
        when(encoder.encode("secret123")).thenReturn("$hashed$");
        User saved = User.builder().id(1L).email("kavin@campus.edu")
                .name("Kavin").role(User.Role.STUDENT).active(true).build();
        when(userRepo.save(any())).thenReturn(saved);
        when(jwt.generateAccessToken(1L, "kavin@campus.edu", "STUDENT")).thenReturn("access-token");
        when(jwt.generateRefreshToken()).thenReturn("refresh-token");

        Map<String,Object> result = authService.register(req);

        assertEquals("access-token",  result.get("accessToken"));
        assertEquals("refresh-token", result.get("refreshToken"));
        verify(userRepo).save(any(User.class));
    }

    @Test
    @DisplayName("register – duplicate email throws BadRequestException")
    void register_duplicateEmail() {
        RegisterRequest req = new RegisterRequest(
                "Kavin", "kavin@campus.edu", "secret123", null, null, null, null, null, null);
        when(userRepo.existsByEmail("kavin@campus.edu")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("login – bad credentials throws BadRequestException")
    void login_badCredentials() {
        LoginRequest req = new LoginRequest("wrong@campus.edu", "badpass");
        doThrow(new BadCredentialsException("bad"))
                .when(authManager).authenticate(any());
        assertThrows(BadRequestException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("login – inactive user throws BadRequestException")
    void login_inactiveUser() {
        LoginRequest req = new LoginRequest("kavin@campus.edu", "secret123");
        // authManager passes (no exception), but user is inactive
        User inactive = User.builder().id(1L).email("kavin@campus.edu")
                .active(false).role(User.Role.STUDENT).build();
        when(userRepo.findByEmail("kavin@campus.edu")).thenReturn(Optional.of(inactive));
        assertThrows(BadRequestException.class, () -> authService.login(req));
    }
}
