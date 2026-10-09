package com.campusclubs.controller;

import com.campusclubs.dto.request.ClubRequests.*;
import com.campusclubs.dto.request.EventRequests.AssignEventChairRequest;
import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.ClubService;
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
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
@Tag(name = "Clubs", description = "Club discovery, membership, coordinator/advisor management")
public class ClubController {

    private final ClubService    clubService;
    private final UserRepository userRepo;

    // ── Public ─────────────────────────────────────────────────────────────
    @GetMapping
    @Operation(summary = "Get all active clubs (optionally filter by category)")
    public ResponseEntity<ApiResponse<?>> getAll(@RequestParam(required = false) String category) {
        var clubs = category != null ? clubService.getClubsByCategory(category) : clubService.getAllActiveClubs();
        return ResponseEntity.ok(ApiResponse.ok(clubs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get club details by ID")
    public ResponseEntity<ApiResponse<?>> getOne(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(clubService.getById(id)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get clubs the current user is a member of")
    public ResponseEntity<ApiResponse<?>> myClubs(@AuthenticationPrincipal UserDetails ud) {
        Long uid = userId(ud);
        return ResponseEntity.ok(ApiResponse.ok(clubService.getClubsForMember(uid)));
    }

    // ── Join / Leave ───────────────────────────────────────────────────────
    @PostMapping("/{id}/join")
    @Operation(summary = "Submit a join request with student details")
    public ResponseEntity<ApiResponse<?>> join(@PathVariable String id,
                                                @Valid @RequestBody JoinClubRequest req,
                                                @AuthenticationPrincipal UserDetails ud) {
        clubService.requestJoin(id, userId(ud), req);
        return ResponseEntity.ok(ApiResponse.ok("Join request submitted", null));
    }

    @DeleteMapping("/{id}/leave")
    @Operation(summary = "Leave a club")
    public ResponseEntity<ApiResponse<?>> leave(@PathVariable String id,
                                                 @AuthenticationPrincipal UserDetails ud) {
        clubService.leaveClub(id, userId(ud));
        return ResponseEntity.ok(ApiResponse.ok("Left club", null));
    }

    // ── Membership management (Coordinator/Admin) ──────────────────────────
    @PutMapping("/{id}/members/{userId}/approve")
    @Operation(summary = "Approve a pending join request")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<?>> approve(@PathVariable String id,
                                                   @PathVariable Long userId) {
        clubService.approveMember(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Member approved", null));
    }

    @PutMapping("/{id}/members/{userId}/reject")
    @Operation(summary = "Reject a pending join request")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<?>> reject(@PathVariable String id,
                                                  @PathVariable Long userId) {
        clubService.rejectMember(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Request rejected", null));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove a member from the club")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<?>> removeMember(@PathVariable String id,
                                                        @PathVariable Long userId) {
        clubService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Member removed", null));
    }

    // ── Event Chair ────────────────────────────────────────────────────────
    @PutMapping("/{id}/events/{eventId}/chair")
    @Operation(summary = "Assign or remove event chair for an event")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<?>> assignChair(@PathVariable String id,
                                                       @PathVariable String eventId,
                                                       @Valid @RequestBody AssignEventChairRequest req) {
        clubService.assignEventChair(id, eventId, req.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Event chair updated", null));
    }

    // ── Admin-only CRUD ────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new club (Admin only)")
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreateClubRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Club created", clubService.createClub(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Update club details")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody UpdateClubRequest req,
                                                  @AuthenticationPrincipal UserDetails ud) {
        boolean admin = ud.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(ApiResponse.ok("Club updated", clubService.updateClub(id, req, userId(ud), admin)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a club (Admin only)")
    public ResponseEntity<ApiResponse<?>> deactivate(@PathVariable String id) {
        clubService.deactivateClub(id);
        return ResponseEntity.ok(ApiResponse.ok("Club deactivated", null));
    }

    @PutMapping("/{id}/coordinator")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign coordinator to club (Admin only)")
    public ResponseEntity<ApiResponse<?>> assignCoord(@PathVariable String id,
                                                       @Valid @RequestBody AssignRoleRequest req) {
        clubService.assignCoordinator(id, req.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Coordinator assigned", null));
    }

    @PutMapping("/{id}/advisor")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign faculty advisor to club (Admin only)")
    public ResponseEntity<ApiResponse<?>> assignAdvisor(@PathVariable String id,
                                                         @Valid @RequestBody AssignRoleRequest req) {
        clubService.assignAdvisor(id, req.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Advisor assigned", null));
    }

    // ── helper ─────────────────────────────────────────────────────────────
    private Long userId(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
    }
}
