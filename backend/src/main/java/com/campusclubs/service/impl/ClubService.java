package com.campusclubs.service.impl;

import com.campusclubs.dto.request.ClubRequests.*;
import com.campusclubs.entity.nosql.Club;
import com.campusclubs.entity.nosql.Club.*;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.nosql.ClubRepository;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository   clubRepo;
    private final UserRepository   userRepo;
    private final NotificationService notifService;

    // ── Query ──────────────────────────────────────────────────────────────
    public List<Club> getAllActiveClubs()                       { return clubRepo.findByActiveTrue(); }
    public List<Club> getClubsByCategory(String cat)           { return clubRepo.findByCategoryAndActiveTrue(cat); }
    public Club       getById(String id)                       { return find(id); }
    public List<Club> getManagedClubs(Long coordUserId)        { return List.of(clubRepo.findByCoordinator_UserId(coordUserId).orElseThrow(() -> new ResourceNotFoundException("No club managed"))); }
    public List<Club> getClubsForMember(Long userId)           { return clubRepo.findByMemberUserId(userId); }

    // ── Create / Update (Admin only) ───────────────────────────────────────
    @Transactional
    public Club createClub(CreateClubRequest req) {
        Club club = Club.builder()
                .name(req.getName()).description(req.getDescription())
                .category(req.getCategory()).foundedYear(req.getFoundedYear())
                .logoUrl(req.getLogoUrl()).bannerUrl(req.getBannerUrl())
                .socialLinks(req.getSocialLinks()).active(true).build();
        return clubRepo.save(club);
    }

    @Transactional
    public Club updateClub(String clubId, UpdateClubRequest req) {
        Club club = find(clubId);
        if (req.getName()        != null) club.setName(req.getName());
        if (req.getDescription() != null) club.setDescription(req.getDescription());
        if (req.getCategory()    != null) club.setCategory(req.getCategory());
        if (req.getLogoUrl()     != null) club.setLogoUrl(req.getLogoUrl());
        if (req.getBannerUrl()   != null) club.setBannerUrl(req.getBannerUrl());
        if (req.getSocialLinks() != null) club.setSocialLinks(req.getSocialLinks());
        return clubRepo.save(club);
    }

    @Transactional
    public Club updateClub(String clubId, UpdateClubRequest req, Long actorUserId, boolean admin) {
        Club club = find(clubId);
        if (!admin && (club.getCoordinator() == null || !actorUserId.equals(club.getCoordinator().getUserId()))) {
            throw new BadRequestException("Coordinators can update only their assigned club");
        }
        return updateClub(clubId, req);
    }

    @Transactional
    public void deactivateClub(String clubId) {
        Club club = find(clubId);
        club.setActive(false);
        clubRepo.save(club);
    }

    // ── Coordinator / Advisor assignment (Admin) ───────────────────────────
    @Transactional
    public void assignCoordinator(String clubId, Long userId) {
        User user  = findUser(userId);
        Club club  = find(clubId);
        // Remove user from any other club coordinator position
        clubRepo.findByCoordinator_UserId(userId).ifPresent(old -> {
            old.setCoordinator(null); clubRepo.save(old);
        });
        club.setCoordinator(MemberRef.builder()
                .userId(user.getId()).name(user.getName())
                .email(user.getEmail()).studentId(user.getStudentId())
                .phone(user.getPhone()).build());
        clubRepo.save(club);
        user.setRole(User.Role.COORDINATOR);
        user.setManagedClubMongoId(clubId);
        user.setManagedClubName(club.getName());
        userRepo.save(user);
    }

    @Transactional
    public void assignAdvisor(String clubId, Long userId) {
        User user = findUser(userId);
        Club club = find(clubId);
        club.setAdvisor(MemberRef.builder()
                .userId(user.getId()).name(user.getName())
                .email(user.getEmail()).studentId(user.getStudentId())
                .phone(user.getPhone()).build());
        clubRepo.save(club);
        user.setRole(User.Role.ADVISOR);
        userRepo.save(user);
    }

    // ── Membership ─────────────────────────────────────────────────────────
    @Transactional
    public void requestJoin(String clubId, Long userId, JoinClubRequest req) {
        User user = findUser(userId);
        Club club = find(clubId);
        boolean alreadyMember  = club.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId));
        boolean alreadyPending = club.getPendingMembers().stream().anyMatch(m -> m.getUserId().equals(userId));
        if (alreadyMember)  throw new BadRequestException("Already a member");
        if (alreadyPending) throw new BadRequestException("Join request already pending");

        club.getPendingMembers().add(JoinRequest.builder()
                .userId(userId).name(user.getName()).email(user.getEmail())
                .studentId(user.getStudentId()).department(req.getDepartment())
                .year(req.getYear()).phone(req.getPhone()).skills(req.getSkills())
                .whyJoin(req.getWhyJoin()).experience(req.getExperience())
                .requestedAt(Instant.now()).build());
        clubRepo.save(club);
        notifService.create(null, "JOIN_REQUEST",
                "New Join Request",
                user.getName() + " wants to join " + club.getName(),
                clubId, "CLUB");
    }

    @Transactional
    public void approveMember(String clubId, Long userId) {
        User user = findUser(userId);
        Club club = find(clubId);
        JoinRequest jr = club.getPendingMembers().stream()
                .filter(m -> m.getUserId().equals(userId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));
        club.getPendingMembers().remove(jr);
        boolean exists = club.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId));
        if (!exists) club.getMembers().add(MemberRef.builder()
                .userId(userId).name(user.getName()).email(user.getEmail())
                .studentId(user.getStudentId()).phone(user.getPhone()).build());
        clubRepo.save(club);
        notifService.create(userId, "MEMBER_APPROVED",
                "Join Request Approved",
                "You have been approved to join " + club.getName(),
                clubId, "CLUB");
    }

    @Transactional
    public void rejectMember(String clubId, Long userId) {
        Club club = find(clubId);
        club.getPendingMembers().removeIf(m -> m.getUserId().equals(userId));
        clubRepo.save(club);
        notifService.create(userId, "MEMBER_REJECTED",
                "Join Request Rejected",
                "Your request to join " + club.getName() + " was not approved.",
                clubId, "CLUB");
    }

    @Transactional
    public void removeMember(String clubId, Long userId) {
        Club club = find(clubId);
        club.getMembers().removeIf(m -> m.getUserId().equals(userId));
        club.getEventChairs().removeIf(ec -> ec.getUserId().equals(userId));
        clubRepo.save(club);
    }

    @Transactional
    public void leaveClub(String clubId, Long userId) {
        removeMember(clubId, userId);
    }

    // ── Event Chair ────────────────────────────────────────────────────────
    @Transactional
    public void assignEventChair(String clubId, String eventId, Long userId) {
        Club club = find(clubId);
        club.getEventChairs().removeIf(ec -> ec.getEventId().equals(eventId));
        if (userId != 0) {
            User user = findUser(userId);
            club.getEventChairs().add(EventChairAssignment.builder()
                    .userId(userId).name(user.getName())
                    .eventId(eventId).assignedAt(Instant.now()).build());
        }
        clubRepo.save(club);
    }

    // ── helpers ────────────────────────────────────────────────────────────
    private Club find(String id) {
        return clubRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Club not found: " + id));
    }
    private User findUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
