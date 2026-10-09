package com.campusclubs.controller;

import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.sql.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "View and update your own profile")
public class ProfileController {

    private final UserRepository userRepo;

    @GetMapping
    @Operation(summary = "Get current user's full profile")
    public ResponseEntity<ApiResponse<?>> get(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping
    @Operation(summary = "Update name, bio, department, year, phone, skills, avatarUrl")
    public ResponseEntity<ApiResponse<?>> update(@RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal UserDetails ud) {
        User user = userRepo.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (body.containsKey("name"))       user.setName(body.get("name"));
        if (body.containsKey("bio"))        user.setBio(body.get("bio"));
        if (body.containsKey("department")) user.setDepartment(body.get("department"));
        if (body.containsKey("year"))       user.setYear(body.get("year"));
        if (body.containsKey("phone"))      user.setPhone(body.get("phone"));
        if (body.containsKey("skills"))     user.setSkills(body.get("skills"));
        if (body.containsKey("avatarUrl"))  user.setAvatarUrl(body.get("avatarUrl"));

        return ResponseEntity.ok(ApiResponse.ok("Profile updated", userRepo.save(user)));
    }
}
