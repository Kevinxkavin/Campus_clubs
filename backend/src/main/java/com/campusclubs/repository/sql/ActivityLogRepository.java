package com.campusclubs.repository.sql;

import com.campusclubs.entity.sql.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog>  findByUserId(Long userId);

    Page<ActivityLog>  findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<ActivityLog>  findByCreatedAtBetween(Instant from, Instant to);
}
