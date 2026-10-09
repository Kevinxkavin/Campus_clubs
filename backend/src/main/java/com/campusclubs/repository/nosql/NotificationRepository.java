package com.campusclubs.repository.nosql;

import com.campusclubs.entity.nosql.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    /** Fetch personal + broadcast (recipientUserId == null) notifications. */
    @Query("{ $or: [ { 'recipientUserId': ?0 }, { 'recipientUserId': null } ] }")
    Page<Notification> findForUser(Long userId, Pageable pageable);

    @Query("{ $or: [ { 'recipientUserId': ?0 }, { 'recipientUserId': null } ], 'read': false }")
    List<Notification> findUnreadForUser(Long userId);

    long countByRecipientUserIdAndReadFalse(Long userId);
}
