package com.campusclubs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class PostRequests {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreatePostRequest {
        private String clubId;           // optional – validated in service
        @NotBlank private String type;   // text | achievement | photo | poll
        private String content;
        private String achievementTitle;
        private String pollQuestion;
        private List<String> pollOptions;
        private List<String> imageUrls;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AddCommentRequest {
        @NotBlank private String text;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class VotePollRequest {
        @NotNull private Integer optionIndex;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdatePostRequest {
        @NotBlank private String content;
        private String achievementTitle;
    }
}
