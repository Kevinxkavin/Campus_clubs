package com.campusclubs.controller;

import com.campusclubs.dto.request.AdminRequests.*;
import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.service.impl.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "User management, analytics, activity logs, PDF reports")
public class AdminController {

    private final AdminService adminService;

    /* ── Users ────────────────────────────────────────────────────── */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users")
    public ResponseEntity<ApiResponse<?>> allUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAnyRole('COORDINATOR','ADMIN')")
    @Operation(summary = "Create a new user (student or staff)")
    public ResponseEntity<ApiResponse<?>> createUser(
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        boolean admin = ud.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin && !"STUDENT".equalsIgnoreCase(req.getRole())) {
            throw new BadRequestException("Coordinators can create student accounts only");
        }
        return ResponseEntity.ok(ApiResponse.ok("User created", adminService.createUser(req)));
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a user's role")
    public ResponseEntity<ApiResponse<?>> updateRole(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateUserRoleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Role updated", adminService.updateRole(id, req)));
    }

    @PutMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate or deactivate a user account")
    public ResponseEntity<ApiResponse<?>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Status toggled", adminService.toggleStatus(id)));
    }

    /* ── Dashboard & Analytics ────────────────────────────────────── */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Global dashboard statistics")
    public ResponseEntity<ApiResponse<?>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboardStats()));
    }

    @GetMapping("/clubs/{clubId}/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Analytics for a specific club")
    public ResponseEntity<ApiResponse<?>> clubAnalytics(@PathVariable String clubId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getClubAnalytics(clubId)));
    }

    /* ── PDF Report ───────────────────────────────────────────────── */
    @GetMapping("/clubs/{clubId}/report")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download club performance report as PDF")
    public ResponseEntity<byte[]> clubReport(@PathVariable String clubId) throws Exception {
        byte[] pdf = adminService.generateClubPdfReport(clubId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"club-report-" + clubId + ".pdf\"")
                .body(pdf);
    }

    /* ── Activity Logs ────────────────────────────────────────────── */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent activity logs")
    public ResponseEntity<ApiResponse<?>> logs(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getRecentLogs(limit)));
    }
}
