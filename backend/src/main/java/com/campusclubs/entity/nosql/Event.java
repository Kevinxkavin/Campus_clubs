package com.campusclubs.entity.nosql;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    private String id;

    private String title;
    private String description;
    private String category;      // Hackathon | Workshop | …
    private String venue;
    private Instant eventDate;
    private Instant registrationDeadline;
    private int     maxParticipants;
    private String  posterUrl;
    private String  registrationUrl;

    private ClubRef  club;
    private AuthorRef createdBy;

    private String status = "PENDING";  // PENDING | APPROVED | REJECTED
    private String coordinatorComment;
    private Instant reviewedAt;

    @Builder.Default
    private List<RegistrationField> registrationFields = new ArrayList<>();

    @Builder.Default
    private List<Registration> registrations = new ArrayList<>();

    @Builder.Default
    private List<Long>    likes = new ArrayList<>();

    @Transient
    private List<LikeRef> likedBy = new ArrayList<>();

    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    // ── embedded ───────────────────────────────────────────────────
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ClubRef {
        private String clubId;
        private String name;
        private String category;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthorRef {
        private Long   userId;
        private String name;
        private String studentId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegistrationField {
        private String label;
        private String type;      // text | textarea | select
        private boolean required;
        private List<String> options;  // for select
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Registration {
        private String id;
        private Long   userId;
        private String userName;
        private String studentId;
        private Instant registeredAt;
        private Map<String, String> answers;
        private boolean attended = false;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LikeRef {
        private Long   userId;
        private String name;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Comment {
        private String id;
        private Long   userId;
        private String userName;
        private String text;
        private Instant createdAt;
    }
}
