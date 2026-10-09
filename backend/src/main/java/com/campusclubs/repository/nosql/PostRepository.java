package com.campusclubs.repository.nosql;

import com.campusclubs.entity.nosql.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {

    Page<Post> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<Post> findByClubId(String clubId);

    List<Post> findByAuthorId(Long authorId);

    List<Post> findByClubIdAndStatus(String clubId, String status);
}
