package com.campusclubs.repository.nosql;

import com.campusclubs.entity.nosql.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {

    List<Event> findByClub_ClubId(String clubId);

    List<Event> findByClub_ClubIdAndStatus(String clubId, String status);

    List<Event> findByStatus(String status);

    Page<Event> findByStatusOrderByEventDateDesc(String status, Pageable pageable);

    @Query("{ 'registrations.userId': ?0 }")
    List<Event> findByRegisteredUserId(Long userId);

    @Query("{ 'createdBy.userId': ?0 }")
    List<Event> findByCreatedByUserId(Long userId);

    @Query("{ 'eventDate': { $gte: ?0, $lte: ?1 } }")
    List<Event> findByEventDateBetween(Instant from, Instant to);

    long countByClub_ClubId(String clubId);

    long countByClub_ClubIdAndStatus(String clubId, String status);
}
