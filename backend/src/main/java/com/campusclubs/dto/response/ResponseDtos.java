package com.campusclubs.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/* ── Auth ──────────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class AuthResponse {
    private String  accessToken;
    private String  refreshToken;
    private String  tokenType = "Bearer";
    private UserResponse user;
}

/* ── User ──────────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class UserResponse {
    private Long    id;
    private String  name;
    private String  email;
    private String  studentId;
    private String  role;
    private String  department;
    private String  year;
    private String  phone;
    private String  skills;
    private String  bio;
    private String  avatarUrl;
    private boolean active;
    private String  managedClubMongoId;
    private String  managedClubName;
    private Instant createdAt;
}

/* ── Club ──────────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ClubResponse {
    private String  id;
    private String  name;
    private String  category;
    private int     foundedYear;
    private String  description;
    private String  logoUrl;
    private String  bannerUrl;
    private boolean active;
    private MemberRefDto coordinator;
    private MemberRefDto advisor;
    private List<MemberRefDto>  members;
    private List<JoinRequestDto> pendingMembers;
    private Map<String,String>  socialLinks;
    private Instant createdAt;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class MemberRefDto {
    private Long   userId;
    private String name;
    private String email;
    private String studentId;
    private String phone;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class JoinRequestDto {
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

/* ── Event ─────────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class EventResponse {
    private String  id;
    private String  title;
    private String  description;
    private String  category;
    private String  venue;
    private Instant eventDate;
    private Instant registrationDeadline;
    private int     maxParticipants;
    private String  posterUrl;
    private String  registrationUrl;
    private Object  club;
    private Object  createdBy;
    private String  status;
    private String  coordinatorComment;
    private int     registrationCount;
    private boolean registeredByMe;
    private Instant createdAt;
}

/* ── Post ──────────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class PostResponse {
    private String id;
    private String type;
    private String content;
    private String achievementTitle;
    private String pollQuestion;
    private List<String> pollOptions;
    private Map<String,List<Long>> pollVotes;
    private List<String> imageUrls;
    private String clubId;
    private String clubName;
    private Long   authorId;
    private String authorName;
    private String authorStudentId;
    private String authorRole;
    private List<Long> likes;
    private int    commentCount;
    private Instant createdAt;
}

/* ── Notification ──────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class NotificationResponse {
    private String  id;
    private String  type;
    private String  title;
    private String  message;
    private String  entityId;
    private String  entityType;
    private boolean read;
    private Instant createdAt;
}

/* ── Analytics ─────────────────────────────────────────────────────────── */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ClubAnalyticsResponse {
    private String clubId;
    private String clubName;
    private int    memberCount;
    private int    totalEvents;
    private int    approvedEvents;
    private int    totalRegistrations;
    private int    totalPosts;
    private int    totalLikes;
}
