package com.campusclubs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class ClubRequests {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateClubRequest {
        @NotBlank @Size(max=120) private String name;
        @NotBlank                private String description;
        @NotBlank                private String category;
        private int foundedYear;
        private String logoUrl;
        private String bannerUrl;
        private Map<String,String> socialLinks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateClubRequest {
        @Size(max=120) private String name;
        private String description;
        private String category;
        private String logoUrl;
        private String bannerUrl;
        private Map<String,String> socialLinks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class JoinClubRequest {
        private String department;
        private String year;
        private String phone;
        private String skills;
        private String whyJoin;
        private String experience;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AssignRoleRequest {
        @NotNull private Long userId;
    }
}

