package com.campusclubs.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "activity_logs")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String action;   // e.g. LOGIN, JOIN_CLUB, CREATE_EVENT …

    @Column(length = 200)
    private String detail;

    @Column(length = 50)
    private String entityType;  // USER | CLUB | EVENT | POST

    @Column(length = 60)
    private String entityId;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
