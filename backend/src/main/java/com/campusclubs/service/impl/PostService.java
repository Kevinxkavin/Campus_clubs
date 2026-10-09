package com.campusclubs.service.impl;

import com.campusclubs.dto.request.PostRequests.CreatePostRequest;
import com.campusclubs.dto.request.PostRequests.UpdatePostRequest;
import com.campusclubs.dto.request.PostRequests.AddCommentRequest;
import com.campusclubs.dto.request.PostRequests.VotePollRequest;
import com.campusclubs.entity.nosql.Post;
import com.campusclubs.entity.nosql.Post.Comment;
import com.campusclubs.entity.nosql.Post.VoteEntry;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.nosql.ClubRepository;
import com.campusclubs.repository.nosql.PostRepository;
import com.campusclubs.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepo;
    private final UserRepository userRepo;
    private final ClubRepository clubRepo;

    // ── Feed / queries ─────────────────────────────────────────────────
    public Page<Post> getFeed(int page, int size) {
        return postRepo.findAllByStatusOrderByCreatedAtDesc("APPROVED", PageRequest.of(page, size))
                .map(this::prepareForResponse);
    }

    public List<Post> getByClub(String clubId) {
        return postRepo.findByClubIdAndStatus(clubId, "APPROVED").stream()
                .map(this::prepareForResponse)
                .toList();
    }

    // ── Create ─────────────────────────────────────────────────────────
    public Post createPost(CreatePostRequest req, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String clubId = null;
        String clubName = null;
        if (req.getClubId() != null && !req.getClubId().isBlank()) {
            var club = clubRepo.findById(req.getClubId())
                    .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
            boolean canPostToClub = user.getRole() == User.Role.ADMIN
                    || (club.getCoordinator() != null && club.getCoordinator().getUserId().equals(userId))
                    || club.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId));
            if (!canPostToClub) {
                throw new BadRequestException("You must be a club member to post to this club");
            }
            clubId = club.getId();
            clubName = club.getName();
        }

        return postRepo.save(Post.builder()
                .type(req.getType())
                .content(req.getContent())
                .achievementTitle(req.getAchievementTitle())
                .pollQuestion(req.getPollQuestion())
                .pollOptions(req.getPollOptions() != null ? req.getPollOptions() : new ArrayList<>())
                .imageUrls(req.getImageUrls() != null ? req.getImageUrls() : new ArrayList<>())
                .clubId(clubId).clubName(clubName)
                .authorId(userId).authorName(user.getName())
                .authorStudentId(user.getStudentId())
                .authorRole(user.getRole().name().toLowerCase())
                .status("APPROVED")
                .createdAt(Instant.now())
                .build());
    }

    // ── Update ─────────────────────────────────────────────────────────
    public Post updatePost(String postId, UpdatePostRequest req, Long userId) {
        Post post = find(postId);
        if (!post.getAuthorId().equals(userId))
            throw new BadRequestException("Not authorised to edit this post");
        post.setContent(req.getContent());
        if (req.getAchievementTitle() != null) post.setAchievementTitle(req.getAchievementTitle());
        return prepareForResponse(postRepo.save(post));
    }

    // ── Delete ─────────────────────────────────────────────────────────
    public void deletePost(String postId, Long userId, String role) {
        Post post = find(postId);
        boolean isAuthor = post.getAuthorId().equals(userId);
        boolean isPriv   = List.of("COORDINATOR", "ADMIN").contains(role.toUpperCase());
        if (!isAuthor && !isPriv) throw new BadRequestException("Not authorised to delete this post");
        postRepo.deleteById(postId);
    }

    // ── Like ───────────────────────────────────────────────────────────
    public Post toggleLike(String postId, Long userId) {
        Post post = find(postId);
        if (post.getLikes().contains(userId)) post.getLikes().remove(userId);
        else post.getLikes().add(userId);
        return prepareForResponse(postRepo.save(post));
    }

    // ── Comment ────────────────────────────────────────────────────────
    // FIX: stores userName so frontend always shows commenter's name
    public Post addComment(String postId, Long userId, AddCommentRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = find(postId);
        post.getComments().add(Comment.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .userName(user.getName())   // ← always stored
                .text(req.getText())
                .createdAt(Instant.now())
                .build());
        return prepareForResponse(postRepo.save(post));
    }

    // ── Poll vote ──────────────────────────────────────────────────────
    // FIX: stores VoteEntry {userId, userName} so creator/admin can see who voted
    public Post votePoll(String postId, VotePollRequest req, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = find(postId);
        if (!"poll".equalsIgnoreCase(post.getType()))
            throw new BadRequestException("This post is not a poll");
        if (req.getOptionIndex() == null || req.getOptionIndex() < 0 || req.getOptionIndex() >= post.getPollOptions().size())
            throw new BadRequestException("Invalid poll option index");

        // Remove existing vote from all options
        post.getPollVotes().values().forEach(entries ->
                entries.removeIf(e -> voteBelongsToUser(e, userId)));

        // Add new vote with name
        String key = req.getOptionIndex().toString();
        post.getPollVotes()
                .computeIfAbsent(key, k -> new ArrayList<>())
                .add(VoteEntry.builder().userId(userId).userName(user.getName()).build());

        return prepareForResponse(postRepo.save(post));
    }

    private Post find(String id) {
        return prepareForResponse(postRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id)));
    }

    private Post prepareForResponse(Post post) {
        Post finalPost = normalizePollVotes(post);
        if (finalPost.getAuthorId() != null) {
            userRepo.findById(finalPost.getAuthorId()).ifPresent(u -> finalPost.setAuthorAvatarUrl(u.getAvatarUrl()));
        }
        finalPost.setLikedBy(finalPost.getLikes().stream()
                .map(id -> Post.LikeRef.builder()
                        .userId(id)
                        .name(userRepo.findById(id).map(User::getName).orElse("User " + id))
                        .build())
                .toList());
        return finalPost;
    }

    private boolean voteBelongsToUser(Object vote, Long userId) {
        if (vote instanceof VoteEntry entry) return entry.getUserId().equals(userId);
        if (vote instanceof Number id) return id.longValue() == userId;
        if (vote instanceof Map<?, ?> map) {
            Object id = map.get("userId");
            if (id instanceof Number n) return n.longValue() == userId;
            return Objects.equals(String.valueOf(id), String.valueOf(userId));
        }
        return Objects.equals(String.valueOf(vote), String.valueOf(userId));
    }

    private Post normalizePollVotes(Post post) {
        if (post.getPollVotes() == null || post.getPollVotes().isEmpty()) return post;

        boolean changed = false;
        Map<String, List<Object>> normalized = new HashMap<>();

        for (Map.Entry<String, List<Object>> option : post.getPollVotes().entrySet()) {
            List<Object> entries = new ArrayList<>();
            for (Object vote : option.getValue()) {
                VoteEntry entry = toVoteEntry(vote);
                entries.add(entry != null ? entry : vote);
                changed = changed || entry != vote;
            }
            normalized.put(option.getKey(), entries);
        }

        if (!changed) return post;
        post.setPollVotes(normalized);
        return postRepo.save(post);
    }

    private VoteEntry toVoteEntry(Object vote) {
        if (vote instanceof VoteEntry entry) return entry;

        Long voterId = null;
        String voterName = null;

        if (vote instanceof Number number) {
            voterId = number.longValue();
        } else if (vote instanceof Map<?, ?> map) {
            Object id = map.get("userId");
            Object name = map.get("userName");
            if (id instanceof Number number) voterId = number.longValue();
            else if (id != null) {
                try { voterId = Long.parseLong(String.valueOf(id)); }
                catch (NumberFormatException ignored) {}
            }
            if (name != null && !String.valueOf(name).isBlank()) voterName = String.valueOf(name);
        } else if (vote != null) {
            try { voterId = Long.parseLong(String.valueOf(vote)); }
            catch (NumberFormatException ignored) {}
        }

        if (voterId == null) return null;
        if (voterName == null || voterName.isBlank()) {
            voterName = userRepo.findById(voterId)
                    .map(User::getName)
                    .orElse("User " + voterId);
        }
        return VoteEntry.builder().userId(voterId).userName(voterName).build();
    }
}
