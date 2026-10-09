package com.campusclubs.service.impl;

import com.campusclubs.entity.nosql.Notification;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.nosql.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;

    public Page<Notification> getForUser(Long userId, int page, int size) {
        return notifRepo.findForUser(userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    public List<Notification> getUnread(Long userId) {
        return notifRepo.findUnreadForUser(userId);
    }

    public long countUnread(Long userId) {
        return notifRepo.countByRecipientUserIdAndReadFalse(userId);
    }

    public Notification markRead(String notifId, Long userId) {
        Notification n = notifRepo.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setRead(true);
        return notifRepo.save(n);
    }

    public void markAllRead(Long userId) {
        List<Notification> unread = notifRepo.findUnreadForUser(userId);
        unread.forEach(n -> n.setRead(true));
        notifRepo.saveAll(unread);
    }

    /** Creates a notification; recipientUserId null = broadcast */
    public void create(Long recipientUserId, String type, String title, String message,
                       String entityId, String entityType) {
        notifRepo.save(Notification.builder()
                .recipientUserId(recipientUserId)
                .type(type).title(title).message(message)
                .entityId(entityId).entityType(entityType)
                .read(false).build());
    }

    public Notification createAnnouncement(String title, String message) {
        return notifRepo.save(Notification.builder()
                .recipientUserId(null)
                .type("ANNOUNCEMENT").title(title).message(message)
                .read(false).build());
    }
}
