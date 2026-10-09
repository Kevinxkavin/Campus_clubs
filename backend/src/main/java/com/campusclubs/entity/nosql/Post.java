package com.campusclubs.entity.nosql;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Post {

    @Id
    private String id;

    private String type;        // text | achievement | photo | poll
    private String content;
    private String achievementTitle;
    private String pollQuestion;

    @Builder.Default
    private List<String> pollOptions = new ArrayList<>();


    /** optionIndex (String) → list of voters with name for display */
    @Builder.Default
    private Map<String, List<Object>> pollVotes = new HashMap<>();

    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    private String clubId;
    private String clubName;

    private Long   authorId;
    private String authorName;
    private String authorStudentId;
    private String authorRole;

    @Builder.Default
    private List<Long> likes = new ArrayList<>();

    @Transient
    private List<LikeRef> likedBy = new ArrayList<>();

    @Transient
    private String authorAvatarUrl;

    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    private String status = "APPROVED";  // APPROVED | PENDING

    @CreatedDate
    private Instant createdAt;


    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VoteEntry {
        private Long   userId;
        private String userName;
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
