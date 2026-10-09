package com.campusclubs.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 120)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(unique = true, length = 30)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.STUDENT;

    @Column(length = 60)
    private String department;

    @Column(length = 20)
    private String year;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String skills;

    @Column(length = 500)
    private String bio;

    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean emailVerified = false;

    /** MongoDB club _id that this user currently manages (coordinator / advisor). */
    @Column(length = 50)
    private String managedClubMongoId;

    @Column(length = 120)
    private String managedClubName;

    /** Refresh-token value (stored hashed in production). */
    @Column(length = 512)
    private String refreshToken;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum Role {
        STUDENT, COORDINATOR, ADVISOR, ADMIN
    }
}
