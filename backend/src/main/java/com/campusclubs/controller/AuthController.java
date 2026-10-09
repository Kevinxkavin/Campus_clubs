package com.campusclubs.controller;

import com.campusclubs.dto.request.AuthRequests.*;
import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.security.JwtUtils;
import com.campusclubs.service.impl.AuthService;
import com.campusclubs.service.impl.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, token refresh, logout, email verification")
public class AuthController {

    private final AuthService               authService;
    private final EmailVerificationService  verificationService;
    private final UserRepository            userRepo;
    private final JwtUtils                  jwtUtils;

    // ── Register ─────────────────────────────────────────────────────────
    @PostMapping("/register")
    @Operation(summary = "Register a new student account — sends verification OTP automatically")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest req) {
        var result = authService.register(req);
        String otp = verificationService.sendVerification(req.getEmail());
        java.util.Map<String, Object> responseData = new java.util.HashMap<>(result);
        responseData.put("otp", otp);
        return ResponseEntity.ok(ApiResponse.ok("Account created. Please verify your email.", responseData));
    }

    // ── Login ─────────────────────────────────────────────────────────────
    @PostMapping("/login")
    @Operation(summary = "Login with email + password — returns JWT pair")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authService.login(req)));
    }

    // ── Refresh ───────────────────────────────────────────────────────────
    @PostMapping("/refresh")
    @Operation(summary = "Obtain a new access token using a refresh token")
    public ResponseEntity<ApiResponse<?>> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", authService.refresh(req)));
    }

    // ── Logout ────────────────────────────────────────────────────────────
    @PostMapping("/logout")
    @Operation(summary = "Invalidate the refresh token")
    public ResponseEntity<ApiResponse<?>> logout(@AuthenticationPrincipal UserDetails userDetails) {
        userRepo.findByEmail(userDetails.getUsername())
                .ifPresent(u -> authService.logout(u.getId()));
        return ResponseEntity.ok(ApiResponse.ok("Logged out", null));
    }

    // ── Me ─────────────────────────────────────────────────────────────────
    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<ApiResponse<?>> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(
                userRepo.findByEmail(userDetails.getUsername()).orElse(null)));
    }

    // ── Send / Resend verification email ──────────────────────────────────
    @PostMapping("/send-verification")
    @Operation(summary = "Send or resend the email verification OTP")
    public ResponseEntity<ApiResponse<?>> sendVerification(@RequestBody Map<String, String> body) {
        String otp = verificationService.sendVerification(body.get("email"));
        return ResponseEntity.ok(ApiResponse.ok("Verification OTP sent", Map.of("otp", otp)));
    }

    // ── Verify email token ─────────────────────────────────────────────────
    @PostMapping("/verify-email")
    @Operation(summary = "Verify email using OTP — returns JWT pair on success")
    public ResponseEntity<ApiResponse<?>> verifyEmail(@RequestBody Map<String, String> body) {
        var result = verificationService.verifyOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully", result));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset OTP")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        String otp = verificationService.sendPasswordResetOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Password reset OTP sent", Map.of("otp", otp)));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<ApiResponse<?>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        verificationService.resetPassword(req.getEmail(), req.getOtp(), req.getNewPassword(), authService);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successful", null));
    }
}
