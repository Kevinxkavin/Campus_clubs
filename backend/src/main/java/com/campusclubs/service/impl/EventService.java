package com.campusclubs.service.impl;

import com.campusclubs.dto.request.EventRequests.*;
import com.campusclubs.entity.nosql.Club;
import com.campusclubs.entity.nosql.Event;
import com.campusclubs.entity.nosql.Event.*;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.nosql.ClubRepository;
import com.campusclubs.repository.nosql.EventRepository;
import com.campusclubs.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository      eventRepo;
    private final ClubRepository       clubRepo;
    private final UserRepository       userRepo;
    private final NotificationService  notifService;

    // ── Query ──────────────────────────────────────────────────────────────
    public Page<Event>  getApproved(int page, int size) {
        return eventRepo.findByStatusOrderByEventDateDesc("APPROVED", PageRequest.of(page, size)).map(this::prepareForResponse);
    }
    public List<Event>  getByClub(String clubId)                 { return eventRepo.findByClub_ClubId(clubId).stream().map(this::prepareForResponse).toList(); }
    public List<Event>  getMyEvents(Long userId)                 { return eventRepo.findByCreatedByUserId(userId).stream().map(this::prepareForResponse).toList(); }
    public List<Event>  getMyRegistrations(Long userId)          { return eventRepo.findByRegisteredUserId(userId).stream().map(this::prepareForResponse).toList(); }
    public List<Event>  getPendingForClub(String clubId)         { return eventRepo.findByClub_ClubIdAndStatus(clubId,"PENDING").stream().map(this::prepareForResponse).toList(); }
    public Event        getById(String id)                       { return find(id); }

    // ── Create ─────────────────────────────────────────────────────────────
    @Transactional
    public Event createEvent(CreateEventRequest req, Long userId) {
        User  user  = findUser(userId);
        Club  club  = clubRepo.findById(req.getClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
        boolean isMember = club.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId))
                || (club.getCoordinator() != null && club.getCoordinator().getUserId().equals(userId));
        if (!isMember) throw new BadRequestException("You must be a club member to create events");

        List<RegistrationField> fields = req.getRegistrationFields() == null ? List.of() :
                req.getRegistrationFields().stream().map(f -> RegistrationField.builder()
                        .label(f.getLabel()).type(f.getType()).required(f.isRequired())
                        .options(f.getOptions()).build()).toList();

        boolean autoApprove = List.of("COORDINATOR", "ADMIN").contains(user.getRole().name())
                || (club.getCoordinator() != null && club.getCoordinator().getUserId().equals(userId));

        Event event = Event.builder()
                .title(req.getTitle()).description(req.getDescription())
                .category(req.getCategory()).venue(req.getVenue())
                .eventDate(req.getEventDate()).registrationDeadline(req.getRegistrationDeadline())
                .maxParticipants(req.getMaxParticipants() > 0 ? req.getMaxParticipants() : 50)
                .posterUrl(req.getPosterUrl()).registrationUrl(req.getRegistrationUrl())
                .club(ClubRef.builder().clubId(club.getId()).name(club.getName()).category(club.getCategory()).build())
                .createdBy(AuthorRef.builder().userId(userId).name(user.getName()).studentId(user.getStudentId()).build())
                .status(autoApprove ? "APPROVED" : "PENDING").registrationFields(fields).build();

        event = eventRepo.save(event);
        saveEventChair(club, event.getId(), req.getEventChairId());
        if (autoApprove) {
            notifService.create(null, "EVENT_CREATED",
                    "New Event Created",
                    user.getName() + " created a new event: \"" + event.getTitle() + "\"",
                    event.getId(), "EVENT");
        } else {
            notifService.create(null, "EVENT_CREATED",
                    "New Event Submitted",
                    user.getName() + " submitted \"" + event.getTitle() + "\" for approval",
                    event.getId(), "EVENT");
        }
        return event;
    }

    @Transactional
    public Event updateEvent(String eventId, UpdateEventRequest req, Long userId, String role) {
        Event event = find(eventId);
        Club club = clubRepo.findById(event.getClub().getClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Club not found"));

        boolean isCreator = event.getCreatedBy().getUserId().equals(userId);
        boolean isCoordinatorOfClub = club.getCoordinator() != null && club.getCoordinator().getUserId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role);

        if (!isCreator && !isCoordinatorOfClub && !isAdmin) {
            throw new BadRequestException("Not authorised to edit this event");
        }

        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setCategory(req.getCategory());
        event.setVenue(req.getVenue());
        event.setEventDate(req.getEventDate());
        event.setRegistrationDeadline(req.getRegistrationDeadline());
        event.setMaxParticipants(req.getMaxParticipants() > 0 ? req.getMaxParticipants() : 50);
        event.setRegistrationUrl(req.getRegistrationUrl());
        if (req.getRegistrationFields() != null) {
            event.setRegistrationFields(req.getRegistrationFields().stream()
                    .map(f -> RegistrationField.builder()
                            .label(f.getLabel())
                            .type(f.getType())
                            .required(f.isRequired())
                            .options(f.getOptions())
                            .build())
                    .toList());
        }
        if (req.getPosterUrl() != null) {
            event.setPosterUrl(req.getPosterUrl());
        }

        Event saved = eventRepo.save(event);
        saveEventChair(club, saved.getId(), req.getEventChairId());
        return saved;
    }

    // ── Review ─────────────────────────────────────────────────────────────
    @Transactional
    public Event reviewEvent(String eventId, ReviewEventRequest req, Long reviewerId) {
        if (!List.of("APPROVED","REJECTED").contains(req.getStatus()))
            throw new BadRequestException("Invalid status");
        Event event = find(eventId);
        event.setStatus(req.getStatus());
        event.setCoordinatorComment(req.getComment());
        event.setReviewedAt(Instant.now());
        event = eventRepo.save(event);
        notifService.create(event.getCreatedBy().getUserId(), "EVENT_" + req.getStatus(),
                "Event " + req.getStatus().charAt(0) + req.getStatus().substring(1).toLowerCase(),
                "\"" + event.getTitle() + "\" has been " + req.getStatus().toLowerCase(),
                eventId, "EVENT");
        return event;
    }

    // ── Delete ─────────────────────────────────────────────────────────────
    @Transactional
    public void deleteEvent(String eventId) {
        eventRepo.deleteById(eventId);
    }

    // ── Registration ───────────────────────────────────────────────────────
    @Transactional
    public Event register(String eventId, Long userId, RegisterForEventRequest req) {
        User  user  = findUser(userId);
        Event event = find(eventId);
        if (!"APPROVED".equals(event.getStatus())) throw new BadRequestException("Event not approved for registration");
        if (event.getRegistrationDeadline() != null && Instant.now().isAfter(event.getRegistrationDeadline()))
            throw new BadRequestException("Registration deadline has passed");
        if (event.getRegistrations().size() >= event.getMaxParticipants())
            throw new BadRequestException("Event is full");
        boolean already = event.getRegistrations().stream().anyMatch(r -> r.getUserId().equals(userId));
        if (already) throw new BadRequestException("Already registered");

        event.getRegistrations().add(Registration.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId).userName(user.getName()).studentId(user.getStudentId())
                .registeredAt(Instant.now()).answers(req.getAnswers()).build());
        return prepareForResponse(eventRepo.save(event));
    }

    @Transactional
    public Event unregister(String eventId, Long userId) {
        Event event = find(eventId);
        event.getRegistrations().removeIf(r -> r.getUserId().equals(userId));
        return prepareForResponse(eventRepo.save(event));
    }

    // ── Attendance ─────────────────────────────────────────────────────────
    @Transactional
    public Event markAttendance(String eventId, MarkAttendanceRequest req) {
        Event event = find(eventId);
        event.getRegistrations().stream()
                .filter(r -> r.getUserId().equals(req.getUserId()))
                .findFirst()
                .ifPresent(r -> r.setAttended(req.isAttended()));
        return prepareForResponse(eventRepo.save(event));
    }

    // ── Likes & Comments ───────────────────────────────────────────────────
    @Transactional
    public Event toggleLike(String eventId, Long userId) {
        Event event = find(eventId);
        if (event.getLikes().contains(userId)) event.getLikes().remove(userId);
        else event.getLikes().add(userId);
        return prepareForResponse(eventRepo.save(event));
    }

    @Transactional
    public Event addComment(String eventId, Long userId, String text) {
        User  user  = findUser(userId);
        Event event = find(eventId);
        event.getComments().add(Comment.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId).userName(user.getName())
                .text(text).createdAt(Instant.now()).build());
        return prepareForResponse(eventRepo.save(event));
    }

    private Event find(String id) {
        return prepareForResponse(eventRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id)));
    }
    private User findUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
    private void saveEventChair(Club club, String eventId, Long userId) {
        if (userId == null) return;
        club.getEventChairs().removeIf(ec -> ec.getEventId().equals(eventId));
        if (userId != 0) {
            User user = findUser(userId);
            club.getEventChairs().add(Club.EventChairAssignment.builder()
                    .userId(userId)
                    .name(user.getName())
                    .eventId(eventId)
                    .assignedAt(Instant.now())
                    .build());
        }
        clubRepo.save(club);
    }

    private Event prepareForResponse(Event event) {
        event.setLikedBy(event.getLikes().stream()
                .map(id -> Event.LikeRef.builder()
                        .userId(id)
                        .name(userRepo.findById(id).map(User::getName).orElse("User " + id))
                        .build())
                .toList());
        return event;
    }
}
