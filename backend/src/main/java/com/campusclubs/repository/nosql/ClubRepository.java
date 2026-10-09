package com.campusclubs.repository.nosql;

import com.campusclubs.entity.nosql.Club;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends MongoRepository<Club, String> {

    List<Club> findByActiveTrue();

    List<Club> findByCategoryAndActiveTrue(String category);

    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'active': true }")
    List<Club> searchByName(String name);

    Optional<Club> findByCoordinator_UserId(Long userId);

    @Query("{ 'members.userId': ?0 }")
    List<Club> findByMemberUserId(Long userId);

    @Query("{ 'pendingMembers.userId': ?0 }")
    List<Club> findByPendingMemberUserId(Long userId);
}
