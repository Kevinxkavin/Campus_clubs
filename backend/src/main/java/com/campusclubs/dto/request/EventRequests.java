package com.campusclubs.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class EventRequests {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateEventRequest {
        @NotBlank private String clubId;
        @NotBlank @Size(max=200) private String title;
        @NotBlank private String description;
        @NotBlank private String category;
        @NotBlank private String venue;
        @NotNull  private Instant eventDate;
        private Instant registrationDeadline;
        private int maxParticipants;
        private String posterUrl;
        private String registrationUrl;
        private Long eventChairId;
        private List<FieldDef> registrationFields;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor
        public static class FieldDef {
            private String label;
            private String type;
            private boolean required;
            private List<String> options;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ReviewEventRequest {
        @NotBlank private String status;   // APPROVED | REJECTED
        private String comment;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RegisterForEventRequest {
        private Map<String,String> answers;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class MarkAttendanceRequest {
        @NotNull private Long userId;
        private boolean attended;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AssignEventChairRequest {
        @NotNull private Long userId;   // 0 = remove
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateEventRequest {
        @NotBlank @Size(max=200) private String title;
        @NotBlank private String description;
        @NotBlank private String category;
        @NotBlank private String venue;
        @NotNull  private Instant eventDate;
        private Instant registrationDeadline;
        private int maxParticipants;
        private String posterUrl;
        private String registrationUrl;
        private Long eventChairId;
        private List<CreateEventRequest.FieldDef> registrationFields;
    }
}
