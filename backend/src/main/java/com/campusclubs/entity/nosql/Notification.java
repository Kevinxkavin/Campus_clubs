package com.campusclubs.entity.nosql;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    private String id;

    /** null = broadcast to all */
    private Long recipientUserId;

    private String type;    // JOIN_REQUEST | EVENT_APPROVED | POST_LIKED | ANNOUNCEMENT | …
    private String title;
    private String message;
    private String entityId;    // clubId / eventId / postId
    private String entityType;  // CLUB | EVENT | POST

    private boolean read = false;

    @CreatedDate
    private Instant createdAt;
}
