package com.campusclubs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

public class AuthRequests {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @Email   @NotBlank private String email;
        @NotBlank            private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank @Size(min=2, max=120)  private String name;
        @Email    @NotBlank              private String email;
        @NotBlank @Size(min=6, max=300)  private String password;
        @Size(max=30)                    private String studentId;
        @Size(max=60)                    private String department;
        @Size(max=20)                    private String year;
        @Size(max=20)                    private String phone;
        @Size(max=500)                   private String skills;
        @Size(max=500)                   private String bio;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RefreshRequest {
        @NotBlank private String refreshToken;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @Email @NotBlank private String email;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ResetPasswordRequest {
        @Email @NotBlank private String email;
        @NotBlank @Size(min=6, max=20) private String otp;
        @NotBlank @Size(min=6, max=300) private String newPassword;
    }
}
