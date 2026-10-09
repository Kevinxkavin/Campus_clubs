package com.campusclubs.entity.nosql;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "clubs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Club {

    @Id
    private String id;

    private String name;
    private String category;     // Technical | Cultural | Sports | …
    private int    foundedYear;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private boolean active = true;

    /** Summary snapshot of coordinator (SQL id + display name). */
    private MemberRef coordinator;
    private MemberRef advisor;

    @Builder.Default
    private List<MemberRef> members = new ArrayList<>();

    @Builder.Default
    private List<JoinRequest> pendingMembers = new ArrayList<>();

    /** Mapping eventId → assigned event-chair userId */
    @Builder.Default
    private List<EventChairAssignment> eventChairs = new ArrayList<>();

    private Map<String, String> socialLinks;  // github, instagram, …

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    // ── embedded types ────────────────────────────────────────────
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MemberRef {
        private Long   userId;
        private String name;
        private String email;
        private String studentId;
        private String phone;
        private String avatarUrl;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JoinRequest {
        private Long   userId;
        private String name;
        private String email;
        private String studentId;
        private String department;
        private String year;
        private String phone;
        private String skills;
        private String whyJoin;
        private String experience;
        private Instant requestedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EventChairAssignment {
        private Long   userId;
        private String name;
        private String eventId;
        private Instant assignedAt;
    }
}
