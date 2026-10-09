package com.campusclubs.controller;

import com.campusclubs.dto.request.PostRequests.CreatePostRequest;
import com.campusclubs.dto.request.PostRequests.UpdatePostRequest;
import com.campusclubs.dto.request.PostRequests.AddCommentRequest;
import com.campusclubs.dto.request.PostRequests.VotePollRequest;
import com.campusclubs.dto.response.ApiResponse;
import com.campusclubs.entity.sql.User;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.PostService;
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
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "LinkedIn-style feed – updates, achievements, photos, polls")
public class PostController {

    private final PostService    postService;
    private final UserRepository userRepo;

    @GetMapping
    @Operation(summary = "Get paginated feed of all approved posts")
    public ResponseEntity<ApiResponse<?>> feed(@RequestParam(defaultValue="0") int page,
                                                @RequestParam(defaultValue="20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getFeed(page, size)));
    }

    @GetMapping("/club/{clubId}")
    @Operation(summary = "Get all posts for a club")
    public ResponseEntity<ApiResponse<?>> byClub(@PathVariable String clubId) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getByClub(clubId)));
    }

    @PostMapping
    @Operation(summary = "Create a new post")
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreatePostRequest req,
                                                  @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Post created", postService.createPost(req, userId(ud))));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing post (author only)")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @Valid @RequestBody UpdatePostRequest req,
                                                  @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Post updated", postService.updatePost(id, req, userId(ud))));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a post (author, coordinator, or admin)")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id,
                                                  @AuthenticationPrincipal UserDetails ud) {
        User user = getUser(ud);
        postService.deletePost(id, user.getId(), user.getRole().name());
        return ResponseEntity.ok(ApiResponse.ok("Post deleted", null));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Toggle like on a post")
    public ResponseEntity<ApiResponse<?>> like(@PathVariable String id,
                                                @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(postService.toggleLike(id, userId(ud))));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to a post")
    public ResponseEntity<ApiResponse<?>> comment(@PathVariable String id,
                                                   @Valid @RequestBody AddCommentRequest req,
                                                   @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(postService.addComment(id, userId(ud), req)));
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "Vote on a poll")
    public ResponseEntity<ApiResponse<?>> vote(@PathVariable String id,
                                                @Valid @RequestBody VotePollRequest req,
                                                @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(postService.votePoll(id, req, userId(ud))));
    }

    private Long userId(UserDetails ud) { return getUser(ud).getId(); }
    private User getUser(UserDetails ud) {
        return userRepo.findByEmail(ud.getUsername()).orElseThrow();
    }
}
