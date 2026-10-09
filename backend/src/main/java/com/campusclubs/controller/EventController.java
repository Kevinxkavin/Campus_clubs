package com.campusclubs.controller;

import com.campusclubs.dto.request.EventRequests.*;
import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.entity.sql.User;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event lifecycle — create, approve, register, attend")
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepo;

    @GetMapping("/approved")
    @Operation(summary = "Get all approved events (paginated, public)")
    public ResponseEntity<ApiResponse<?>> approved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getApproved(page, size)));
    }

    @GetMapping("/club/{clubId}")
    @Operation(summary = "Get all events for a specific club")
    public ResponseEntity<ApiResponse<?>> byClub(@PathVariable String clubId) {
        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getByClub(clubId)));
    }

    @GetMapping("/club/{clubId}/pending")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Get pending events awaiting approval")
    public ResponseEntity<ApiResponse<?>> pending(@PathVariable String clubId) {
        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getPendingForClub(clubId)));
    }

    @GetMapping("/mine")
    @Operation(summary = "Get events created by the current user")
    public ResponseEntity<ApiResponse<?>> mine(
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getMyEvents(userId(ud))));
    }

    @GetMapping("/registered")
    @Operation(summary = "Get events the current user is registered for")
    public ResponseEntity<ApiResponse<?>> registered(
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getMyRegistrations(userId(ud))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single event by ID")
    public ResponseEntity<ApiResponse<?>> one(@PathVariable String id) {
        return ResponseEntity.ok(
                ApiResponse.ok(eventService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create and submit event for approval")
    public ResponseEntity<ApiResponse<?>> create(
            @Valid @RequestBody CreateEventRequest req,
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Event submitted",
                        eventService.createEvent(req, userId(ud))));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update event details")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest req,
            @AuthenticationPrincipal UserDetails ud) {

        User user = getUser(ud);

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Event updated",
                        eventService.updateEvent(
                                id,
                                req,
                                user.getId(),
                                user.getRole().name())));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Approve or reject an event (Coordinator/Admin)")
    public ResponseEntity<ApiResponse<?>> review(
            @PathVariable String id,
            @Valid @RequestBody ReviewEventRequest req,
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Event reviewed",
                        eventService.reviewEvent(id, req, userId(ud))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Delete an event (Coordinator/Admin)")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {

        eventService.deleteEvent(id);

        return ResponseEntity.ok(
                ApiResponse.ok("Event deleted", null));
    }

    @PostMapping("/{id}/register")
    @Operation(summary = "Register current user for an event")
    public ResponseEntity<ApiResponse<?>> register(
            @PathVariable String id,
            @RequestBody(required = false) RegisterForEventRequest req,
            @AuthenticationPrincipal UserDetails ud) {

        if (req == null) {
            req = new RegisterForEventRequest();
        }

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Registered",
                        eventService.register(id, userId(ud), req)));
    }

    @DeleteMapping("/{id}/register")
    @Operation(summary = "Cancel registration for an event")
    public ResponseEntity<ApiResponse<?>> unregister(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Unregistered",
                        eventService.unregister(id, userId(ud))));
    }

    @PutMapping("/{id}/attendance")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Mark/unmark attendance for a participant")
    public ResponseEntity<ApiResponse<?>> attendance(
            @PathVariable String id,
            @Valid @RequestBody MarkAttendanceRequest req) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Attendance updated",
                        eventService.markAttendance(id, req)));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Toggle like on an event")
    public ResponseEntity<ApiResponse<?>> like(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        eventService.toggleLike(id, userId(ud))));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to an event")
    public ResponseEntity<ApiResponse<?>> comment(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {

        return ResponseEntity.ok(
                ApiResponse.ok(
                        eventService.addComment(
                                id,
                                userId(ud),
                                body.get("text"))));
    }

    private Long userId(UserDetails ud) {
        return getUser(ud).getId();
    }

    private User getUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}