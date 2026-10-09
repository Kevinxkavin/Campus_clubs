package com.campusclubs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

public class AdminRequests {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateUserRequest {
        @NotBlank @Size(min=2, max=120) private String name;
        @Email    @NotBlank             private String email;
        @NotBlank @Size(min=6, max=300) private String password;
        @Size(max=30)                   private String studentId;
        @NotBlank                       private String role;  // STUDENT | COORDINATOR | ADVISOR | ADMIN
        @Size(max=60)                   private String department;
        @Size(max=20)                   private String year;
        @Size(max=20)                   private String phone;
        @Size(max=500)                  private String skills;
        @Size(max=500)                  private String bio;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateUserRoleRequest {
        @NotBlank private String role;
    }
}
