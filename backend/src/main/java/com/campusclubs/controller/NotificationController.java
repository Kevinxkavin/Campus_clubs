package com.campusclubs.controller;

import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Real-time notification fetching, read status, announcements")
public class NotificationController {

    private final NotificationService notifService;
    private final UserRepository      userRepo;

    @GetMapping
    @Operation(summary = "Get paginated notifications for current user")
    public ResponseEntity<ApiResponse<?>> get(@RequestParam(defaultValue="0") int page,
                                               @RequestParam(defaultValue="20") int size,
                                               @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(notifService.getForUser(userId(ud), page, size)));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get all unread notifications")
    public ResponseEntity<ApiResponse<?>> unread(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(notifService.getUnread(userId(ud))));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<?>> unreadCount(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", notifService.countUnread(userId(ud)))));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<?>> markRead(@PathVariable String id,
                                                    @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(notifService.markRead(id, userId(ud))));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<?>> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        notifService.markAllRead(userId(ud));
        return ResponseEntity.ok(ApiResponse.ok("All marked as read", null));
    }

    @PostMapping("/announcement")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Push a broadcast announcement to all users (Admin only)")
    public ResponseEntity<ApiResponse<?>> announce(@RequestBody Map<String,String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Announcement sent",
                notifService.createAnnouncement(body.get("title"), body.get("message"))));
    }

    private Long userId(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername()).orElseThrow().getId();
    }
}
